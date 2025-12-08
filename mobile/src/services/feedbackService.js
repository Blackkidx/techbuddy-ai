// mobile/src/services/feedbackService.js

// ✅ ใช้ api instance ที่มี Interceptor จัดการ Token แล้ว
import api from './api'; 
// ❌ ลบ import AsyncStorage ออก เนื่องจากไม่ได้ใช้ในไฟล์นี้แล้ว
// import AsyncStorage from '@react-native-async-storage/async-storage'; 

/**
 * Submit user feedback for AI prediction
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<Object>} Response data
 */
export const submitFeedback = async (feedbackData) => {
  try {
    console.log('📤 Submitting feedback:', feedbackData);

    // ✅ เรียก POST /api/feedback โดยใช้ api instance
    // Token, Content-Type, และ Timeout ถูกจัดการใน api.js Interceptor แล้ว
    const response = await api.post(
      `/api/feedback`,  
      feedbackData,
    );

    console.log('✅ Feedback submitted successfully:', response.data);
    return response.data;

  } catch (error) {
    
    let errorMessage = error.message;
    let errorStatus = undefined;
    let errorData = undefined;
    
    if (error.response) {
      // Server ตอบกลับมาด้วย Error Status (4xx, 5xx)
      errorMessage = error.response.data?.message || 'Server responded with an error.';
      errorStatus = error.response.status;
      errorData = error.response.data;
    } else if (error.request) {
      // ไม่มี Response (เช่น Timeout, Connection Refused, หรือ Axios Network Error)
      errorMessage = error.message || 'Connection Error: Check API URL and Backend Server status.';
    }
    // ถ้าเป็น Network Error ปกติ (Axios "Network Error") จะใช้ error.message เดิม

    console.error('❌ Submit feedback error:', errorStatus || 'Network', errorMessage, errorData);
    
    // ส่ง error details กลับไป
    throw {
      message: errorMessage,
      status: errorStatus,
      data: errorData
    };
  }
};

/**
 * Get feedback statistics
 * @returns {Promise<Object>} Feedback stats
 */
export const getFeedbackStats = async () => {
  try {
    // ✅ ใช้ api instance
    const response = await api.get(
      `/api/feedback/stats`,
    );

    return response.data;
  } catch (error) {
    console.error('❌ Get feedback stats error:', error);
    // 💡 ควร throw object error เหมือน submitFeedback เพื่อให้ consistent
    throw {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

/**
 * Get pending feedback (Admin only)
 * @param {string} feedbackType - Type of feedback (intent, translation, ner)
 * @param {number} limit - Number of results
 * @returns {Promise<Object>} Pending feedback list
 */
export const getPendingFeedback = async (feedbackType = null, limit = 100) => {
  try {
    const params = { limit };
    if (feedbackType) {
      params.feedback_type = feedbackType;
    }

    // ✅ ใช้ api instance
    const response = await api.get(
      `/api/feedback/pending`,
      {
        params
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Get pending feedback error:', error);
    // 💡 ควร throw object error เหมือน submitFeedback
    throw {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};