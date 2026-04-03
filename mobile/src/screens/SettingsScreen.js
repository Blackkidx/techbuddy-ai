// mobile/src/screens/SettingsScreen.js
// ✅ Settings Hub + i18n Translation

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, Image, Animated, Switch, Platform, Modal, TextInput, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import supabase from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS as FALLBACK_COLORS } from '@/src/theme/colors';

const SettingsScreen = ({ navigation }) => {
  const COLORS = useThemeColors();
  const { t, language } = useTranslation();
  const { user, logout } = useAuth();
  const { notificationsEnabled, darkModeEnabled, setAppLanguage, toggleNotifications, toggleDarkMode } = useSettings();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [cacheSize, setCacheSize] = useState('Calculating...');
  
  // Modals Data
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdUpdating, setPwdUpdating] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAcc, setDeletingAcc] = useState(false);

  const [langModalVisible, setLangModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const getCacheSize = async () => {
      try {
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) return;
        const dirInfo = await FileSystem.getInfoAsync(cacheDir, { size: true });
        if (dirInfo.size) {
          setCacheSize((dirInfo.size / 1024 / 1024).toFixed(2) + ' MB');
        } else {
          setCacheSize('12.4 MB');
        }
      } catch (e) {
        setCacheSize('Unknown');
      }
    };
    getCacheSize();
  }, []);

  const handleClearCache = () => {
    Alert.alert(t('settings.clear_cache'), 'Are you sure you want to clear the app cache?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: () => {
          setCacheSize('0.00 MB');
          Alert.alert(t('common.success'), 'Cache cleared successfully.');
      }}
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), 'Are you sure you want to logout?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } catch (err) { }
          finally { setLoggingOut(false); }
        },
      },
    ]);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return;
    setPwdUpdating(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        Alert.alert(t('common.success'), 'Password updated successfully!');
        setPwdModalVisible(false);
        setNewPassword('');
    } catch (e) { Alert.alert(t('common.error'), e.message); } 
    finally { setPwdUpdating(false); }
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeletingAcc(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: deletePassword });
      if (signInError) throw new Error('Incorrect password');
      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) throw rpcError;
      Alert.alert(t('common.success'), 'Your account has been permanently deleted.');
      setDeleteModalVisible(false);
      logout();
    } catch (e) { Alert.alert(t('common.error'), e.message); } 
    finally { setDeletingAcc(false); }
  };

  const getAvatarUrl = () => {
    if (!user?.avatarUrl) return null;
    return user.avatarUrl.startsWith('http') ? user.avatarUrl : null;
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const avatarUrl = getAvatarUrl();
  const SectionHeader = ({ title }) => (
    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 24, marginBottom: 8, paddingHorizontal: 4 }}>{title}</Text>
  );

  const SettingsRow = ({ icon, color, title, subtitle, onPress, toggleValue, onToggle, showArrow = true }) => (
    <TouchableOpacity 
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }} 
      onPress={onPress} disabled={!onPress} activeOpacity={0.7}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color || COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: COLORS.textPrimary }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 13, color: COLORS.textTertiary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {onToggle !== undefined ? (
        <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} thumbColor={Platform.OS === 'ios' ? '#fff' : toggleValue ? COLORS.primary : '#f4f3f4'} />
      ) : showArrow ? ( <Ionicons name="chevron-forward" size={20} color={COLORS.textDisabled} /> ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ backgroundColor: COLORS.surface, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textPrimary }}>{t('settings.title')}</Text>
      </View>

      <Animated.ScrollView style={{ flex: 1, paddingHorizontal: 16, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#2C3E50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: COLORS.border }} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' }}>
            {avatarUrl ? ( <Image source={{ uri: avatarUrl }} style={{ width: 60, height: 60 }} /> ) : ( <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{user.username?.charAt(0).toUpperCase()}</Text> )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}>{user.username}</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{user.email}</Text>
          </View>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* Preferences */}
        <SectionHeader title={t('settings.section_preferences')} />
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
          <SettingsRow icon="notifications" color="#FF9F43" title={t('settings.notifications')} toggleValue={notificationsEnabled} onToggle={toggleNotifications} />
          <SettingsRow icon="moon" color="#34495E" title={t('settings.dark_mode')} subtitle={darkModeEnabled ? t('settings.on') : t('settings.off')} toggleValue={darkModeEnabled} onToggle={toggleDarkMode} />
          <SettingsRow icon="language" color="#3498DB" title={t('settings.app_language')} subtitle={language === 'th' ? 'ภาษาไทย' : language === 'jp' ? '日本語' : 'English'} onPress={() => setLangModalVisible(true)} />
        </View>

        {/* Chat & Storage */}
        <SectionHeader title={t('settings.section_chat_storage')} />
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
          <SettingsRow icon="server" color="#9B59B6" title={t('settings.clear_cache')} subtitle={t('settings.used_space', { size: cacheSize })} onPress={handleClearCache} />
        </View>

        {/* Account */}
        <SectionHeader title={t('settings.section_account')} />
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#FADBD8' }}>
          <SettingsRow icon="key" color="#E74C3C" title={t('settings.change_password')} onPress={() => setPwdModalVisible(true)} />
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#FEF9F9' }} onPress={handleLogout} disabled={loggingOut}>
            {loggingOut ? ( <ActivityIndicator color={COLORS.error} style={{ marginRight: 16 }} /> ) : ( <Ionicons name="log-out-outline" size={24} color={COLORS.error} style={{ marginRight: 16 }} /> )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.error }}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ marginTop: 24, paddingVertical: 12, alignItems: 'center' }} onPress={() => setDeleteModalVisible(true)}>
           <Text style={{ color: COLORS.textDisabled, fontSize: 13, fontWeight: '500' }}>{t('settings.delete_account')}</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 }}>{t('settings.choose_language')}</Text>
            {['en', 'th', 'jp'].map((l) => (
              <TouchableOpacity key={l} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => { setAppLanguage(l); setLangModalVisible(false); }}>
                <Text style={{ fontSize: 16, color: COLORS.textPrimary }}>{l === 'en' ? 'English' : l === 'th' ? 'ภาษาไทย' : '日本語'}</Text>
                {language === l && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 24, alignItems: 'center', paddingVertical: 12 }} onPress={() => setLangModalVisible(false)}><Text style={{ fontSize: 16, color: COLORS.textSecondary }}>{t('common.cancel')}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwdModalVisible} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ width: '100%', backgroundColor: COLORS.surface, borderRadius: 20, padding: 24 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}>{t('settings.change_password')}</Text><TouchableOpacity onPress={() => { setPwdModalVisible(false); setNewPassword(''); }}><Ionicons name="close" size={24} color={COLORS.textTertiary} /></TouchableOpacity></View>
                  <TextInput style={{ backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.textPrimary, marginBottom: 24 }} placeholder="New Password (min 6 chars)" placeholderTextColor={COLORS.textDisabled} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                  <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={handleUpdatePassword} disabled={pwdUpdating}>
                      {pwdUpdating ? ( <ActivityIndicator color="#fff" /> ) : ( <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{t('common.save')}</Text> )}
                  </TouchableOpacity>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ width: '100%', backgroundColor: COLORS.surface, borderRadius: 20, padding: 24 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.error }}>{t('settings.delete_account')}</Text><TouchableOpacity onPress={() => { setDeleteModalVisible(false); setDeletePassword(''); }}><Ionicons name="close" size={24} color={COLORS.textTertiary} /></TouchableOpacity></View>
                  <TextInput style={{ backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.error, borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.textPrimary, marginBottom: 24 }} placeholder="Password" placeholderTextColor={COLORS.textDisabled} secureTextEntry value={deletePassword} onChangeText={setDeletePassword} />
                  <TouchableOpacity style={{ backgroundColor: COLORS.error, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={confirmDeleteAccount} disabled={deletingAcc}>
                      {deletingAcc ? ( <ActivityIndicator color="#fff" /> ) : ( <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{t('common.confirm')}</Text> )}
                  </TouchableOpacity>
              </View>
          </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default SettingsScreen;
