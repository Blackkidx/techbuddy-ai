/* eslint-disable no-unused-vars */
// ProfileScreen.js - MODERNIZED VERSION with Animations
// ✅ Beautiful UI with theme integration and smooth animations

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Clipboard,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard2 from 'expo-clipboard';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, TEXT_STYLES, SHADOWS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_URL = 'https://cason-patellar-buena.ngrok-free.dev';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // ========================================
  // ✅ ANIMATIONS
  // ========================================
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.parallel([
      // Header fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Content slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // Scale in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Avatar bounce
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + (index * 100),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ========================================
  // ✅ HANDLERS
  // ========================================
  const handleCopyUserId = async () => {
    const idToCopy = user?.userId || user?.id;
    if (!idToCopy) return;

    try {
      await Clipboard2.setStringAsync(idToCopy);
      Alert.alert('Copied!', `User ID: ${idToCopy}`);
    } catch (err) {
      Clipboard.setString(idToCopy);
      Alert.alert('Copied!', `User ID: ${idToCopy}`);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch (err) {
            console.error('Logout error:', err);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const getLanguageFlag = (lang) => {
    const flags = { en: '🇬🇧', jp: '🇯🇵', th: '🇹🇭' };
    return flags[lang] || '🌍';
  };

  const getLanguageName = (lang) => {
    const names = { en: 'English', jp: 'Japanese', th: 'Thai' };
    return names[lang] || lang;
  };

  const getAvatarUrl = () => {
    if (!user?.avatarUrl) return null;
    if (user.avatarUrl.startsWith('http')) return user.avatarUrl;
    return `${BASE_URL}${user.avatarUrl}`;
  };

  // ========================================
  // ✅ LOADING STATE
  // ========================================
  if (!user) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </LinearGradient>
    );
  }

  const displayUserId = user.userId || user.id || 'N/A';
  const avatarUrl = getAvatarUrl();

  // ========================================
  // ✅ RENDER
  // ========================================
  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={COLORS.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </Animated.View>

        {/* Avatar Section */}
        <Animated.View
          style={[
            styles.avatarSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: avatarScale }],
            },
          ]}
        >
          <View style={styles.avatarRing}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#fff', '#f0f0f0']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User ID Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[0],
              transform: [
                { translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="finger-print" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>User ID</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyUserId}>
              <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userId}>{displayUserId}</Text>
        </Animated.View>

        {/* Languages Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[1],
              transform: [
                { translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <Ionicons name="language" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Languages</Text>
          </View>
          <View style={styles.languageRow}>
            <View style={styles.languageItem}>
              <Text style={styles.languageLabel}>Native</Text>
              <LinearGradient colors={COLORS.primaryGradient} style={styles.languageBadge}>
                <Text style={styles.languageFlag}>{getLanguageFlag(user.nativeLanguage)}</Text>
                <Text style={styles.languageName}>{getLanguageName(user.nativeLanguage)}</Text>
              </LinearGradient>
            </View>
            <View style={styles.languageArrowContainer}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.text.tertiary} />
            </View>
            <View style={styles.languageItem}>
              <Text style={styles.languageLabel}>Learning</Text>
              <View style={styles.languageBadgeSecondary}>
                <Text style={styles.languageFlag}>{getLanguageFlag(user.learningLanguage)}</Text>
                <Text style={styles.languageNameSecondary}>{getLanguageName(user.learningLanguage)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bio Card */}
        {user.bio && (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnims[2],
                transform: [
                  { translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.cardTitleRow}>
              <Ionicons name="document-text" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Bio</Text>
            </View>
            <Text style={styles.bioText}>{user.bio}</Text>
          </Animated.View>
        )}

        {/* Stats Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnims[3],
              transform: [
                { translateY: cardAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Stats</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <LinearGradient colors={COLORS.primaryGradient} style={styles.statIconBg}>
                <Ionicons name="chatbubbles" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <LinearGradient colors={COLORS.successGradient} style={styles.statIconBg}>
                <Ionicons name="people" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <LinearGradient colors={COLORS.infoGradient} style={styles.statIconBg}>
                <Ionicons name="globe" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Languages</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: cardAnims[4],
              transform: [
                { translateY: cardAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={COLORS.primaryGradient} style={styles.actionIconBg}>
              <Ionicons name="create" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon!')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={COLORS.infoGradient} style={styles.actionIconBg}>
              <Ionicons name="settings" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.7}
          >
            {loggingOut ? (
              <ActivityIndicator color={COLORS.error} style={{ marginLeft: 10 }} />
            ) : (
              <>
                <View style={styles.logoutIconBg}>
                  <Ionicons name="log-out" size={18} color={COLORS.error} />
                </View>
                <Text style={styles.logoutButtonText}>Logout</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.errorLight} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>TechBuddy v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with 💜</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ========================================
// ✅ STYLES
// ========================================
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
    color: COLORS.text.secondary,
    ...TEXT_STYLES.body,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: SPACING['3xl'],
    borderBottomLeftRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.h2,
    color: '#fff',
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.online,
    borderWidth: 3,
    borderColor: '#fff',
  },
  username: {
    ...TEXT_STYLES.h2,
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  email: {
    ...TEXT_STYLES.body,
    color: 'rgba(255,255,255,0.8)',
  },

  // Content
  content: {
    flex: 1,
    marginTop: -SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.text.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  copyButtonText: {
    ...TEXT_STYLES.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  userId: {
    ...TEXT_STYLES.h2,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 3,
  },

  // Language
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageItem: {
    flex: 1,
    alignItems: 'center',
  },
  languageLabel: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.sm,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  languageBadgeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  languageFlag: {
    fontSize: 18,
  },
  languageName: {
    ...TEXT_STYLES.smallMedium,
    color: '#fff',
  },
  languageNameSecondary: {
    ...TEXT_STYLES.smallMedium,
    color: COLORS.text.primary,
  },
  languageArrowContainer: {
    paddingHorizontal: SPACING.sm,
  },

  // Bio
  bioText: {
    ...TEXT_STYLES.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...TEXT_STYLES.h2,
    color: COLORS.text.primary,
  },
  statLabel: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
  },

  // Actions
  actionsContainer: {
    marginTop: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  actionButtonText: {
    flex: 1,
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.text.primary,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutButtonText: {
    flex: 1,
    ...TEXT_STYLES.bodyMedium,
    color: COLORS.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  footerText: {
    ...TEXT_STYLES.small,
    color: COLORS.text.tertiary,
  },
  footerSubtext: {
    ...TEXT_STYLES.small,
    color: COLORS.text.disabled,
    marginTop: SPACING.xs,
  },
});

export default ProfileScreen;