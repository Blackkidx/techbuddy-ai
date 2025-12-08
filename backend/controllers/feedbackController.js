// backend/controllers/feedbackController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========================================
// Language Utilities
// ========================================

/**
 * Normalize language code (e.g., 'English' -> 'en', 'Japanese' -> 'ja')
 */
const LANGUAGE_NAME_TO_CODE = {
  'english': 'en', 'English': 'en', 'EN': 'en', 'en': 'en',
  'japanese': 'ja', 'Japanese': 'ja', 'JA': 'ja', 'ja': 'ja', 'jp': 'ja', 'JP': 'ja',
  'thai': 'th', 'Thai': 'th', 'TH': 'th', 'th': 'th'
};

const normalizeLanguageCode = (lang) => {
  if (!lang) return null;
  return LANGUAGE_NAME_TO_CODE[lang] || lang.toLowerCase();
};

/**
 * Validate language code
 */
const SUPPORTED_LANGUAGES = ['en', 'ja', 'th'];

const isValidLanguageCode = (code) => {
  if (!code) return true; // Optional field
  return SUPPORTED_LANGUAGES.includes(code);
};

// ========================================
// Controllers
// ========================================

/**
 * บันทึก Feedback จากผู้ใช้
 * POST /api/feedback
 */
exports.createFeedback = async (req, res) => {
  try {
    const {
      user_id,           // ✅ Can be Int (user.id) or null
      message_id,
      feedback_type,
      original_text,
      ai_prediction,
      user_correction,
      confidence_score,
      is_correct,        // ✅ Boolean flag for simple thumbs up/down
      source_language,
      target_language
    } = req.body;

    console.log('📥 Received feedback request:', {
      user_id,
      feedback_type,
      is_correct,
      original_text: original_text?.substring(0, 50),
      ai_prediction,
      source_language,
      target_language
    });

    // Validation: Required fields (user_id can be from JWT if not provided)
    if (!feedback_type || !original_text) {
      console.error('❌ Missing required fields:', { feedback_type, original_text: !!original_text });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: feedback_type, original_text'
      });
    }

    // ✅ Get user from JWT if user_id not provided
    let userId = user_id;
    if (!userId && req.user && req.user.id) {
      userId = req.user.id;
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // ✅ Simplified validation: accept is_correct boolean OR user_correction
    const hasIsCorrect = typeof is_correct === 'boolean';
    const hasCorrection = user_correction && user_correction.trim();

    if (!hasIsCorrect && !hasCorrection && !ai_prediction) {
      return res.status(400).json({
        success: false,
        message: 'Either is_correct, user_correction, or ai_prediction must be provided'
      });
    }

    // Validation: feedback_type
    const validTypes = ['intent', 'translation', 'ner'];
    if (!validTypes.includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback_type. Must be: intent, translation, or ner'
      });
    }

    // ✅ Normalize and validate language codes
    const normalizedSourceLang = normalizeLanguageCode(source_language);
    const normalizedTargetLang = normalizeLanguageCode(target_language);

    if (normalizedSourceLang && !isValidLanguageCode(normalizedSourceLang)) {
      return res.status(400).json({
        success: false,
        message: `Invalid source_language: "${source_language}". Must be one of: en, ja, th`
      });
    }

    if (normalizedTargetLang && !isValidLanguageCode(normalizedTargetLang)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target_language: "${target_language}". Must be one of: en, ja, th`
      });
    }

    // ✅ Find user by ID (Int)
    let user;
    try {
      const parsedUserId = parseInt(userId);

      if (isNaN(parsedUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user_id format. Must be a number.'
        });
      }

      user = await prisma.user.findUnique({
        where: { id: parsedUserId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (err) {
      console.error('❌ Error finding user:', err);
      return res.status(500).json({
        success: false,
        message: 'Error finding user',
        error: err.message
      });
    }

    // ✅ Determine isCorrect value
    let isCorrectValue = hasIsCorrect ? is_correct : (ai_prediction === user_correction);

    // ✅ Save to Database using user.id (integer)
    const feedback = await prisma.userFeedback.create({
      data: {
        userId: user.id,
        messageId: message_id || null,
        feedbackType: feedback_type,
        originalText: original_text,
        aiPrediction: ai_prediction || null,
        userCorrection: user_correction || null,
        confidenceScore: confidence_score || null,
        isCorrect: isCorrectValue,
        sourceLanguage: normalizedSourceLang,
        targetLanguage: normalizedTargetLang
      }
    });

    console.log('✅ Feedback saved:', feedback.id, {
      type: feedback_type,
      isCorrect: isCorrectValue,
      languages: normalizedSourceLang && normalizedTargetLang
        ? `${normalizedSourceLang} -> ${normalizedTargetLang}`
        : 'N/A'
    });

    res.status(201).json({
      success: true,
      message: 'Feedback saved successfully! 🎉',
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * ดึง Feedback ที่ยังไม่ได้ใช้สำหรับ Retraining
 * GET /api/feedback/pending
 */
exports.getPendingFeedback = async (req, res) => {
  try {
    const { feedback_type, limit = 100 } = req.query;

    const where = {
      usedForTraining: false
    };

    if (feedback_type) {
      where.feedbackType = feedback_type;
    }

    const feedbacks = await prisma.userFeedback.findMany({
      where,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        originalText: true,
        aiPrediction: true,
        userCorrection: true,
        feedbackType: true,
        confidenceScore: true,
        isCorrect: true,
        sourceLanguage: true,
        targetLanguage: true,
        createdAt: true,
        user: {
          select: {
            userId: true,
            username: true
          }
        }
      }
    });

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });

  } catch (error) {
    console.error('❌ Error fetching pending feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * ดึงสถิติ Feedback
 * GET /api/feedback/stats
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    // นับจำนวน feedback ทั้งหมด
    const totalFeedbacks = await prisma.userFeedback.count();

    // นับตาม type
    const byType = await prisma.userFeedback.groupBy({
      by: ['feedbackType'],
      _count: {
        id: true
      }
    });

    // นับจำนวนที่ AI ถูก vs ผิด
    const correctPredictions = await prisma.userFeedback.count({
      where: { isCorrect: true }
    });

    const incorrectPredictions = await prisma.userFeedback.count({
      where: { isCorrect: false }
    });

    // คำนวณ accuracy
    const accuracy = totalFeedbacks > 0
      ? ((correctPredictions / totalFeedbacks) * 100).toFixed(2)
      : 0;

    // จัดรูปแบบข้อมูล by_type
    const byTypeFormatted = {};
    byType.forEach(item => {
      byTypeFormatted[item.feedbackType] = item._count.id;
    });

    res.json({
      success: true,
      data: {
        total_feedbacks: totalFeedbacks,
        correct_predictions: correctPredictions,
        incorrect_predictions: incorrectPredictions,
        current_accuracy: `${accuracy}%`,
        by_type: byTypeFormatted
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark feedbacks as used for training
 * PUT /api/feedback/mark-used
 */
exports.markAsUsed = async (req, res) => {
  try {
    const { feedback_ids } = req.body;

    if (!Array.isArray(feedback_ids) || feedback_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'feedback_ids must be a non-empty array'
      });
    }

    const result = await prisma.userFeedback.updateMany({
      where: {
        id: {
          in: feedback_ids
        }
      },
      data: {
        usedForTraining: true,
        retrainedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `✅ Marked ${result.count} feedbacks as used for training`,
      count: result.count
    });

  } catch (error) {
    console.error('❌ Error marking feedbacks as used:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};