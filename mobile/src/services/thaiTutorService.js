// mobile/src/services/thaiTutorService.js (ฉบับแก้ไขสมบูรณ์)

import { API_ENDPOINTS, API_BASE_URL } from '../config/config';
// 🚩 Import getToken จาก api_helper.js เพื่อใช้ในการแนบ Token
import apiHelper, { getToken } from './api_helper'; 

class ThaiTutorService {
  
  /**
   * 💡 Helper function to handle Axios response structure
   */
  _handleResponse(response) {
    // 🚩 response.data คือ Server Response Body: { success: boolean, data: object/array }
    const serverResponse = response.data;
    
    if (serverResponse && serverResponse.success) {
      // ✅ ส่งเฉพาะ 'data' object/array กลับไป
      return serverResponse.data; 
    }

    // ❌ ถ้า success: false หรือ structure ไม่ถูกต้อง
    throw new Error(serverResponse?.message || 'Invalid response format');
  }
  
  /**
   * 🔒 Helper function to call API with Authorization Header
   * (ใช้สำหรับ Protected Routes)
   */
  async _authCall(method, url, data = null) {
    const token = await getToken();
    if (!token) {
      const authError = new Error('Unauthorized: Authentication token not found.');
      authError.response = { status: 401 }; // จำลอง status 401
      throw authError; 
    }
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    switch (method.toUpperCase()) {
      case 'GET':
        return apiHelper.get(url, config);
      case 'POST':
        return apiHelper.post(url, data, config);
      case 'DELETE':
        return apiHelper.delete(url, config);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // ===========================================
  // Public Routes (No Auth)
  // ===========================================

  async getDailyWord() {
    try {
      const response = await apiHelper.get(API_ENDPOINTS.THAI_TUTOR.DAILY_WORD);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Get Daily Word Error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await apiHelper.get(API_ENDPOINTS.THAI_TUTOR.CATEGORIES);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }

  async getWordsByCategory(category) {
    try {
      const url = API_ENDPOINTS.THAI_TUTOR.WORDS_BY_CATEGORY(category);
      const response = await apiHelper.get(url);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error fetching words:', error);
      throw error;
    }
  }
  
  // ===========================================
  // Protected Routes (Auth Required)
  // ===========================================

  async getWordDetail(id) {
    try {
      const response = await this._authCall('GET', API_ENDPOINTS.THAI_TUTOR.WORD_DETAIL(id)); 
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error fetching word detail:', error);
      throw error;
    }
  }
  
  async saveWord(wordId) {
    try {
      const response = await this._authCall('POST', API_ENDPOINTS.THAI_TUTOR.SAVE_WORD, { wordId }); 
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error saving word:', error);
      throw error;
    }
  }

  async markLearned(wordId) {
    try {
      const response = await this._authCall('POST', API_ENDPOINTS.THAI_TUTOR.MARK_LEARNED, { wordId });
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error marking learned:', error);
      throw error;
    }
  }

  async getSavedWords() {
    try {
      const response = await this._authCall('GET', API_ENDPOINTS.THAI_TUTOR.SAVED_WORDS);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error fetching saved words:', error);
      throw error;
    }
  }

  async getLearnedWords() {
    try {
      const response = await this._authCall('GET', API_ENDPOINTS.THAI_TUTOR.LEARNED_WORDS);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error fetching learned words:', error);
      throw error;
    }
  }

  async getUserStats() {
    try {
      const response = await this._authCall('GET', API_ENDPOINTS.THAI_TUTOR.USER_STATS);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw error;
    }
  }

  async unsaveWord(wordId) {
    try {
      const url = API_ENDPOINTS.THAI_TUTOR.UNSAVE_WORD(wordId);
      const response = await this._authCall('DELETE', url);
      return this._handleResponse(response);
    } catch (error) {
      console.error('❌ Error unsaving word:', error);
      throw error;
    }
  }

  // ===========================================
  // Utilities
  // ===========================================
  
  /**
   * ✅ FIXED: สร้าง URL สำหรับไฟล์ Audio (แก้ปัญหา 404 Static File)
   */
  getAudioUrl(audioPath) {
    if (!audioPath) return null;
    
    // 1. ลบเครื่องหมายทับนำหน้า audioPath ถ้ามี
    const cleanPath = audioPath.startsWith('/') ? audioPath.slice(1) : audioPath;
    
    // 2. ดึง Base URL ที่ไม่มี '/api' ต่อท้าย
    const cleanBaseUrl = API_BASE_URL.replace('/api', ''); 
    
    // 3. รวม Base URL และ Path ให้ถูกต้อง
    const fullUrl = `${cleanBaseUrl}/${cleanPath}`;
    console.log('🔊 Final Audio URL:', fullUrl);
    
    return fullUrl;
  }
}

export default new ThaiTutorService();