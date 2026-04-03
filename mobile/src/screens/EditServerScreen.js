// mobile/src/screens/EditServerScreen.js
// ✅ Minimal Teal — Edit Server Profile (Owner Only)

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import supabase from '../services/supabase';
import { updateServer } from '../services/serverService';
import { uploadAttachment } from '../services/channelService';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function EditServerScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId } = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState(null);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (serverId) loadServerDetails();
  }, [serverId]);

  const loadServerDetails = async () => {
    try {
      const { data, error } = await supabase.from('servers').select('*').eq('id', serverId).single();
      if (error) throw error;
      
      setName(data.name);
      setDescription(data.description || '');
      setIconUrl(data.icon_url);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load server details');
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePickIcon = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload a server logo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setIconUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Server name cannot be empty.');
      return;
    }

    try {
      setUpdating(true);
      let finalIconUrl = iconUrl;
      
      // If the icon is a local file URI (picked from photo library), upload it first
      if (iconUrl && iconUrl.startsWith('file://')) {
        const uploaded = await uploadAttachment(iconUrl, 'image');
        finalIconUrl = uploaded.url;
      }

      await updateServer(serverId, {
        name: name.trim(),
        description: description.trim() || null,
        icon_url: finalIconUrl
      });

      Alert.alert('Success', 'Server updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update server');
    } finally {
      setUpdating(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Server</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView style={styles.content}>
          <TouchableOpacity style={styles.iconUploadBox} onPress={handlePickIcon} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              {iconUrl ? (
                // Assuming we have an image component or we just show an icon
                // If it's a real app, use <Image source={{uri: iconUrl}} />
                <Ionicons name="image" size={40} color={COLORS.primaryLight} />
              ) : (
                <Ionicons name="planet" size={40} color={COLORS.primaryLight} />
              )}
            </View>
            <Text style={styles.uploadText}>{iconUrl ? 'Change Logo' : 'Upload Logo'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>SERVER NAME <Text style={{color: COLORS.errorLight}}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. My Awesome Club"
            placeholderTextColor={COLORS.textDisabled}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />

          <Text style={styles.label}>DESCRIPTION (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this server about?"
            placeholderTextColor={COLORS.textDisabled}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={120}
          />

          <TouchableOpacity 
            style={[styles.createBtn, (!name.trim() || updating) && styles.createBtnDisabled]}
            onPress={handleUpdate}
            disabled={!name.trim() || updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  content: { padding: 24, paddingTop: 40 },
  iconUploadBox: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textTertiary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: COLORS.textPrimary, marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  createBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  createBtnDisabled: { backgroundColor: COLORS.surfaceLight, opacity: 0.7 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
