// mobile/src/screens/CategoriesScreen.js
// ✅ Premium Dark Theme with Stagger Animations

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import thaiTutorService from '../services/thaiTutorService';

const { width } = Dimensions.get('window');

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
  error: '#ef4444',
  border: 'rgba(139, 92, 246, 0.3)',
  primaryGradient: ['#8b5cf6', '#7c3aed'],
};

// Category gradient colors
const CATEGORY_GRADIENTS = [
  ['#FF6B6B', '#ee5a5a'],
  ['#4ECDC4', '#3dbdb5'],
  ['#FFD93D', '#f5c800'],
  ['#95E1D3', '#6dd5c7'],
  ['#F38181', '#e86c6c'],
  ['#AA96DA', '#9683cc'],
  ['#FCBAD3', '#f9a5c5'],
  ['#A8E6CF', '#91dfc1'],
  ['#8b5cf6', '#7c3aed'],
  ['#4facfe', '#00f2fe'],
];

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
// ANIMATED CATEGORY CARD
// ========================================
const AnimatedCategoryCard = ({ item, index, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 80;
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const categoryName = item.category || item.name;
  const categoryCount = item.count || 0;
  const gradientColors = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

  const getCategoryIcon = (name) => {
    if (!name) return 'apps-outline';
    const icons = {
      conversation: 'chatbubbles-outline',
      food: 'restaurant-outline',
      work: 'briefcase-outline',
      tech: 'code-slash-outline',
      greeting: 'hand-left-outline',
      greetings: 'hand-left-outline',
      encouragement: 'trophy-outline',
      numbers: 'calculator-outline',
      colors: 'color-palette-outline',
      family: 'people-outline',
      shopping: 'cart-outline',
      travel: 'airplane-outline',
      time: 'time-outline',
      weather: 'partly-sunny-outline',
      emotions: 'happy-outline',
    };
    return icons[name.toLowerCase()] || 'apps-outline';
  };

  if (!categoryName) return null;

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: scaleAnim },
      ],
    }}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => navigation.navigate('WordList', { category: categoryName })}
        activeOpacity={0.7}
      >
        <LinearGradient colors={gradientColors} style={styles.iconContainer}>
          <Ionicons name={getCategoryIcon(categoryName)} size={28} color="#fff" />
        </LinearGradient>

        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{categoryName}</Text>
          <Text style={styles.categoryCount}>{categoryCount} words</Text>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ========================================
// MAIN SCREEN
// ========================================
const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await thaiTutorService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading categories...</Text>
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
          <TouchableOpacity onPress={fetchCategories}>
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
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <LinearGradient colors={COLORS.primaryGradient} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Browse by Category</Text>
          <Text style={styles.headerSubtitle}>{categories.length} categories available</Text>
        </LinearGradient>
      </Animated.View>

      {/* Category List */}
      <FlatList
        data={categories}
        renderItem={({ item, index }) => (
          <AnimatedCategoryCard item={item} index={index} navigation={navigation} />
        )}
        keyExtractor={(item, index) => item.category || item.name || index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="apps-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubtext}>Categories will appear here once available</Text>
          </View>
        )}
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
    overflow: 'hidden',
  },
  headerGradient: {
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

  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Category Card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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

export default CategoriesScreen;