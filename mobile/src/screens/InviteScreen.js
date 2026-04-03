// mobile/src/screens/InviteScreen.js
// ✅ Minimal Teal — Server Invite Link Generator

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { generateInvite } from '../services/serverService';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function InviteScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId } = useLocalSearchParams();
  const [inviteCode, setInviteCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serverId) {
      loadInvite();
    }
  }, [serverId]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      const code = await generateInvite(serverId, 0); // 0 = unlimited max uses
      setInviteCode(code);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Copied', 'Invite code copied to clipboard!');
    }
  };

  const handleShare = async () => {
    if (inviteCode) {
      try {
        await Share.share({
          message: `Join my server on TechBuddy!\nCode: ${inviteCode}\n\nDownload the app to connect.`,
        });
      } catch (error) {
         console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
           <Ionicons name="mail-open" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Invite friends to this server!</Text>
        <Text style={styles.subtitle}>
          Share this invite code with your friends or colleagues.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Generating code...</Text>
          </View>
        ) : (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy} disabled={!inviteCode}>
             <Ionicons name="copy" size={20} color="#fff" />
             <Text style={styles.actionBtnText}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleShare} disabled={!inviteCode}>
             <Ionicons name="share-social" size={20} color={COLORS.primary} />
             <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Share Link</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
           This invite code will expire in 1 day and has unlimited uses.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  content: { padding: 24, flex: 1, alignItems: 'center' },
  iconBox: { marginBottom: 24, marginTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16, marginBottom: 32 },
  codeContainer: {
    backgroundColor: COLORS.surfaceLight, paddingVertical: 24, paddingHorizontal: 40,
    borderRadius: 16, borderWidth: 2, borderColor: COLORS.primaryLight, marginBottom: 32, borderStyle: 'dashed'
  },
  codeText: { fontSize: 32, fontWeight: '800', color: COLORS.primary, letterSpacing: 4 },
  loadingBox: { height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  actionRow: { flexDirection: 'row', gap: 16, width: '100%' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  actionBtnSecondary: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primaryLight, shadowOpacity: 0, elevation: 0
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  infoText: { marginTop: 32, fontSize: 12, color: COLORS.textTertiary, textAlign: 'center' },
});
