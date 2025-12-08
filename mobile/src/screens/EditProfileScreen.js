// mobile/src/screens/EditProfileScreen.js
// ✅ MODERNIZED VERSION with Animations and Theme Integration

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../services/api';
import { getCurrentUser, updateProfile } from '../services/api_helper';
import { COLORS, SPACING, RADIUS, TEXT_STYLES, SHADOWS } from '../theme';
import CustomToast from '../components/CustomToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'jp', flag: '🇯🇵', name: 'Japanese' },
  { code: 'th', flag: '🇹🇭', name: 'Thai' },
];

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Form fields
  const [username, setUsername] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [learningLanguage, setLearningLanguage] = useState('th');
  const [avatarUri, setAvatarUri] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await getCurrentUser();

      setUsername(userData.username || '');
      setNativeLanguage(userData.nativeLanguage || 'en');
      setLearningLanguage(userData.learningLanguage || 'th');

      if (userData.avatarUrl) {
        const fullAvatarUrl = userData.avatarUrl.startsWith('http')
          ? userData.avatarUrl
          : `${API_URL.BASE}${userData.avatarUrl}`;
        setAvatarUri(fullAvatarUrl);
      }

      console.log('✅ User loaded for edit');
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      showToast('Failed to load profile', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // ==========================================
  // ✅ Pick Image from Gallery
  // ==========================================
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Camera roll permission is required!', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setAvatarUri(imageUri);
        await uploadAvatar(imageUri);
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      showToast('Failed to pick image', 'error');
    }
  };

  // ==========================================
  // ✅ Upload Avatar to Backend
  // ==========================================
  const uploadAvatar = async (imageUri) => {
    setUploadingAvatar(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showToast('Please login first', 'error');
        return;
      }

      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type: type,
      });

      console.log('📤 Uploading avatar...');

      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      if (response.data.success) {
        console.log('✅ Avatar uploaded:', response.data.avatarUrl);
        showToast('Profile picture updated!', 'success');

        const updatedUser = response.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('❌ Upload error:', error);

      let errorMessage = 'Failed to upload profile picture';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server';
      }

      showToast(errorMessage, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ==========================================
  // ✅ Save Profile Changes
  // ==========================================
  const handleSave = async () => {
    if (!username.trim()) {
      showToast('Username is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        username: username.trim(),
        nativeLanguage,
        learningLanguage,
      };

      console.log('📤 Updating profile:', profileData);

      const response = await updateProfile(profileData);

      if (response.success) {
        showToast('Profile updated! ✨', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={COLORS.primaryGradient} style={styles.header}>
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.headerButton, styles.saveButton]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <Animated.View
          style={[
            styles.avatarSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: avatarScale }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
          >
            <View style={styles.avatarRing}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={COLORS.primaryGradient} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {username.charAt(0).toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            <LinearGradient colors={COLORS.primaryGradient} style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} disabled={uploadingAvatar}>
            <Text style={styles.changePhotoText}>
              {uploadingAvatar ? 'Uploading...' : 'Change Profile Picture'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Form Fields */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Username */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={COLORS.text.tertiary} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={COLORS.text.disabled}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Native Language */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Native Language</Text>
            <View style={styles.languageSelector}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    nativeLanguage === lang.code && styles.languageButtonActive,
                  ]}
                  onPress={() => setNativeLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  {nativeLanguage === lang.code ? (
                    <LinearGradient colors={COLORS.primaryGradient} style={styles.languageGradient}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={styles.languageTextActive}>{lang.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.languageInner}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={styles.languageText}>{lang.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Learning Language */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Learning Language</Text>
            <View style={styles.languageSelector}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    learningLanguage === lang.code && styles.languageButtonActive,
                  ]}
                  onPress={() => setLearningLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  {learningLanguage === lang.code ? (
                    <LinearGradient colors={COLORS.successGradient} style={styles.languageGradient}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={styles.languageTextActive}>{lang.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.languageInner}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={styles.languageText}>{lang.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButtonLarge}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={saving ? [COLORS.surfaceLight, COLORS.surfaceLight] : COLORS.primaryGradient}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.text.secondary} />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    ...TEXT_STYLES.h3,
    color: '#fff',
  },
  content: {
    flex: 1,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.base,
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  changePhotoText: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.primary,
  },

  // Form
  form: {
    padding: SPACING.lg,
  },
  fieldContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    ...TEXT_STYLES.smallMedium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TEXT_STYLES.body,
    color: COLORS.text.primary,
    paddingVertical: SPACING.sm,
  },

  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  languageButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  languageButtonActive: {
    borderColor: 'transparent',
  },
  languageGradient: {
    paddingVertical: SPACING.base,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  languageInner: {
    paddingVertical: SPACING.base,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    gap: SPACING.xs,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageText: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
  },
  languageTextActive: {
    ...TEXT_STYLES.smallMedium,
    color: '#fff',
  },

  // Save Button Large
  saveButtonLarge: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  saveButtonText: {
    ...TEXT_STYLES.button,
    color: '#fff',
  },
});

export default EditProfileScreen;