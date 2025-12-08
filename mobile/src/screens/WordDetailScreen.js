// mobile/src/screens/WordDetailScreen.js
// ✅ Premium Dark Theme with Animations & Toast

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AudioPlayer from '../components/AudioPlayer';
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
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  border: 'rgba(139, 92, 246, 0.3)',
  primaryGradient: ['#8b5cf6', '#7c3aed'],

  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

// ========================================
// TOAST NOTIFICATION
// ========================================
const Toast = ({ visible, message, type = 'success', onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide && onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColors = type === 'success'
    ? [COLORS.success, '#059669']
    : [COLORS.error, '#dc2626'];

  return (
    <Animated.View style={[
      styles.toastContainer,
      { transform: [{ translateY }], opacity }
    ]}>
      <LinearGradient colors={bgColors} style={styles.toastGradient}>
        <Ionicons
          name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color="#fff"
        />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
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
// MAIN SCREEN
// ========================================
const WordDetailScreen = ({ route, navigation }) => {
  const { wordId } = route.params;

  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchWordDetail();
  }, [wordId]);

  useEffect(() => {
    if (!loading && word) {
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
    }
  }, [loading, word]);

  const fetchWordDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await thaiTutorService.getWordDetail(wordId);
      setWord(data);
    } catch (err) {
      console.error('Error fetching word detail:', err);
      setError(err.message || 'Failed to load word');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

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
      showToast(word.userProgress?.saved ? 'Removed from saved!' : 'Word saved! 💾');
    } catch (error) {
      console.error('Error saving word:', error);
      showToast('Failed to save word', 'error');
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
      showToast('Marked as learned! 🎉');
    } catch (error) {
      console.error('Error marking learned:', error);
      showToast('Failed to mark as learned', 'error');
    }
  };

  const getAudioUrl = () => {
    if (!word?.audioUrl) return null;
    return thaiTutorService.getAudioUrl(word.audioUrl);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return COLORS.beginner;
      case 'intermediate': return COLORS.intermediate;
      case 'advanced': return COLORS.advanced;
      default: return COLORS.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading word...</Text>
        </View>
      </View>
    );
  }

  if (error || !word) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Word not found'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <LinearGradient colors={COLORS.primaryGradient} style={styles.retryButton}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.retryText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          {/* Word Card */}
          <LinearGradient
            colors={['#FF6B6B', '#ee5a5a']}
            style={styles.wordCard}
          >
            <View style={styles.wordHeader}>
              <View style={styles.badges}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.badgeText}>{word.category}</Text>
                </View>
                <LinearGradient
                  colors={[getDifficultyColor(word.difficulty), getDifficultyColor(word.difficulty) + 'cc']}
                  style={styles.difficultyBadge}
                >
                  <Text style={styles.badgeText}>{word.difficulty}</Text>
                </LinearGradient>
              </View>

              {word.userProgress?.learned && (
                <View style={styles.learnedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.learnedBadgeText}>Learned</Text>
                </View>
              )}
            </View>

            <View style={styles.wordMain}>
              <Text style={styles.thaiWord}>{word.thaiWord}</Text>
              <Text style={styles.pronunciation}>[{word.pronunciation}]</Text>
            </View>

            <View style={styles.translations}>
              <View style={styles.translationRow}>
                <Text style={styles.flag}>🇬🇧</Text>
                <Text style={styles.translationText}>{word.englishTranslation}</Text>
              </View>
              {word.japaneseTranslation && (
                <View style={styles.translationRow}>
                  <Text style={styles.flag}>🇯🇵</Text>
                  <Text style={styles.translationText}>{word.japaneseTranslation}</Text>
                </View>
              )}
            </View>

            {/* Audio Player */}
            {getAudioUrl() && (
              <View style={styles.audioContainer}>
                <AudioPlayer audioUrl={getAudioUrl()} size="large" color="#fff" />
                <Text style={styles.audioLabel}>Listen to pronunciation</Text>
              </View>
            )}
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                word.userProgress?.saved && styles.actionButtonActive,
              ]}
              onPress={handleSave}
            >
              <Ionicons
                name={word.userProgress?.saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={word.userProgress?.saved ? '#fff' : COLORS.primary}
              />
              <Text style={[
                styles.actionButtonText,
                word.userProgress?.saved && styles.actionButtonTextActive,
              ]}>
                {word.userProgress?.saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonLearned,
                word.userProgress?.learned && styles.actionButtonLearnedActive,
              ]}
              onPress={handleMarkLearned}
              disabled={word.userProgress?.learned}
            >
              <Ionicons
                name={word.userProgress?.learned ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={word.userProgress?.learned ? '#fff' : COLORS.success}
              />
              <Text style={[
                styles.actionButtonText,
                styles.actionButtonTextLearned,
                word.userProgress?.learned && styles.actionButtonTextActive,
              ]}>
                {word.userProgress?.learned ? 'Learned ✓' : 'Mark as Learned'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cultural Context */}
          {word.culturalContext && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={[COLORS.info, '#2563eb']} style={styles.sectionIcon}>
                  <Ionicons name="information-circle" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Cultural Context</Text>
              </View>
              <Text style={styles.sectionText}>{word.culturalContext}</Text>
            </View>
          )}

          {/* Example Sentence */}
          {word.exampleSentence && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={[COLORS.secondary, '#3dbdb5']} style={styles.sectionIcon}>
                  <Ionicons name="chatbox-ellipses" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Example</Text>
              </View>
              <Text style={styles.exampleText}>"{word.exampleSentence}"</Text>
            </View>
          )}

          {/* Progress */}
          {word.userProgress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={[COLORS.warning, '#d97706']} style={styles.sectionIcon}>
                  <Ionicons name="stats-chart" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Your Progress</Text>
              </View>
              <View style={styles.progressGrid}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>{word.userProgress.reviewCount || 0}</Text>
                  <Text style={styles.progressLabel}>Reviews</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>
                    {word.userProgress.lastReviewed
                      ? new Date(word.userProgress.lastReviewed).toLocaleDateString()
                      : 'Never'}
                  </Text>
                  <Text style={styles.progressLabel}>Last Review</Text>
                </View>
              </View>
            </View>
          )}
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

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

  // Word Card
  wordCard: {
    margin: 16,
    padding: 24,
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  learnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  learnedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  wordMain: {
    alignItems: 'center',
    marginBottom: 24,
  },
  thaiWord: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pronunciation: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  translations: {
    gap: 12,
    marginBottom: 20,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  translationText: {
    fontSize: 18,
    color: '#fff',
    flex: 1,
  },
  audioContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  audioLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },

  // Actions
  actionsCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonLearned: {
    borderColor: COLORS.success,
  },
  actionButtonLearnedActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButtonTextLearned: {
    color: COLORS.success,
  },
  actionButtonTextActive: {
    color: '#fff',
  },

  // Sections
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginLeft: 42,
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: 42,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default WordDetailScreen;
