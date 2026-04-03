// mobile/src/screens/ServerSettingsScreen.js
// ✅ Minimal Teal — Server Settings

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import supabase from '../services/supabase';
import { deleteServer } from '../services/serverService';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function ServerSettingsScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId } = useLocalSearchParams();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('member');

  useEffect(() => {
    if (serverId) loadSettings();
  }, [serverId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data: serverData, error: serverError } = await supabase.from('servers').select('*').eq('id', serverId).single();
      if (serverError) throw serverError;
      setServer(serverData);

      const { data: { session } } = await supabase.auth.getSession();
      const { data: memberData } = await supabase.from('server_members').select('role').eq('server_id', serverId).eq('user_id', session?.user?.id).single();
      if (memberData) setMyRole(memberData.role);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load server settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Server', 'Are you sure you want to leave this server?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.from('server_members').delete().eq('server_id', serverId).eq('user_id', session.user.id);
          router.replace('/(tabs)/servers');
        } catch (error) {
          Alert.alert('Error', 'Could not leave server');
        }
      }}
    ]);
  };

  const handleDeleteServer = () => {
    Alert.alert(
      'Delete Server',
      'Are you absolutely sure? This will permanently delete the server, all channels, and all members.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await deleteServer(serverId);
            router.replace('/(tabs)/servers');
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete server');
            setLoading(false);
          }
        }}
      ]
    );
  };

  if (loading) {
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
        <Text style={styles.headerTitle}>Server Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.iconContainer}>
            {server?.icon_url ? (
              <Ionicons name="image" size={48} color={COLORS.primary} /> 
            ) : (
              <Ionicons name="planet" size={48} color="#fff" />
            )}
        </View>
        <Text style={styles.serverName}>{server?.name}</Text>
        <Text style={styles.serverDesc}>{server?.description || 'No description provided.'}</Text>

        {/* GENERAL ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPTIONS</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push(`/server/${serverId}/invite`)}>
            <Ionicons name="person-add" size={20} color={COLORS.primary} />
            <Text style={styles.optionText}>Invite Friends</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
          {(myRole === 'owner' || myRole === 'admin') && (
            <TouchableOpacity style={styles.optionRow} onPress={() => router.push(`/server/${serverId}/create-channel`)}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.optionText}>Create Channel</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ADMIN ACTIONS */}
        {(myRole === 'owner' || myRole === 'admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADMIN SETTINGS</Text>
            <TouchableOpacity style={styles.optionRow} onPress={() => router.push(`/server/${serverId}/edit-server`)}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.optionText}>Edit Server Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => router.push(`/server/${serverId}/manage-members`)}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              <Text style={styles.optionText}>Manage Members</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => router.push(`/server/${serverId}/manage-categories`)}>
              <Ionicons name="folder-open-outline" size={20} color={COLORS.primary} />
              <Text style={styles.optionText}>Manage Categories</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* DANGER ZONE (OWNER ONLY) OR LEAVE (MEMBERS) */}
        {myRole === 'owner' ? (
          <View style={[styles.section, { borderTopWidth: 0, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, {color: COLORS.error}]}>DANGER ZONE</Text>
            <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteServer}>
              <Text style={styles.leaveText}>Delete Server</Text>
              <Ionicons name="trash" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.leaveText}>Leave Server</Text>
          </TouchableOpacity>
        )}
        <View style={{height: 40}} />
      </ScrollView>
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
  content: { flex: 1 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary,
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginTop: 32, marginBottom: 16,
  },
  serverName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  serverDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
  section: { marginTop: 32, borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textTertiary, paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.5 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  optionText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, marginLeft: 12, fontWeight: '600' },
  leaveBtn: { marginTop: 24, marginHorizontal: 16, backgroundColor: 'rgba(231, 76, 60, 0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  dangerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, borderBottomWidth: 0,
  },
  leaveText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
});
