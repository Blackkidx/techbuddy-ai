// mobile/src/config/config.js
// ✅ FIXED VERSION - แก้ไขโครงสร้าง FRIENDS.REQUESTS

// ✅ USE NGROK URL (for local development)
export const API_BASE_URL = 'https://cason-patellar-buena.ngrok-free.dev';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    ME: `${API_BASE_URL}/api/auth/me`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },

  CHAT: {
    SEND: `${API_BASE_URL}/api/chat/send`,
    HISTORY: `${API_BASE_URL}/api/chat/history`,
    TRANSLATE: `${API_BASE_URL}/api/chat/translate`,
    FRIENDS: `${API_BASE_URL}/api/chat/friends`,
    MESSAGES: (friendId) => `${API_BASE_URL}/api/chat/messages/${friendId}`,
    UNREAD: `${API_BASE_URL}/api/chat/unread`,
  },

  USERS: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    AVATAR: `${API_BASE_URL}/api/users/avatar`,
    SEARCH: `${API_BASE_URL}/api/users/search`,
  },

  FRIENDS: {
    LIST: `${API_BASE_URL}/api/friends/list`,
    // ✅ แก้ไข: เปลี่ยน REQUESTS เป็น Object เพื่อรองรับ .PENDING
    REQUESTS: {
      ALL: `${API_BASE_URL}/api/friends/requests`, // Endpoint หลัก
      PENDING: `${API_BASE_URL}/api/friends/requests/pending`, // ✅ เพิ่ม Endpoint ที่ FriendListScreen ต้องการ
    },
    ADD: `${API_BASE_URL}/api/friends/add`,
    ACCEPT: (friendshipId) => `${API_BASE_URL}/api/friends/accept/${friendshipId}`,
    REJECT: (friendshipId) => `${API_BASE_URL}/api/friends/reject/${friendshipId}`,
    REMOVE: (friendId) => `${API_BASE_URL}/api/friends/remove/${friendId}`,
  },

  FEEDBACK: {
    SUBMIT: `${API_BASE_URL}/api/feedback/submit`,
    LIST: `${API_BASE_URL}/api/feedback/list`,
  },

  // Thai Tutor
  THAI_TUTOR: {
    DAILY_WORD: `${API_BASE_URL}/api/thai-tutor/daily-word`,
    CATEGORIES: `${API_BASE_URL}/api/thai-tutor/categories`,
    WORDS_BY_CATEGORY: (category) => `${API_BASE_URL}/api/thai-tutor/words/category/${category}`,
    WORD_DETAIL: (id) => `${API_BASE_URL}/api/thai-tutor/word/${id}`,
    SAVE_WORD: `${API_BASE_URL}/api/thai-tutor/save-word`,
    MARK_LEARNED: `${API_BASE_URL}/api/thai-tutor/mark-learned`,
    SAVED_WORDS: `${API_BASE_URL}/api/thai-tutor/user/saved-words`,
    LEARNED_WORDS: `${API_BASE_URL}/api/thai-tutor/user/learned-words`,
    USER_STATS: `${API_BASE_URL}/api/thai-tutor/user/stats`,
    UNSAVE_WORD: (wordId) => `${API_BASE_URL}/api/thai-tutor/unsave-word/${wordId}`,
  },

  HEALTH: `${API_BASE_URL}/api/health`,
};

export const APP_CONFIG = {
  APP_NAME: 'TechBuddy',
  VERSION: '1.0.0',
  TIMEOUT: 30000,
  AUTO_REFRESH_TOKEN: true,
  SUPPORTED_LANGUAGES: ['en', 'ja', 'th'],
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

// ============================================================
// 🎨 COLORS - Color Palette for entire app
// ============================================================
export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  ONLINE: '#4CAF50',
  OFFLINE: '#999',
  PENDING: '#FF9800',
  BACKGROUND: '#f5f5f5',
  CARD: '#fff',
  BORDER: '#e0e0e0',
  TEXT: '#333',
  TEXT_SECONDARY: '#666',
  TEXT_TERTIARY: '#999',
  PLACEHOLDER: '#ccc',

  // Thai Tutor specific colors
  THAI: {
    PRIMARY: '#FF6B6B',
    SECONDARY: '#4ECDC4',
    BEGINNER: '#95E1D3',
    INTERMEDIATE: '#FFD93D',
    ADVANCED: '#F38181',
    CARD_BG: '#FFFFFF',
    GRADIENT_START: '#FF6B6B',
    GRADIENT_END: '#FFA07A',
  },
};

// ============================================================
// 🔤 FONTS - Typography system
// ============================================================
export const FONTS = {
  REGULAR: 'System',
  BOLD: 'System',
  LIGHT: 'System',
  FAMILY: {
    REGULAR: 'System',
    MEDIUM: 'System',
    SEMIBOLD: 'System',
    BOLD: 'System',
  },
};

// ============================================================
// 📏 SIZES - Spacing, Font Sizes, Component Dimensions
// ============================================================
export const SIZES = {
  // Font Sizes
  FONT_SMALL: 12,
  FONT_MEDIUM: 14,
  FONT_REGULAR: 16,
  FONT_LARGE: 18,
  FONT_XLARGE: 20,
  FONT_TITLE: 24,
  FONT_HEADER: 28,

  // Spacing
  PADDING: 16,
  MARGIN: 16,
  RADIUS: 12,
  RADIUS_SMALL: 8,
  RADIUS_LARGE: 16,

  // Avatar
  AVATAR_SMALL: 32,
  AVATAR_MEDIUM: 48,
  AVATAR_LARGE: 64,
  AVATAR_XLARGE: 80,

  // Components
  BUTTON_HEIGHT: 44,
  INPUT_HEIGHT: 44,
  TAB_HEIGHT: 56,
};

// ============================================================
// 🔌 SOCKET_CONFIG - Socket.IO Configuration
// ============================================================
export const SOCKET_CONFIG = {
  RECONNECTION: true,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_DELAY_MAX: 5000,
  RECONNECTION_ATTEMPTS: 5,
  TIMEOUT: 20000,
  TRANSPORTS: ['websocket', 'polling'],
};

// ============================================================
// 🔊 AUDIO_CONFIG - Audio file paths for Thai Tutor
// ============================================================
export const AUDIO_CONFIG = {
  BASE_PATH: '/public/audio/thai/',
  EXTENSION: '.mp3',
  BASE_URL: `${API_BASE_URL}/public/audio/thai/`,
};

// ⭐ Debug on load
console.log('⚙️ Config loaded');
console.log('📡 API_BASE_URL:', API_BASE_URL);
console.log('🇹🇭 DAILY_WORD endpoint:', API_ENDPOINTS.THAI_TUTOR.DAILY_WORD);
console.log('✅ All constants loaded: COLORS, FONTS, SIZES, SOCKET_CONFIG, AUDIO_CONFIG');

// ============================================================
// 📦 DEFAULT EXPORT - All configs in one object
// ============================================================
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONFIG,
  COLORS,
  FONTS,
  SIZES,
  SOCKET_CONFIG,
  AUDIO_CONFIG,
};