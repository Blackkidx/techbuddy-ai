const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// ==========================================
// Public Routes (ไม่ต้อง login)
// ==========================================

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', authController.register);

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', authController.login);

/**
 * ✅ NEW: Refresh Token
 * POST /api/auth/refresh
 */
router.post('/refresh', authController.refresh);

// ==========================================
// Protected Routes (ต้อง login)
// ==========================================

/**
 * Get current user info
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, authController.me);

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authMiddleware, authController.updateProfile);

/**
 * Change password
 * PUT /api/auth/password
 */
router.put('/password', authMiddleware, authController.changePassword);

module.exports = router;