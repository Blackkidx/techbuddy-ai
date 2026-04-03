// mobile/src/screens/ManageMembersScreen.js
// ✅ Minimal Teal — Manage Members (Kick & Roles)

import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchServerMembers, kickMember, updateMemberRole } from '../services/serverService';
import { AuthContext } from '../contexts/AuthContext';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

export default function ManageMembersScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const myUserId = user?.id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRole, setMyRole] = useState('member');

  useEffect(() => {
    if (serverId) loadMembers();
  }, [serverId]);

  const loadMembers = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      else setRefreshing(true);
      
      const data = await fetchServerMembers(serverId);
      setMembers(data || []);

      const me = data?.find(m => m.profiles?.id === myUserId);
      if (me) setMyRole(me.role);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
    }
  };

  const handleMemberAction = (member) => {
    // Cannot manage yourself here (leave server is somewhere else)
    if (member.profiles.id === myUserId) return;
    
    // Only owner/admin can manage others
    if (myRole !== 'owner' && myRole !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to manage members.');
      return;
    }

    // Owner cannot be kicked or modified by anyone
    if (member.role === 'owner') {
      Alert.alert('Access Denied', 'The server owner cannot be modified.');
      return;
    }

    // Admins cannot kick other admins (unless myRole is owner)
    if (member.role === 'admin' && myRole !== 'owner') {
      Alert.alert('Access Denied', 'Only the server owner can manage admins.');
      return;
    }

    const isTargetAdmin = member.role === 'admin';
    const roleActionText = isTargetAdmin ? 'Demote to Member' : 'Promote to Admin';

    Alert.alert(
      `Manage ${member.profiles.username}`,
      'Choose an action:',
      [
        {
          text: roleActionText,
          onPress: () => confirmChangeRole(member, isTargetAdmin ? 'member' : 'admin')
        },
        {
          text: 'Kick from Server',
          style: 'destructive',
          onPress: () => confirmKick(member)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const confirmChangeRole = (member, newRole) => {
    Alert.alert(
      'Confirm Role Change',
      `Are you sure you want to change ${member.profiles.username} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              setLoading(true);
              await updateMemberRole(serverId, member.profiles.id, newRole);
              Alert.alert('Success', `Role updated to ${newRole}`);
              loadMembers();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to update role. Please ensure you have permission.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const confirmKick = (member) => {
    Alert.alert(
      'Confirm Kick',
      `Are you sure you want to kick ${member.profiles.username} from the server?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Kick', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await kickMember(serverId, member.profiles.id);
              Alert.alert('Success', 'Member kicked');
              loadMembers();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to kick member. Please ensure you have permission.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getRoleBadge = (role) => {
    if (role === 'owner') return <View style={[styles.roleBadge, {backgroundColor: 'rgba(241, 196, 15, 0.15)'}]}><Ionicons name="star" size={10} color="#f1c40f" /><Text style={[styles.roleText, {color: '#f1c40f'}]}>Owner</Text></View>;
    if (role === 'admin') return <View style={[styles.roleBadge, {backgroundColor: 'rgba(26, 188, 156, 0.15)'}]}><Ionicons name="shield-checkmark" size={10} color={COLORS.primary} /><Text style={[styles.roleText, {color: COLORS.primary}]}>Admin</Text></View>;
    return null;
  };

  const renderMember = ({ item }) => {
    const isMe = item.profiles?.id === myUserId;
    return (
      <TouchableOpacity 
        style={styles.memberRow}
        onPress={() => handleMemberAction(item)}
        disabled={isMe || (myRole === 'member')}
        activeOpacity={0.6}
      >
        <View style={styles.avatarContainer}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.profiles?.username || 'Unknown User'} {isMe && '(You)'}</Text>
          <View style={{flexDirection: 'row', marginTop: 4}}>
            {getRoleBadge(item.role)}
          </View>
        </View>

        {(myRole === 'owner' || myRole === 'admin') && !isMe && item.role !== 'owner' && (
           <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Members</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
        extraData={COLORS}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadMembers(true)} tintColor={COLORS.primary} />
          }
        />
      )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 12 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', gap: 4 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
