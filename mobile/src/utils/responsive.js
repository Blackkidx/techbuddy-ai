// mobile/src/utils/responsive.js
// ✅ Responsive utilities for consistent scaling across devices

import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design base: iPhone 14 Pro (393 x 852)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// ========================================
// Core Scaling Functions
// ========================================

/**
 * Horizontal scale — use for widths, horizontal paddings/margins
 */
export const wp = (widthPercent) => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * widthPercent) / 100);
};

/**
 * Vertical scale — use for heights, vertical paddings/margins
 */
export const hp = (heightPercent) => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * heightPercent) / 100);
};

/**
 * Proportional scale based on design width (393px base)
 * Use for font sizes, icon sizes, border radius
 */
export const scale = (size) => {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * ratio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Moderate scale — less aggressive scaling for text
 * factor 0.5 = halfway between no-scale and full-scale
 */
export const moderateScale = (size, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

/**
 * Vertical proportional scale based on design height
 */
export const verticalScale = (size) => {
  const ratio = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
};

// ========================================
// Device Info
// ========================================

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Status bar height
export const STATUS_BAR_HEIGHT = Platform.select({
  ios: 50, // Safe for notched iPhones
  android: StatusBar.currentHeight || 24,
});

// Bottom safe area (for gesture bar / home indicator)
export const BOTTOM_SAFE_AREA = Platform.select({
  ios: 34,
  android: 0,
});

// ========================================
// Responsive Font Sizes
// ========================================

export const FONT_SIZE = {
  xs: moderateScale(11),
  sm: moderateScale(13),
  base: moderateScale(15),
  lg: moderateScale(17),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(30),
  '4xl': moderateScale(36),
  '5xl': moderateScale(48),
};

// ========================================
// Responsive Spacing
// ========================================

export const RESPONSIVE_SPACING = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  base: scale(16),
  lg: scale(20),
  xl: scale(24),
  '2xl': scale(32),
  '3xl': scale(40),
  '4xl': scale(48),
};

// ========================================
// Screen Dimensions (live-updating via listener)
// ========================================

export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };

export default {
  wp,
  hp,
  scale,
  moderateScale,
  verticalScale,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isIOS,
  isAndroid,
  STATUS_BAR_HEIGHT,
  BOTTOM_SAFE_AREA,
  FONT_SIZE,
  RESPONSIVE_SPACING,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
