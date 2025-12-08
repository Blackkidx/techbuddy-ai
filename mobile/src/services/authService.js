// mobile/src/services/authService.js

/**
 * Authentication Service
 * จัดการ token, login, logout
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@techbuddy_token';
const USER_KEY = '@techbuddy_user';

// ✅ บันทึก token และ user data
export const saveAuthData = async (token, user) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('✅ Token saved:', token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
    return false;
  }
};

// ✅ ดึง token
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

// ✅ ดึง user data
export const getUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
};

// ✅ ตรวจสอบว่า login อยู่หรือไม่
export const isAuthenticated = async () => {
  try {
    const token = await getToken();
    return !!token;
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

// ✅ Logout - ลบข้อมูลทั้งหมด
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    console.log('✅ Logged out successfully');
    return true;
  } catch (error) {
    console.error('❌ Error logging out:', error);
    return false;
  }
};

// ✅ ลบข้อมูลทั้งหมด (สำหรับ debug)
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
};

export default {
  saveAuthData,
  getToken,
  getUser,
  isAuthenticated,
  logout,
  clearAll,
};