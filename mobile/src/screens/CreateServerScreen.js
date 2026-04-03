// mobile/src/screens/CreateServerScreen.js
// ✅ Minimal Teal — Create a new Server

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createServer } from '../services/serverService';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function CreateServerScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a server name.');
      return;
    }

    setLoading(true);
    try {
      const server = await createServer(name.trim(), description.trim() || null);
      Alert.alert('Success', 'Server created!');
      router.replace({
        pathname: '/server/[serverId]',
        params: { serverId: server.id, serverName: server.name }
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Server</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconUploadBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="planet" size={40} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.uploadText}>Upload Logo (Optional)</Text>
        </View>

        <Text style={styles.label}>SERVER NAME <Text style={{color: COLORS.errorLight}}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My Workspace"
          placeholderTextColor={COLORS.textDisabled}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>DESCRIPTION (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What is this server about?"
          placeholderTextColor={COLORS.textDisabled}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity 
          style={[styles.createBtn, !name.trim() && styles.disabledBtn]} 
          onPress={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.createBtnText}>Create Server</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By creating a server, you agree to TechBuddy's Community Guidelines.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
    paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  content: { padding: 24, flex: 1 },
  iconUploadBox: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surfaceLight, borderWidth: 2, 
    borderColor: COLORS.primaryLight, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  uploadText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: COLORS.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  disabledBtn: { backgroundColor: COLORS.offline, shadowOpacity: 0 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  termsText: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: 16 },
});
