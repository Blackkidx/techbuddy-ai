// mobile/src/components/LoadingSpinner.js
// Reusable animated loading spinner — extracted from ChannelChatScreen

import React, { useEffect, useRef, memo } from 'react';
import { Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

/** @param {{ size?: number, color?: string }} props */
const LoadingSpinner = memo(({ size = 40, color = COLORS.primary }) => {
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
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name="sync" size={size} color={color} />
    </Animated.View>
  );
});

export default LoadingSpinner;
