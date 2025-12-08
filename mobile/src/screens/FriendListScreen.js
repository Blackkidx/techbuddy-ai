// mobile/src/screens/FriendListScreen.js
// ✅ MODERNIZED VERSION with Animations and Theme Integration

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/config';
import { filterValidFriends, removeDuplicateFriends } from '../utils/friendHelpers';
import { COLORS, SPACING, RADIUS, TEXT_STYLES, SHADOWS } from '../theme';
import CustomToast from '../components/CustomToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// ✅ MAIN COMPONENT
// ==========================================
export default function FriendListScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

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

  // Modal animation
  useEffect(() => {
    if (showAddFriend) {
      Animated.parallel([
        Animated.spring(modalScale, { toValue: 1, friction: 8, useNativeDriver: true }),
        Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
    }
  }, [showAddFriend]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // ====================================
  // ✅ Load Friends
  // ====================================
  const loadFriends = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('📥 Loading friends...');

      const friendsResponse = await axios.get(API_ENDPOINTS.FRIENDS.LIST, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const rawFriends = friendsResponse.data.friends || [];
      const validFriends = filterValidFriends(rawFriends);
      const uniqueFriends = removeDuplicateFriends(validFriends);

      const pendingResponse = await axios.get(API_ENDPOINTS.FRIENDS.REQUESTS.PENDING, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const pendingRequests = pendingResponse.data.requests || [];

      console.log(`✅ Final: ${uniqueFriends.length} friends, ${pendingRequests.length} pending`);

      setFriends(uniqueFriends);
      setFilteredFriends(uniqueFriends);
      setPendingCount(pendingRequests.length);

    } catch (error) {
      console.error('❌ Load friends error:', error.response?.data || error.message);
      showToast('Failed to load friends', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );

  // ====================================
  // ✅ Search Filter
  // ====================================
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.userId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  // ====================================
  // ✅ Navigate to Chat
  // ====================================
  const handleStartChat = useCallback((friend) => {
    if (!friend || !friend.userId) {
      console.error('❌ Invalid friend object for chat:', friend);
      showToast('Cannot start chat with this friend', 'error');
      return;
    }

    console.log('💬 Starting chat with friend:', { userId: friend.userId, username: friend.username });

    const parentNav = navigation.getParent();
    const navParams = {
      friend: {
        id: friend.id,
        userId: friend.userId,
        username: friend.username,
        email: friend.email,
        nativeLanguage: friend.nativeLanguage,
        learningLanguage: friend.learningLanguage,
        avatarUrl: friend.avatarUrl,
        isOnline: friend.isOnline,
        lastSeen: friend.lastSeen,
      }
    };

    if (parentNav) {
      parentNav.navigate('ChatScreen', navParams);
    } else {
      navigation.navigate('ChatScreen', navParams);
    }
  }, [navigation]);

  // ====================================
  // ✅ Add Friend
  // ====================================
  const handleAddFriend = async () => {
    if (!friendIdInput.trim()) {
      showToast('Please enter a User ID', 'warning');
      return;
    }

    setAddingFriend(true);

    try {
      const token = await AsyncStorage.getItem('token');
      console.log('📤 Adding friend with userId:', friendIdInput.trim());

      const payload = { friendUserId: friendIdInput.trim() };

      const response = await axios.post(
        API_ENDPOINTS.FRIENDS.ADD,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201 || response.data.success) {
        console.log('✅ Friend request sent successfully');
        showToast('Friend request sent!', 'success');
        setShowAddFriend(false);
        setFriendIdInput('');
        loadFriends();
      }

    } catch (error) {
      if (error.response?.data?.message === 'Friend request already sent') {
        showToast('Friend request already sent!', 'info');
      } else {
        console.error('❌ Add friend error:', error.response?.data || error.message);
        showToast(
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to add friend',
          'error'
        );
      }
    } finally {
      setAddingFriend(false);
    }
  };

  // ====================================
  // Remove Friend
  // ====================================
  const handleRemoveFriend = useCallback((friend) => {
    showToast(`Remove ${friend.username}?`, 'warning');
    // For simplicity, using toast. In production, use a custom modal.
    setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const removeUrl = API_ENDPOINTS.FRIENDS.REMOVE(friend.id);

        await axios.delete(removeUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });

        showToast('Friend removed', 'success');
        loadFriends();

      } catch (error) {
        console.error('❌ Remove friend error:', error);
        showToast('Failed to remove friend', 'error');
      }
    }, 500);
  }, [loadFriends]);

  // ====================================
  // Refresh
  // ====================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  }, [loadFriends]);

  // ====================================
  // Render Friend Item
  // ====================================
  const renderFriend = useCallback(({ item, index }) => (
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
      <TouchableOpacity
        style={styles.friendCard}
        onPress={() => handleStartChat(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient colors={COLORS.primaryGradient} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.username?.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.isOnline ? COLORS.online : COLORS.offline }
          ]} />
        </View>

        {/* Info */}
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.username}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
          <View style={styles.languageContainer}>
            <Ionicons name="language" size={12} color={COLORS.text.tertiary} />
            <Text style={styles.languageText}>
              {item.nativeLanguage?.toUpperCase()} → {item.learningLanguage?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleStartChat(item);
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFriend(item);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [fadeAnim, handleStartChat, handleRemoveFriend]);

  // ====================================
  // Loading State
  // ====================================
  if (loading && !refreshing) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </LinearGradient>
    );
  }

  // ====================================
  // Empty State
  // ====================================
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={COLORS.primaryGradient} style={styles.emptyIconBg}>
        <Ionicons name="people-outline" size={48} color="#fff" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Friends Yet</Text>
      <Text style={styles.emptyText}>
        Add friends to start chatting and learning together!
      </Text>
      <TouchableOpacity
        style={styles.addButtonEmpty}
        onPress={() => setShowAddFriend(true)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={COLORS.primaryGradient} style={styles.addButtonGradient}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Friend</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ====================================
  // Main Render
  // ====================================
  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.text.disabled}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddFriend(true)}
            activeOpacity={0.7}
          >
            <LinearGradient colors={COLORS.primaryGradient} style={styles.headerButtonGradient}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.headerButtonText}>Add Friend</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButtonSecondary}
            onPress={() => navigation.navigate('FriendRequests')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={18} color={COLORS.text.primary} />
            <Text style={styles.headerButtonTextSecondary}>Requests</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Friend List */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriend}
        keyExtractor={(item) => `friend-${item.userId}-${item.id}`}
        contentContainerStyle={[
          styles.list,
          filteredFriends.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriend}
        transparent
        animationType="none"
        onRequestClose={() => setShowAddFriend(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <LinearGradient colors={COLORS.primaryGradient} style={styles.modalIconBg}>
                  <Ionicons name="person-add" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.modalTitle}>Add Friend</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddFriend(false);
                setFriendIdInput('');
              }}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Enter User ID</Text>
            <View style={styles.modalInputContainer}>
              <Ionicons name="finger-print" size={20} color={COLORS.text.tertiary} />
              <TextInput
                style={styles.modalInput}
                placeholder="TB000001"
                value={friendIdInput}
                onChangeText={setFriendIdInput}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholderTextColor={COLORS.text.disabled}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddFriend(false);
                  setFriendIdInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddFriend}
                disabled={addingFriend}
                activeOpacity={0.8}
              >
                <LinearGradient colors={COLORS.primaryGradient} style={styles.confirmButtonGradient}>
                  {addingFriend ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={16} color="#fff" />
                      <Text style={styles.confirmButtonText}>Send Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
// STYLES
// ====================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
  },
  list: {
    padding: SPACING.base,
  },
  emptyList: {
    flexGrow: 1,
  },

  // Header
  header: {
    padding: SPACING.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.base,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TEXT_STYLES.body,
    color: COLORS.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    gap: SPACING.xs,
  },
  headerButtonText: {
    ...TEXT_STYLES.smallMedium,
    color: '#fff',
  },
  headerButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  headerButtonTextSecondary: {
    ...TEXT_STYLES.smallMedium,
    color: COLORS.text.primary,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...TEXT_STYLES.small,
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },

  // Friend Card
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.base,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  friendEmail: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languageText: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
  emptyText: {
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  addButtonEmpty: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  addButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: '#fff',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modalIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...TEXT_STYLES.h3,
    color: COLORS.text.primary,
  },
  modalLabel: {
    ...TEXT_STYLES.smallMedium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  modalInput: {
    flex: 1,
    ...TEXT_STYLES.body,
    color: COLORS.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.base,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  cancelButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.text.secondary,
  },
  confirmButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    gap: SPACING.xs,
  },
  confirmButtonText: {
    ...TEXT_STYLES.bodyMedium,
    color: '#fff',
  },
});