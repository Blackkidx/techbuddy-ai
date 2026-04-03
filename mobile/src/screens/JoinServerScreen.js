// mobile/src/screens/JoinServerScreen.js
// ✅ Minimal Teal — Join Server via Invite

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { joinServer } from '../services/serverService';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function JoinServerScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Required', 'Please enter an invite code.');
      return;
    }

    setLoading(true);
    try {
      const server = await joinServer(inviteCode.trim());
      Alert.alert(
        server.alreadyMember ? 'Already a Member' : 'Success',
        server.alreadyMember
          ? `You're already in ${server.name}. Taking you there!`
          : `You joined ${server.name}!`
      );
      router.replace({
        pathname: '/server/[serverId]',
        params: { serverId: server.id, serverName: server.name }
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to join server');
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
        <Text style={styles.headerTitle}>Join a Server</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="planet" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Enter an invite code</Text>
        <Text style={styles.subtitle}>
          Invite codes look like <Text style={styles.codeExample}>X9J2MD</Text>. Ask the server owner for one.
        </Text>

        <Text style={styles.label}>INVITE CODE</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter code here"
          placeholderTextColor={COLORS.textDisabled}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
        />

        <TouchableOpacity 
          style={[styles.joinBtn, !inviteCode.trim() && styles.disabledBtn]} 
          onPress={handleJoin}
          disabled={!inviteCode.trim() || loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.joinBtnText}>Join Server</Text>
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
  iconBox: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  codeExample: { fontWeight: '700', color: COLORS.textPrimary, backgroundColor: COLORS.surfaceLight },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 40 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: 2,
  },
  joinBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  disabledBtn: { backgroundColor: COLORS.offline, shadowOpacity: 0 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
