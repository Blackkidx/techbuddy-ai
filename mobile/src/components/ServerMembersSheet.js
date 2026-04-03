// mobile/src/components/ServerMembersSheet.js
// ✅ Minimal Teal — Server Members Slide-out with Realtime Online Status

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  Modal, Animated, TouchableOpacity, Dimensions,
  ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../services/supabase';
import { fetchServerMembers } from '../services/serverService';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ServerMembersSheet({ visible, onClose, serverId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Animation for Slide In/Out
  useEffect(() => {
    if (visible) {
      setLoading(true);
      loadMembers();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 12
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  // Realtime Subscription
  useEffect(() => {
    if (!serverId || !visible) return;

    // Listen to profile updates (is_online changes)
    const channel = supabase
      .channel('public:profiles_members')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setMembers((prevMembers) => 
            prevMembers.map(m => {
              if (m.profiles?.id === payload.new.id) {
                return {
                  ...m,
                  profiles: { ...m.profiles, is_online: payload.new.is_online }
                };
              }
              return m;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serverId, visible]);

  const loadMembers = async () => {
    try {
      if (!serverId) return;
      const data = await fetchServerMembers(serverId);
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load server members:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'owner') return <Ionicons name="star" size={14} color="#f1c40f" />;
    if (role === 'admin') return <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />;
    return null;
  };

  const renderMember = ({ item }) => {
    const isOnline = item.profiles?.is_online;
    return (
      <View style={styles.memberRow}>
        <View style={styles.avatarContainer}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          {/* Online Indicator */}
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary }]} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, !isOnline && styles.offlineText]}>
            {item.profiles?.username || 'Unknown User'}
          </Text>
          {getRoleIcon(item.role)}
        </View>
      </View>
    );
  };

  // Grouping members by Online / Offline
  const onlineMembers = members.filter(m => m.profiles?.is_online);
  const offlineMembers = members.filter(m => !m.profiles?.is_online);

  const sections = [];
  if (onlineMembers.length > 0) sections.push({ title: `ONLINE — ${onlineMembers.length}`, data: onlineMembers });
  if (offlineMembers.length > 0) sections.push({ title: `OFFLINE — ${offlineMembers.length}`, data: offlineMembers });

  const renderSectionHeader = (title) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Members</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={sections.flatMap(s => [{ isHeader: true, title: s.title }, ...s.data])}
              keyExtractor={(item, index) => item.isHeader ? item.title : item.id.toString()}
              renderItem={({ item }) => {
                if (item.isHeader) return renderSectionHeader(item.title);
                return renderMember({ item });
              }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    backgroundColor: COLORS.background,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textTertiary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  offlineText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
