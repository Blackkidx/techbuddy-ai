// mobile/src/components/DailyWordCard.js
// ✅ Premium Dark Theme with Animations & Toast

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AudioPlayer from './AudioPlayer';

const { width } = Dimensions.get('window');

// Dark Purple Theme Colors
const COLORS = {
  background: '#0f0a1a',
  surface: '#1a1425',
  card: '#2d2540',
  cardLight: '#3d3555',
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#8b5cf6',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  success: '#10b981',
  border: 'rgba(139, 92, 246, 0.3)',

  // Difficulty colors
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',

  // Gradients
  primaryGradient: ['#FF6B6B', '#ee5a5a'],
  secondaryGradient: ['#4ECDC4', '#3dbdb5'],
  accentGradient: ['#8b5cf6', '#7c3aed'],
};

// ========================================
// TOAST NOTIFICATION Component
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
    : type === 'warning'
      ? ['#f59e0b', '#d97706']
      : [COLORS.primary, '#ee5a5a'];

  const icon = type === 'success' ? 'checkmark-circle' : type === 'warning' ? 'alert-circle' : 'heart';

  return (
    <Animated.View style={[
      styles.toastContainer,
      { transform: [{ translateY }], opacity }
    ]}>
      <LinearGradient colors={bgColors} style={styles.toastGradient}>
        <Ionicons name={icon} size={20} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================
const DailyWordCard = ({ word, onSave, onMarkLearned, audioUrl }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
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

  if (!word) return null;

  const {
    thaiWord,
    pronunciation,
    englishTranslation,
    japaneseTranslation,
    culturalContext,
    category,
    difficulty,
    exampleSentence,
    userProgress = {},
  } = word;

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const getDifficultyColor = () => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return COLORS.beginner;
      case 'intermediate': return COLORS.intermediate;
      case 'advanced': return COLORS.advanced;
      default: return COLORS.accent;
    }
  };

  const getDifficultyLabel = () => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'ง่าย';
      case 'intermediate': return 'กลาง';
      case 'advanced': return 'ยาก';
      default: return difficulty || '';
    }
  };

  const handleSave = () => {
    onSave?.();
    showToast(
      userProgress.saved ? 'Removed from saved! 📑' : 'Word saved! 💾',
      'success'
    );
  };

  const handleMarkLearned = () => {
    if (!userProgress.learned) {
      onMarkLearned?.();
      showToast('Marked as learned! 🎉', 'success');
    }
  };

  return (
    <>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        }
      ]}>
        {/* Main Gradient Card */}
        <LinearGradient
          colors={COLORS.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badges}>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={12} color="#fff" />
                <Text style={styles.badgeText}>{category}</Text>
              </View>
              <LinearGradient
                colors={[getDifficultyColor(), getDifficultyColor() + 'cc']}
                style={styles.difficultyBadge}
              >
                <Text style={styles.badgeText}>{getDifficultyLabel()}</Text>
              </LinearGradient>
            </View>

            {/* Audio Player */}
            <AudioPlayer audioUrl={audioUrl} size="large" />
          </View>

          {/* Thai Word - Main Display */}
          <View style={styles.mainWordContainer}>
            <Text style={styles.thaiWord}>{thaiWord}</Text>
            <Text style={styles.pronunciation}>[{pronunciation}]</Text>
          </View>

          {/* Translations */}
          <View style={styles.translationsContainer}>
            <View style={styles.translationRow}>
              <View style={styles.flagBadge}>
                <Text style={styles.flagEmoji}>🇬🇧</Text>
              </View>
              <Text style={styles.translationText}>{englishTranslation}</Text>
            </View>
            {japaneseTranslation && (
              <View style={styles.translationRow}>
                <View style={styles.flagBadge}>
                  <Text style={styles.flagEmoji}>🇯🇵</Text>
                </View>
                <Text style={styles.translationText}>{japaneseTranslation}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Dark Info Card */}
        <View style={styles.infoCard}>
          {/* Cultural Context */}
          {culturalContext && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={COLORS.secondaryGradient} style={styles.sectionIcon}>
                  <Ionicons name="book" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Cultural Context</Text>
              </View>
              <Text style={styles.sectionText}>{culturalContext}</Text>
            </View>
          )}

          {/* Example Sentence */}
          {exampleSentence && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={COLORS.accentGradient} style={styles.sectionIcon}>
                  <Ionicons name="chatbox" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Example</Text>
              </View>
              <Text style={styles.exampleText}>"{exampleSentence}"</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                userProgress.saved && styles.actionButtonActive,
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Ionicons
                name={userProgress.saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={userProgress.saved ? '#fff' : COLORS.primary}
              />
              <Text style={[
                styles.actionText,
                userProgress.saved && styles.actionTextActive,
              ]}>
                {userProgress.saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonLearned,
                userProgress.learned && styles.actionButtonLearnedActive,
              ]}
              onPress={handleMarkLearned}
              disabled={userProgress.learned}
              activeOpacity={0.7}
            >
              <Ionicons
                name={userProgress.learned ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={userProgress.learned ? '#fff' : COLORS.success}
              />
              <Text style={[
                styles.actionText,
                styles.actionTextLearned,
                userProgress.learned && styles.actionTextActive,
              ]}>
                {userProgress.learned ? 'Learned ✓' : 'Mark as Learned'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
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

  // Container
  container: {
    width: width - 32,
    alignSelf: 'center',
    marginVertical: 16,
  },

  // Gradient Card
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Main Word
  mainWordContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  thaiWord: {
    fontSize: 64,
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

  // Translations
  translationsContainer: {
    gap: 12,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 18,
  },
  translationText: {
    fontSize: 18,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
  },

  // Info Card (Dark)
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginTop: -16,
    paddingTop: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginLeft: 38,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginLeft: 38,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
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
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionTextLearned: {
    color: COLORS.success,
  },
  actionTextActive: {
    color: '#fff',
  },
});

export default DailyWordCard;