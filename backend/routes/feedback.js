// routes/feedback.js

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

/**
 * @route   POST /api/feedback
 * @desc    บันทึก Feedback จากผู้ใช้
 * @access  Private
 */
router.post('/', feedbackController.createFeedback);

/**
 * @route   GET /api/feedback/pending
 * @desc    ดึง Feedback ที่ยังไม่ได้ใช้สำหรับ Retraining
 * @access  Private (Admin only)
 */
router.get('/pending', feedbackController.getPendingFeedback);

/**
 * @route   GET /api/feedback/stats
 * @desc    ดึงสถิติ Feedback
 * @access  Private
 */
router.get('/stats', feedbackController.getFeedbackStats);

/**
 * @route   PUT /api/feedback/mark-used
 * @desc    Mark feedbacks as used for training
 * @access  Private (Admin only)
 */
router.put('/mark-used', feedbackController.markAsUsed);

module.exports = router;