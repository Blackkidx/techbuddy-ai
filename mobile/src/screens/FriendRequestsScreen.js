// mobile/src/screens/FriendRequestsScreen.js
// ✅ MODERNIZED VERSION with Animations and Theme Integration

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/config';
import { COLORS, SPACING, RADIUS, TEXT_STYLES, SHADOWS } from '../theme';
import CustomToast from '../components/CustomToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====================================
// MAIN COMPONENT
// ====================================
export default function FriendRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // ====================================
  // Load Friend Requests
  // ====================================
  const loadRequests = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(API_ENDPOINTS.FRIENDS.REQUESTS.PENDING, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const incomingRequests = response.data.requests.map(req => ({
        id: req.id,
        sender: req.user
      }));

      setRequests(incomingRequests);

    } catch (error) {
      console.error('❌ Load requests error:', error.response?.data || error.message);
      showToast('Failed to load friend requests', 'error');
    } finally {
      if (!isRefreshing) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ====================================
  // Handlers
  // ====================================
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests(true);
  }, [loadRequests]);

  const handleAccept = async (friendshipId, username) => {
    setProcessingId(friendshipId);
    try {
      const token = await AsyncStorage.getItem('token');

      await axios.post(API_ENDPOINTS.FRIENDS.ACCEPT(friendshipId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast(`You are now friends with ${username}!`, 'success');

      // Remove from local list with animation
      setRequests(prev => prev.filter(r => r.id !== friendshipId));

      // Refresh after a delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      console.error('❌ Accept request error:', error.response?.data || error.message);
      showToast('Failed to accept friend request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (friendshipId, username) => {
    setProcessingId(friendshipId);
    try {
      const token = await AsyncStorage.getItem('token');

      await axios.post(API_ENDPOINTS.FRIENDS.REJECT(friendshipId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast(`Rejected request from ${username}`, 'info');

      // Remove from local list
      setRequests(prev => prev.filter(r => r.id !== friendshipId));

    } catch (error) {
      console.error('❌ Reject request error:', error.response?.data || error.message);
      showToast('Failed to reject friend request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // ====================================
  // Initial Load
  // ====================================
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ====================================
  // Get Language Flag
  // ====================================
  const getLanguageFlag = (lang) => {
    const flags = { en: '🇬🇧', jp: '🇯🇵', th: '🇹🇭' };
    return flags[lang] || '🌍';
  };

  // ====================================
  // Render Item
  // ====================================
  const renderRequestItem = ({ item, index }) => {
    const sender = item.sender;
    const isProcessing = processingId === item.id;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }],
        }}
      >
        <View style={styles.requestCard}>
          {/* Sender Info */}
          <View style={styles.senderInfo}>
            <LinearGradient colors={COLORS.primaryGradient} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {sender.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </LinearGradient>
            <View style={styles.nameContainer}>
              <Text style={styles.senderName}>{sender.username}</Text>
              <Text style={styles.senderId}>{sender.userId}</Text>
              <View style={styles.languageRow}>
                <Text style={styles.languageFlag}>{getLanguageFlag(sender.nativeLanguage)}</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.text.tertiary} />
                <Text style={styles.languageFlag}>{getLanguageFlag(sender.learningLanguage)}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(item.id, sender.username)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={COLORS.error} />
                  <Text style={styles.rejectButtonText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(item.id, sender.username)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <LinearGradient colors={COLORS.successGradient} style={styles.acceptButtonGradient}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ====================================
  // Empty/Loading State
  // ====================================
  if (loading && !refreshing) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </LinearGradient>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={COLORS.infoGradient} style={styles.emptyIconBg}>
        <Ionicons name="notifications-off-outline" size={48} color="#fff" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Pending Requests</Text>
      <Text style={styles.emptySubtext}>
        When someone sends you a friend request, it will appear here.
      </Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={18} color={COLORS.text.primary} />
        <Text style={styles.backButtonText}>Back to Friends</Text>
      </TouchableOpacity>
    </View>
  );

  // ====================================
  // Main Render
  // ====================================
  return (
    <View style={styles.container}>
      {/* Header Stats */}
      {requests.length > 0 && (
        <Animated.View style={[styles.statsHeader, { opacity: fadeAnim }]}>
          <LinearGradient colors={COLORS.primaryGradient} style={styles.statsGradient}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color="#fff" />
                <Text style={styles.statNumber}>{requests.length}</Text>
                <Text style={styles.statLabel}>Pending {requests.length === 1 ? 'Request' : 'Requests'}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          requests.length === 0 && styles.fullList
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

// ====================================
// Styles
// ====================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.base,
  },
  fullList: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
  },

  // Stats Header
  statsHeader: {
    margin: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  statsGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  statsContent: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TEXT_STYLES.h1,
    color: '#fff',
    marginTop: SPACING.xs,
  },
  statLabel: {
    ...TEXT_STYLES.small,
    color: 'rgba(255,255,255,0.8)',
  },

  // Request Card
  requestCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameContainer: {
    flex: 1,
  },
  senderName: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  senderId: {
    ...TEXT_STYLES.small,
    color: COLORS.primary,
    marginBottom: 4,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  languageFlag: {
    fontSize: 16,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  acceptButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    gap: SPACING.xs,
  },
  acceptButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    gap: SPACING.xs,
  },
  rejectButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.error,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    ...TEXT_STYLES.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  backButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.text.primary,
  },
});