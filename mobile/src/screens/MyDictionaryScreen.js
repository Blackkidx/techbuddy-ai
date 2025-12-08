// mobile/src/screens/MyDictionaryScreen.js
// ✅ Premium Dark Theme with Animations

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import thaiTutorService from '../services/thaiTutorService';

// Dark Purple Theme
const COLORS = {
  background: '#0f0a1a',
  surface: '#1a1425',
  card: '#2d2540',
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#8b5cf6',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  success: '#10b981',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  border: 'rgba(139, 92, 246, 0.3)',
  primaryGradient: ['#8b5cf6', '#7c3aed'],
};

// ========================================
// LOADING SPINNER
// ========================================
const LoadingSpinner = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name="sync" size={40} color={COLORS.accent} />
    </Animated.View>
  );
};

// ========================================
// ANIMATED WORD ITEM
// ========================================
const AnimatedWordItem = ({ item, index, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 50, 300);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }}>
      <TouchableOpacity
        style={styles.wordItem}
        onPress={() => navigation.navigate('WordDetail', { wordId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.wordContent}>
          <View style={styles.wordTexts}>
            <Text style={styles.wordThai}>{item.thaiWord}</Text>
            <Text style={styles.wordPronunciation}>{item.pronunciation}</Text>
            <Text style={styles.wordEnglish}>{item.englishTranslation}</Text>
          </View>

          <View style={styles.wordMeta}>
            <View style={styles.categoryChip}>
              <Text style={styles.wordCategory}>{item.category}</Text>
            </View>
            <Text style={styles.wordDifficulty}>{item.difficulty}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ========================================
// MAIN SCREEN
// ========================================
const MyDictionaryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('saved');
  const [savedWords, setSavedWords] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0.95)).current;
  const tabIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(statsScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    fetchData();
  }, []);

  // Animate tab indicator
  useEffect(() => {
    Animated.spring(tabIndicator, {
      toValue: activeTab === 'saved' ? 0 : 1,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [saved, learned, userStats] = await Promise.all([
        thaiTutorService.getSavedWords(),
        thaiTutorService.getLearnedWords(),
        thaiTutorService.getUserStats(),
      ]);

      setSavedWords(saved);
      setLearnedWords(learned);
      setStats(userStats);
    } catch (err) {
      console.error('Error fetching dictionary:', err);
      setError(err.message || 'Failed to load dictionary');
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCard = () => (
    <Animated.View style={[
      styles.statsCard,
      { transform: [{ scale: statsScale }] }
    ]}>
      <LinearGradient
        colors={COLORS.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsGradient}
      >
        <Text style={styles.statsTitle}>Your Progress</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="bookmark" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats?.savedCount || 0}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats?.learnedCount || 0}</Text>
            <Text style={styles.statLabel}>Learned</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trending-up" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderTabButton = (label, value, icon) => {
    const isActive = activeTab === value;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(value)}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? COLORS.accent : COLORS.textMuted}
        />
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
        <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
            {value === 'saved' ? savedWords.length : learnedWords.length}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading your dictionary...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchData}>
            <LinearGradient colors={COLORS.primaryGradient} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentWords = activeTab === 'saved' ? savedWords : learnedWords;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={{ opacity: headerFade }}>
        <LinearGradient colors={COLORS.primaryGradient} style={styles.header}>
          <Text style={styles.headerTitle}>My Dictionary</Text>
          <Text style={styles.headerSubtitle}>Track your learning progress</Text>
        </LinearGradient>
      </Animated.View>

      {/* Stats Card */}
      {stats && renderStatsCard()}

      {/* Tab Container */}
      <View style={styles.tabContainer}>
        {renderTabButton('Saved', 'saved', 'bookmark')}
        {renderTabButton('Learned', 'learned', 'checkmark-circle')}
      </View>

      {/* Word List */}
      <FlatList
        data={currentWords}
        renderItem={({ item, index }) => (
          <AnimatedWordItem item={item} index={index} navigation={navigation} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'saved' ? 'bookmark-outline' : 'school-outline'}
              size={64}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'saved'
                ? 'No saved words yet'
                : 'No learned words yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'saved'
                ? 'Save words to review them later'
                : 'Mark words as learned to track your progress'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    margin: 16,
    marginTop: -8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  statsGradient: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.accent,
  },
  tabBadge: {
    backgroundColor: COLORS.textMuted,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: COLORS.accent,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Word Item
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wordContent: {
    flex: 1,
  },
  wordTexts: {
    marginBottom: 10,
  },
  wordThai: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  wordPronunciation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  wordEnglish: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  wordCategory: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  wordDifficulty: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default MyDictionaryScreen;