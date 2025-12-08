// backend/services/aiService.js

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Predict Intent + Extract Technical Terms
 */
exports.predictIntent = async (text) => {
  try {
    console.log('🤖 Calling ML Service for intent prediction...');
    
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      text: text
    }, {
      timeout: 5000
    });

    if (response.data.success) {
      return {
        intent: response.data.intent,
        confidence: response.data.confidence,
        technicalTerms: response.data.technical_terms || []
      };
    }

    throw new Error('ML Service returned unsuccessful response');

  } catch (error) {
    console.error('❌ ML Service error:', error.message);
    
    // Fallback
    return {
      intent: 'Update',
      confidence: 0.5,
      technicalTerms: []
    };
  }
};

/**
 * Translate text to target language
 */
exports.translateText = async (text, targetLang = 'ja') => {
  try {
    console.log(`🌐 Translating to ${targetLang}...`);
    
    const response = await axios.post(`${ML_SERVICE_URL}/translate`, {
      text: text,
      target_lang: targetLang
    }, {
      timeout: 5000
    });

    if (response.data.success) {
      return response.data.translation;
    }

    throw new Error('Translation failed');

  } catch (error) {
    console.error('❌ Translation error:', error.message);
    return text;
  }
};

/**
 * Full Analysis: Intent + Translation + NER
 */
exports.analyzeMessage = async (text, targetLang = 'ja') => {
  try {
    console.log('🔍 Analyzing message...');
    
    const response = await axios.post(`${ML_SERVICE_URL}/analyze`, {
      text: text,
      target_lang: targetLang
    }, {
      timeout: 10000
    });

    if (response.data.success) {
      return {
        intent: response.data.intent,
        confidence: response.data.confidence,
        translation: response.data.translation,
        technicalTerms: response.data.technical_terms || []
      };
    }

    throw new Error('Analysis failed');

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    return {
      intent: 'Update',
      confidence: 0.5,
      translation: text,
      technicalTerms: []
    };
  }
};

/**
 * Health check for ML Service
 */
exports.checkMLServiceHealth = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 3000
    });
    return response.data;
  } catch (error) {
    console.error('❌ ML Service is not available');
    return null;
  }
};