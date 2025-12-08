// ✅ FIXED: mlService.js
// เชื่อมต่อกับ Flask ML Service (app.py)

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * ✅ Analyze message with AI
 * @param {string} text - Message text
 * @param {string} targetLang - Target language (optional, default: 'ja')
 * @returns {Object} { success, intent, confidence, translation, technicalTerms }
 */
async function analyze(text, targetLang = 'ja') {
  try {
    console.log(`📝 Analyzing message: "${text.substring(0, 50)}..."`);
    
    // ✅ Call /analyze endpoint (ตาม Flask app.py)
    const response = await axios.post(`${ML_SERVICE_URL}/analyze`, { 
      text,
      target_lang: targetLang 
    });
    
    // ✅ Check response
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'ML Service returned error');
    }
    
    const { intent, confidence, translation, technicalTerms } = response.data;
    
    console.log(`   ✅ Intent: ${intent} (${(confidence * 100).toFixed(1)}%)`);
    
    return {
      success: true,
      intent,
      confidence,
      translation,
      technicalTerms
    };
    
  } catch (error) {
    console.error('❌ ML Service Error:', error.message);
    
    // ✅ Return error response
    return {
      success: false,
      error: error.message,
      intent: null,
      confidence: 0,
      translation: null,
      technicalTerms: []
    };
  }
}

/**
 * ✅ Predict intent only (backward compatibility)
 * @param {string} text - Message text
 * @returns {Object} { intent, confidence }
 */
async function predict(text) {
  const result = await analyze(text);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return {
    intent: result.intent,
    confidence: result.confidence
  };
}

/**
 * ✅ Health check
 * @returns {Object} { status, service, model_loaded, labels }
 */
async function healthCheck() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000 // 5 seconds timeout
    });
    
    return {
      status: 'healthy',
      ...response.data
    };
    
  } catch (error) {
    console.error('❌ ML Service Health Check Failed:', error.message);
    
    return { 
      status: 'unhealthy', 
      error: error.message,
      service: 'TechBuddy ML Service',
      model_loaded: false
    };
  }
}

module.exports = { 
  analyze,      // ✅ Main function (recommended)
  predict,      // ✅ Backward compatibility
  healthCheck 
};