// mobile/src/theme/colors.js

export const COLORS = {
    // Primary gradient (Purple theme)
    primaryGradient: ['#8B5CF6', '#6D28D9'],
    primary: '#8B5CF6',
    primaryDark: '#6D28D9',
    primaryLight: '#A78BFA',
    primaryExtraLight: '#DDD6FE',

    // Accent colors
    accent: '#EC4899',
    accentLight: '#F472B6',
    accentGradient: ['#EC4899', '#D946EF'],

    // Semantic colors
    success: '#10B981',
    successLight: '#34D399',
    successGradient: ['#10B981', '#059669'],

    error: '#EF4444',
    errorLight: '#F87171',
    errorGradient: ['#EF4444', '#DC2626'],

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningGradient: ['#F59E0B', '#D97706'],

    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoGradient: ['#3B82F6', '#2563EB'],

    // Background colors (Dark theme)
    background: '#0F172A',      // Deep blue-gray
    backgroundLight: '#1E293B',
    surface: '#1E293B',
    surfaceLight: '#334155',
    surfaceHover: '#475569',

    // Card & components
    card: '#1E293B',
    cardHover: '#334155',
    border: '#334155',
    borderLight: '#475569',

    // Text colors
    text: {
        primary: '#F8FAFC',
        secondary: '#CBD5E1',
        tertiary: '#94A3B8',
        disabled: '#64748B',
        inverse: '#0F172A',
    },

    // Intent-specific gradients
    intent: {
        Problem: ['#EF4444', '#DC2626'],
        Question: ['#3B82F6', '#2563EB'],
        Update: ['#10B981', '#059669'],
        Request: ['#F59E0B', '#D97706'],
        Chat: ['#8B5CF6', '#6D28D9'],
    },

    // Message bubbles
    messageMy: ['#8B5CF6', '#6D28D9'],    // Purple gradient
    messageFriend: '#334155',              // Gray

    // Status colors
    online: '#10B981',
    offline: '#64748B',
    away: '#F59E0B',

    // Transparent overlays
    overlay: 'rgba(15, 23, 42, 0.8)',
    overlayLight: 'rgba(15, 23, 42, 0.5)',

    // Glass morphism
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',

    // Shimmer (for loading skeletons)
    shimmer: 'rgba(255, 255, 255, 0.1)',
};

export default COLORS;
