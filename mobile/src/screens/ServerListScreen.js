// mobile/src/screens/ServerListScreen.js
// ✅ Workspace Servers List (Discord-like Hub) + Fully Dynamic Dark Mode & i18n

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchMyServers } from '../services/serverService';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/TranslationContext';

const { width } = Dimensions.get('window');

// Dynamic style generator
const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 16 },
  headerContainer: {
    padding: 16, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  actionBtnTextLight: { fontSize: 13, fontWeight: '700', color: '#fff' },
  listContent: { padding: 16, paddingBottom: 100 },
  listEmptyContent: { flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  bigEmptyBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, elevation: 2, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  bigEmptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  serverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, padding: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#2C3E50', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  iconContainer: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  serverInfo: { flex: 1 },
  serverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  serverName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  serverDescription: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  roleBadgeContainer: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: COLORS.surfaceLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primaryDark },
});

export default function ServerListScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS); // Calculate live styles
  const { t } = useTranslation();
  const router = useRouter();

  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadServers = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchMyServers();
      setServers(data);
    } catch (error) {
      console.error('❌ Failed to load servers:', error.message);
    } finally {
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServers();
    }, [loadServers])
  );

  const handleOpenServer = (server) => {
    router.push({
      pathname: '/server/[serverId]',
      params: {
        serverId: server.id,
        serverName: server.name,
      },
    });
  };

  const renderServer = useCallback(({ item, index }) => {
    const itemFade = new Animated.Value(0);
    const itemSlide = new Animated.Value(30);
    Animated.parallel([
      Animated.timing(itemFade, { toValue: 1, duration: 350, delay: index * 40, useNativeDriver: true }),
      Animated.spring(itemSlide, { toValue: 0, friction: 8, tension: 40, delay: index * 40, useNativeDriver: true }),
    ]).start();

    return (
      <Animated.View style={{ opacity: itemFade, transform: [{ translateY: itemSlide }] }}>
        <TouchableOpacity
          style={styles.serverCard}
          onPress={() => handleOpenServer(item)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
             <Ionicons name="planet" size={28} color="#fff" />
          </View>

          <View style={styles.serverInfo}>
            <View style={styles.serverNameRow}>
              <Ionicons name="server" size={16} color={COLORS.textTertiary} />
              <Text style={styles.serverName}>{item.name}</Text>
            </View>
            <Text style={styles.serverDescription} numberOfLines={2}>
              {item.description || t('servers.tap_to_enter') || 'Tap to enter server'}
            </Text>
            
            <View style={styles.roleBadgeContainer}>
               <Text style={styles.roleBadgeText}>
                 {item.myRole === 'owner' ? t('servers.role_owner') || '👑 Owner' : item.myRole === 'admin' ? t('servers.role_admin') || '🛡️ Admin' : t('servers.role_member') || '👤 Member'}
               </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [COLORS, styles, t, handleOpenServer]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('servers.loading') || 'Loading servers...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('servers.all_servers') || 'All Servers'}</Text>
            <Text style={styles.headerSubtitle}>
              {t('servers.server_count', { count: servers.length }) || `You are in ${servers.length} server(s)`}
            </Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/server/join')}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>{t('servers.join') || 'Join'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => router.push('/server/create')}>
              <Ionicons name="create" size={20} color="#fff" />
              <Text style={styles.actionBtnTextLight}>{t('servers.create') || 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <FlatList
        data={servers}
        renderItem={renderServer}
        keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
        extraData={COLORS}
        contentContainerStyle={[styles.listContent, servers.length === 0 && styles.listEmptyContent]}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="planet" size={48} color="#fff" />
            </View>
            <Text style={styles.emptyTitle}>{t('servers.no_servers') || 'No Servers Yet'}</Text>
            <Text style={styles.emptySubtitle}>
              {t('servers.no_servers_desc') || "You aren't a member of any servers. Create a new server or join one using an invite code!"}
            </Text>
            <TouchableOpacity style={styles.bigEmptyBtn} onPress={() => router.push('/server/create')}>
              <Text style={styles.bigEmptyBtnText}>{t('servers.create_first') || 'Create My First Server'}</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadServers(true)} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
