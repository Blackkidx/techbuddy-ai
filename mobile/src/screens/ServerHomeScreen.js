// mobile/src/screens/ServerHomeScreen.js
// ✅ Minimal Teal — Server Home (Categories & Channels list)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchServerChannels } from '../services/channelService';
import ServerMembersSheet from '../components/ServerMembersSheet';
import { useThemeColors } from '../contexts/ThemeContext';
import { COLORS } from '@/src/theme/colors';

const CHANNEL_ICONS = {
  general: 'chatbubbles',
  'ประกาศจากแอดมิน': 'megaphone',
  'การบ้าน': 'book',
};

export default function ServerHomeScreen() {
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { serverId, serverName } = useLocalSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (!serverId) return;
    if (!isRefreshing) setLoading(true);
    else setRefreshing(true);
    try {
      const groupedData = await fetchServerChannels(serverId);
      setCategories(groupedData);
    } catch (error) {
      console.error('❌ Failed to load server channels:', error.message);
      Alert.alert('Error', 'Failed to load channels');
    } finally {
      if (!isRefreshing) setLoading(false);
      else setRefreshing(false);
    }
  }, [serverId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenChannel = (channel) => {
    router.push({
      pathname: '/channel/[channelId]',
      params: {
        channelId: channel.id,
        channelName: channel.name,
        channelDescription: channel.description || '',
        serverId: serverId, // Pass serverId to fetch members
      },
    });
  };

  const getChannelIcon = (type, name) => {
    if (type === 'voice') return 'volume-high';
    return CHANNEL_ICONS[name] || 'chatbubble-outline';
  };

  const renderChannel = (channel) => (
    <TouchableOpacity
      key={channel.id}
      style={styles.channelRow}
      onPress={() => handleOpenChannel(channel)}
      activeOpacity={0.6}
    >
      <Ionicons name={getChannelIcon(channel.channel_type, channel.name)} size={20} color={COLORS.textTertiary} />
      <View style={styles.channelTextContainer}>
         <Text style={styles.channelName}>{channel.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => {
    // Hidden category if empty
    if (!item.channels || item.channels.length === 0) return null;

    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Ionicons name="chevron-down" size={14} color={COLORS.textTertiary} />
          <Text style={styles.categoryTitle}>{item.name.toUpperCase()}</Text>
        </View>
        <View style={styles.channelsList}>
          {item.channels.map(renderChannel)}
        </View>
      </View>
    );
  };

  if (!serverId) {
    return (
      <View style={styles.errorContainer}>
         <Text style={styles.errorText}>No Server ID provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{serverName || 'Server'}</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <TouchableOpacity onPress={() => setIsMembersVisible(true)}>
            <Ionicons name="people" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsBtn} 
            onPress={() => router.push({ pathname: '/server/[serverId]/settings', params: { serverId, serverName } })}
          >
             <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id.toString()}
            extraData={COLORS}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="server-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyText}>No channels in this server yet.</Text>
              </View>
            )}
          />
        )}
      </Animated.View>

      <ServerMembersSheet 
        visible={isMembersVisible} 
        onClose={() => setIsMembersVisible(false)} 
        serverId={serverId} 
      />
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.errorLight },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  settingsBtn: { padding: 4 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 60 },
  categoryContainer: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 },
  categoryTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.5 },
  channelsList: { backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  channelRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  channelTextContainer: { flex: 1, marginLeft: 12 },
  channelName: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 14, color: COLORS.textSecondary },
});
