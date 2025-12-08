// backend/src/routes/thaiTutor.routes.js

const express = require('express');
const router = express.Router();
const thaiTutorController = require('../controllers/thaiTutor.controller');
const authMiddleware = require('../middleware/auth'); // Your existing auth middleware

// Public routes (no auth required)
router.get('/daily-word', thaiTutorController.getDailyWord);
router.get('/categories', thaiTutorController.getCategories);
router.get('/words/category/:category', thaiTutorController.getWordsByCategory);
router.get('/word/:id', thaiTutorController.getWordById);

// Protected routes (auth required)
router.post('/save-word', authMiddleware, thaiTutorController.saveWord);
router.post('/mark-learned', authMiddleware, thaiTutorController.markLearned);
router.get('/user/saved-words', authMiddleware, thaiTutorController.getSavedWords);
router.get('/user/learned-words', authMiddleware, thaiTutorController.getLearnedWords);
router.get('/user/stats', authMiddleware, thaiTutorController.getUserStats);
router.delete('/unsave-word/:wordId', authMiddleware, thaiTutorController.unsaveWord);

module.exports = router;