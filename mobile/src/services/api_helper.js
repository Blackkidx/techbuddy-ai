// mobile/src/services/api_helper.js
// ✅ FIXED VERSION - Export getMessages properly

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ใช้ ngrok URL (เปลี่ยนทุกครั้งที่รัน ngrok ใหม่)
// ใช้ Local URL สำหรับ Android Emulator
const BASE_URL = 'http://10.0.2.2:3000/api';
// const BASE_URL = 'https://cason-patellar-buena.ngrok-free.dev/api';

// ฟังก์ชันช่วย get token
export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

// สร้าง Axios Instance หลัก
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// ✅ Default Export
export default axiosInstance;

// ===========================================
// Authentication APIs
// ===========================================

export const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  if (response.data.token) {
    await AsyncStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const login = async (email, password) => {
  const response = await axiosInstance.post('/auth/login', {
    email,
    password
  });
  if (response.data.token) {
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.removeItem('user');
  }
  return response.data;
};

export const logout = async () => {
  try {
    const token = await getToken();
    if (token) {
      await axiosInstance.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.log('Logout API error (ignored):', error.message);
  } finally {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }
};

export const getCurrentUser = async () => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('📤 No token found, returning null user.');
      return null;
    }

    console.log('📤 Getting current user...');

    const response = await axiosInstance.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ User response:', response.data);

    if (response.data.success && response.data.user) {
      return response.data.user;
    } else if (response.data.id) {
      return response.data;
    }
    return null;

  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🛑 Token expired or invalid (Session ended).');
    } else {
      console.error('❌ Get user error:', error.response?.data || error.message);
    }
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const token = await getToken();
    console.log('📤 Updating profile:', profileData);

    const response = await axiosInstance.put('/auth/profile', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }

    console.log('✅ Profile updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Update profile error:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// Chat APIs
// ===========================================

export const getFriends = async () => {
  const token = await getToken();
  const response = await axiosInstance.get('/chat/friends', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ✅ FIXED: Export getMessages properly
export const getMessages = async (friendId) => {
  try {
    const token = await getToken();

    // ✅ Validate friendId
    if (!friendId || friendId === 'null' || friendId === 'undefined') {
      throw new Error('Invalid friendId');
    }

    console.log(`📡 Fetching messages for friend: ${friendId}`);

    const response = await axiosInstance.get(`/chat/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Fetched ${response.data.messages?.length || 0} messages`);

    return response.data;
  } catch (error) {
    console.error('❌ getMessages error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendMessage = async (receiverId, content, language = 'en') => {
  const token = await getToken();
  const response = await axiosInstance.post(
    '/chat/send',
    { receiverId, content, language },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getUnreadCount = async () => {
  const token = await getToken();
  const response = await axiosInstance.get('/chat/unread', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ===========================================
// Health Check
// ===========================================

export const healthCheck = async () => {
  const response = await axiosInstance.get('/health');
  return response.data;
};