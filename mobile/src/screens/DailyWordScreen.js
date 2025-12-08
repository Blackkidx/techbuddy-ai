// mobile/src/screens/DailyWordScreen.js
// ✅ Premium Dark Theme with Animations

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DailyWordCard from '../components/DailyWordCard';
import thaiTutorService from '../services/thaiTutorService';

const { width } = Dimensions.get('window');

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
  error: '#ef4444',
  border: 'rgba(139, 92, 246, 0.3)',
  primaryGradient: ['#8b5cf6', '#7c3aed'],
};

// ========================================
// ANIMATED LOADING SPINNER
// ========================================
const LoadingSpinner = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }, { scale: pulseValue }] }}>
      <LinearGradient colors={COLORS.primaryGradient} style={styles.spinnerGradient}>
        <Ionicons name="language" size={32} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );
};

// ========================================
// MAIN SCREEN
// ========================================
const DailyWordScreen = ({ navigation }) => {
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchDailyWord = useCallback(async () => {
    try {
      console.log('📅 Fetching daily word...');
      setError(null);
      const data = await thaiTutorService.getDailyWord();
      console.log('✅ Got daily word:', data);
      setWord(data);
    } catch (err) {
      console.error('❌ Error fetching daily word:', err);
      setError(err.message || 'Failed to load daily word');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyWord();
  }, [fetchDailyWord]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDailyWord();
  }, [fetchDailyWord]);

  const handleSave = async () => {
    try {
      if (!word) return;
      await thaiTutorService.saveWord(word.id);
      setWord((prev) => ({
        ...prev,
        userProgress: {
          ...prev.userProgress,
          saved: !prev.userProgress?.saved,
        },
      }));
    } catch (error) {
      console.error('❌ Error saving word:', error);
    }
  };

  const handleMarkLearned = async () => {
    try {
      if (!word) return;
      await thaiTutorService.markLearned(word.id);
      setWord((prev) => ({
        ...prev,
        userProgress: {
          ...prev.userProgress,
          learned: true,
          reviewCount: (prev.userProgress?.reviewCount || 0) + 1,
        },
      }));
    } catch (error) {
      console.error('❌ Error marking learned:', error);
    }
  };

  const getAudioUrl = () => {
    if (!word?.audioUrl) return null;
    return thaiTutorService.getAudioUrl(word.audioUrl);
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading today's word...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDailyWord}>
            <LinearGradient colors={COLORS.primaryGradient} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={COLORS.primaryGradient} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Thai Tutor 🇹🇭</Text>
            <Text style={styles.headerSubtitle}>Word of the Day</Text>
          </View>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => navigation.navigate('MyDictionary')}
          >
            <Ionicons name="stats-chart" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {word && (
          <DailyWordCard
            word={word}
            audioUrl={getAudioUrl()}
            onSave={handleSave}
            onMarkLearned={handleMarkLearned}
          />
        )}

        {/* Quick Links */}
        <Animated.View style={[
          styles.quickLinksContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          <Text style={styles.quickLinksTitle}>Explore More</Text>

          <TouchableOpacity
            style={styles.quickLinkCard}
            onPress={() => navigation.navigate('Categories')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#4ECDC4', '#3dbdb5']} style={styles.quickLinkIcon}>
              <Ionicons name="grid-outline" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>Browse Categories</Text>
              <Text style={styles.quickLinkSubtitle}>Explore words by topic</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLinkCard}
            onPress={() => navigation.navigate('MyDictionary')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={COLORS.primaryGradient} style={styles.quickLinkIcon}>
              <Ionicons name="book-outline" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.quickLinkContent}>
              <Text style={styles.quickLinkTitle}>My Dictionary</Text>
              <Text style={styles.quickLinkSubtitle}>Review saved & learned words</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  spinnerGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Quick Links
  quickLinksContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  quickLinksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quickLinkSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default DailyWordScreen;