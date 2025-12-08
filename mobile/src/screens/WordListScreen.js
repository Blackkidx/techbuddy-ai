// mobile/src/screens/WordListScreen.js
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
  accent: '#8b5cf6',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  success: '#10b981',
  error: '#ef4444',
  border: 'rgba(139, 92, 246, 0.3)',
  primaryGradient: ['#8b5cf6', '#7c3aed'],

  // Difficulty
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
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
// ANIMATED WORD CARD
// ========================================
const AnimatedWordCard = ({ item, index, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return COLORS.beginner;
      case 'intermediate': return COLORS.intermediate;
      case 'advanced': return COLORS.advanced;
      default: return COLORS.textMuted;
    }
  };

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }}>
      <TouchableOpacity
        style={styles.wordCard}
        onPress={() => navigation.navigate('WordDetail', { wordId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.wordHeader}>
          <View style={styles.wordMain}>
            <Text style={styles.thaiWord}>{item.thaiWord}</Text>
            <Text style={styles.pronunciation}>{item.pronunciation}</Text>
          </View>

          <LinearGradient
            colors={[getDifficultyColor(item.difficulty), getDifficultyColor(item.difficulty) + 'cc']}
            style={styles.difficultyBadge}
          >
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.englishText}>{item.englishTranslation}</Text>

        {item.japaneseTranslation && (
          <Text style={styles.japaneseText}>{item.japaneseTranslation}</Text>
        )}

        {item.userProgress?.learned && (
          <View style={styles.learnedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.learnedText}>Learned</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ========================================
// MAIN SCREEN
// ========================================
const WordListScreen = ({ route, navigation }) => {
  const { category } = route.params;

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWords();
  }, [category]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await thaiTutorService.getWordsByCategory(category);
      setWords(data);
    } catch (err) {
      console.error('Error fetching words:', err);
      setError(err.message || 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter((word) => {
    if (filter === 'all') return true;
    return word.difficulty?.toLowerCase() === filter;
  });

  const renderFilterButton = (label, value, color) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && { backgroundColor: color || COLORS.accent },
      ]}
      onPress={() => setFilter(value)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterText,
        filter === value && styles.filterTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading words...</Text>
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
          <TouchableOpacity onPress={fetchWords}>
            <LinearGradient colors={COLORS.primaryGradient} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={COLORS.primaryGradient} style={styles.header}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <Text style={styles.wordCount}>
          {filteredWords.length} of {words.length} words
        </Text>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('All', 'all', COLORS.accent)}
        {renderFilterButton('Beginner', 'beginner', COLORS.beginner)}
        {renderFilterButton('Intermediate', 'intermediate', COLORS.intermediate)}
        {renderFilterButton('Advanced', 'advanced', COLORS.advanced)}
      </View>

      {/* Word List */}
      <FlatList
        data={filteredWords}
        renderItem={({ item, index }) => (
          <AnimatedWordCard item={item} index={index} navigation={navigation} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No words found</Text>
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
    padding: 20,
    paddingTop: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  wordCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
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

  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Word Card
  wordCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wordMain: {
    flex: 1,
  },
  thaiWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  englishText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  japaneseText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  learnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  learnedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
  },
});

export default WordListScreen;