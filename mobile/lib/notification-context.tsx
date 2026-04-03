// lib/notification-context.tsx
// ✅ Global Notification Provider — Reanimated-based, 60fps, zero lag

import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==============================
// Types
// ==============================
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  icon?: string;
}

interface NotificationContextType {
  showNotification: (config: ToastConfig | string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

// ==============================
// Toast Styles per Type
// ==============================
const TOAST_STYLES: Record<ToastType, { gradient: [string, string]; icon: string }> = {
  success: { gradient: ['#4ADE80', '#22C55E'], icon: 'checkmark-circle' },
  error: { gradient: ['#F87171', '#EF4444'], icon: 'alert-circle' },
  warning: { gradient: ['#FBBF24', '#F59E0B'], icon: 'warning' },
  info: { gradient: ['#60A5FA', '#3B82F6'], icon: 'information-circle' },
};

// ==============================
// Animated Toast Component
// ==============================
function AnimatedToast({
  message,
  type = 'info',
  duration = 3000,
  icon,
  onDismiss,
}: ToastConfig & { onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-150);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const progressWidth = useSharedValue(1);
  const dismissed = useRef(false);

  const toastStyle = TOAST_STYLES[type];

  // Enter animation
  React.useEffect(() => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : type === 'warning'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
    }

    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });

    // Progress bar countdown
    progressWidth.value = withTiming(0, {
      duration,
      easing: Easing.linear,
    });

    // Auto dismiss
    const timer = setTimeout(() => {
      if (!dismissed.current) {
        dismiss();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    translateY.value = withTiming(-150, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => runOnJS(onDismiss)(), 300);
  };

  // Swipe-to-dismiss gesture
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
      if (Math.abs(event.translationX) > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationY < -50 || Math.abs(event.translationX) > 100) {
        // Swipe up or sideways → dismiss
        translateY.value = withTiming(-150, { duration: 200 });
        opacity.value = withTiming(0, { duration: 150 });
        runOnJS(dismiss)();
      } else {
        // Snap back
        translateY.value = withSpring(0, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedContainer = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        style={[
          styles.toastContainer,
          { top: insets.top + 8 },
          animatedContainer,
        ]}
      >
        <LinearGradient
          colors={toastStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.toastGradient}
        >
          <View style={styles.toastContent}>
            <View style={styles.toastIconContainer}>
              <Ionicons
                name={(icon || toastStyle.icon) as any}
                size={22}
                color="#fff"
              />
            </View>
            <Text style={styles.toastMessage} numberOfLines={2}>
              {message}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

// ==============================
// Provider
// ==============================
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastConfig & { id: string }>>([]);

  const showNotification = useCallback((config: ToastConfig | string, typeOrOverride?: ToastType) => {
    let toastConfig: ToastConfig;
    if (typeof config === 'string') {
      toastConfig = { message: config, type: typeOrOverride || 'success' };
    } else {
      toastConfig = config;
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    setToasts((prev) => {
      // Max 3 toasts at once, remove oldest
      const next = [...prev, { ...toastConfig, id }];
      if (next.length > 3) return next.slice(-3);
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Toast Layer — renders above everything */}
      <View style={styles.toastLayer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <AnimatedToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            icon={toast.icon}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
}

// ==============================
// Hook
// ==============================
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// ==============================
// Styles
// ==============================
const styles = StyleSheet.create({
  toastLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  toastGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  toastIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastMessage: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },
});

export default NotificationContext;
