// mobile/src/services/api.js
// ✅ FIXED VERSION with Refresh Token Interceptor

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⭐ API Base URL (เปลี่ยนตาม backend ของคุณ)
const API_BASE_URL = 'https://cason-patellar-buena.ngrok-free.dev';
// const API_BASE_URL = 'http://192.168.151.125:3000'; // ใช้ตัวนี้ถ้าไม่ใช้ ngrok

// ==========================================
// ✅ Create Axios Instance
// ==========================================
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning
  },
});

// ==========================================
// ✅ Request Interceptor - Add Token
// ==========================================
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Token added to request');
      } else {
        console.log('⚠️ No token found');
      }
    } catch (error) {
      console.error('❌ Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// ✅ Response Interceptor - Auto Refresh Token
// ==========================================
let isRefreshing = false;
let refreshSubscribers = [];

// เมื่อ refresh สำเร็จ → ส่ง token ใหม่ให้ทุก request ที่รอ
const onRefreshed = (token) => {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
};

// เพิ่ม request เข้าคิว
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ==========================================
    // 🔴 Error 401 - Token Expired
    // ==========================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // ถ้ากำลัง refresh อยู่ → รอให้เสร็จ
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const oldToken = await AsyncStorage.getItem('token');

        if (!oldToken) {
          throw new Error('No token available for refresh');
        }

        console.log('🔄 Refreshing token...');

        // ✅ Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { token: oldToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );

        const { token: newToken, user } = response.data;

        // บันทึก token ใหม่
        await AsyncStorage.setItem('token', newToken);
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }

        // อัพเดต header
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // แจ้งทุก request ที่รออยู่
        onRefreshed(newToken);
        isRefreshing = false;

        console.log('✅ Token refreshed successfully');

        // ลองส่ง request เดิมอีกครั้ง
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        isRefreshing = false;

        // ล้าง token และ redirect ไป login
        await AsyncStorage.multiRemove(['token', 'user']);

        // ⚠️ ต้อง handle navigation ใน App.js หรือ AuthContext
        // navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });

        return Promise.reject(refreshError);
      }
    }

    // ==========================================
    // 🔴 Error 403 - Forbidden
    // ==========================================
    if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden - Access denied');
      await AsyncStorage.multiRemove(['token', 'user']);
      // Navigate to login
    }

    // ==========================================
    // 🔴 Network Error
    // ==========================================
    if (error.message === 'Network Error') {
      console.error('❌ Network Error - Check your connection');
    }

    return Promise.reject(error);
  }
);

// ==========================================
// ✅ Export API URLs
// ==========================================
export const API_URL = {
  // Base URL
  BASE: API_BASE_URL,

  // Authentication endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh', // ✅ NEW
    ME: '/api/auth/me',
  },

  // Chat endpoints
  CHAT: {
    SEND: '/api/chat/send',
    HISTORY: '/api/chat/history',
    TRANSLATE: '/api/chat/translate',
  },

  // User endpoints
  USER: {
    PROFILE: '/api/users/profile',
    AVATAR: '/api/users/avatar', // ✅ NEW
  },

  // Health check
  HEALTH: '/api/health',
};

// ==========================================
// ✅ Export API Instance
// ==========================================
export default api;

// Log for debugging
console.log('📡 API Configuration loaded');
console.log('📱 Backend URL:', API_BASE_URL);
console.log('✅ Token interceptor with auto-refresh enabled');