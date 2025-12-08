const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// ==========================================
// ✅ Multer Configuration for Avatar Upload
// ==========================================

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads/avatars directory');
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed!'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ==========================================
// ✅ Search Users (✨ NEW)
// ==========================================

/**
 * Search users by userId, username, or email
 * GET /api/users/search?q=alice
 * Protected route - requires authentication
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // ค้นหา user (userId, username, email)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: currentUserId // ไม่แสดงตัวเอง
            }
          },
          {
            OR: [
              {
                userId: {
                  contains: q,
                  mode: 'insensitive'
                }
              },
              {
                username: {
                  contains: q,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: q,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        avatarUrl: true,
        nativeLanguage: true,
        learningLanguage: true,
        isOnline: true
      },
      take: 10 // จำกัด 10 ผลลัพธ์
    });

    // ตรวจสอบว่าเป็นเพื่อนอยู่แล้วหรือยัง
    const usersWithFriendshipStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId: currentUserId, friendId: user.id },
              { userId: user.id, friendId: currentUserId }
            ]
          }
        });

        return {
          ...user,
          friendshipStatus: friendship ? friendship.status : null,
          isFriend: friendship?.status === 'ACCEPTED'
        };
      })
    );

    res.json({
      success: true,
      count: usersWithFriendshipStatus.length,
      users: usersWithFriendshipStatus
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// ==========================================
// ✅ Upload Avatar Endpoint
// ==========================================

/**
 * Upload/Update user avatar
 * POST /api/users/avatar
 * Protected route - requires authentication
 */
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select an image file to upload'
      });
    }

    const userId = req.user.id;
    const oldAvatar = req.user.avatarUrl;

    // Create URL for the uploaded file
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    console.log('📤 Uploading avatar for user:', req.user.userId);
    console.log('📁 File:', req.file.filename);

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        avatarUrl: true,
        nativeLanguage: true,
        learningLanguage: true,
      }
    });

    // Delete old avatar file (if exists and not default)
    if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '..', oldAvatar);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log('🗑️  Deleted old avatar:', oldAvatar);
      }
    }

    console.log('✅ Avatar uploaded successfully:', avatarUrl);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully! 🎨',
      avatarUrl,
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Avatar upload error:', error);

    // Delete uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️  Deleted failed upload:', req.file.filename);
    }

    res.status(500).json({
      success: false,
      error: 'Avatar upload failed',
      message: error.message
    });
  }
});

// ==========================================
// ✅ Delete Avatar Endpoint
// ==========================================

/**
 * Delete user avatar (set to null)
 * DELETE /api/users/avatar
 * Protected route - requires authentication
 */
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const oldAvatar = req.user.avatarUrl;

    // Update user's avatar to null
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        avatarUrl: true,
        nativeLanguage: true,
        learningLanguage: true,
      }
    });

    // Delete avatar file (if exists)
    if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '..', oldAvatar);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log('🗑️  Deleted avatar:', oldAvatar);
      }
    }

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Avatar delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Avatar delete failed',
      message: error.message
    });
  }
});

// ==========================================
// ✅ Get User Profile
// ==========================================

/**
 * Get user profile by userId
 * GET /api/users/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        avatarUrl: true,
        nativeLanguage: true,
        learningLanguage: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: error.message
    });
  }
});

module.exports = router;