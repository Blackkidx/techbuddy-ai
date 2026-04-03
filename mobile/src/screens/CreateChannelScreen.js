// mobile/src/screens/CreateChannelScreen.js
// ✅ Minimal Teal — Create a new Channel

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import supabase from '../services/supabase'; // We should ideally add this to serverService, but direct works here
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function CreateChannelScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState('text');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !serverId) {
      Alert.alert('Required', 'Please enter a channel name.');
      return;
    }

    setLoading(true);
    try {
      // Create channel in general category (or no category) by default for now
      const { data, error } = await supabase
        .from('channels')
        .insert({
          server_id: serverId,
          name: name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: description.trim() || null,
          channel_type: channelType,
        })
        .select()
        .single();

      if (error) throw error;
      
      Alert.alert('Success', 'Channel created!');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to create channel');
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
        <Text style={styles.headerTitle}>Create Channel</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeBtn, channelType === 'text' && styles.typeBtnActive]}
            onPress={() => setChannelType('text')}
          >
            <Ionicons name="chatbubbles" size={20} color={channelType === 'text' ? COLORS.primary : COLORS.textTertiary} />
            <Text style={[styles.typeText, channelType === 'text' && styles.typeTextActive]}>Text</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, channelType === 'voice' && styles.typeBtnActive]}
            onPress={() => setChannelType('voice')}
          >
            <Ionicons name="volume-high" size={20} color={channelType === 'voice' ? COLORS.primary : COLORS.textTertiary} />
            <Text style={[styles.typeText, channelType === 'voice' && styles.typeTextActive]}>Voice</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>CHANNEL NAME <Text style={{color: COLORS.errorLight}}>*</Text></Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputPrefix}>#</Text>
          <TextInput
            style={styles.inputWithPrefix}
            placeholder="e.g. general"
            placeholderTextColor={COLORS.textDisabled}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>

        <Text style={styles.label}>DESCRIPTION (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What is this channel about?"
          placeholderTextColor={COLORS.textDisabled}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
        />

        <TouchableOpacity 
          style={[styles.createBtn, !name.trim() && styles.disabledBtn]} 
          onPress={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.createBtnText}>Create Channel</Text>
          )}
        </TouchableOpacity>
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
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceLight },
  typeText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.primary },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16,
  },
  inputPrefix: { fontSize: 18, fontWeight: '600', color: COLORS.textTertiary, marginRight: 4 },
  inputWithPrefix: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.textPrimary },
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
});
