// backend/middleware/auth.js (ฉบับแก้ไข)

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * ตรวจสอบ JWT token และดึงข้อมูล user
 */
const authMiddleware = async (req, res, next) => {
  try {
    // ดึง token จาก Authorization header
    const authHeader = req.headers.authorization;
    
    // ... (Log Codes) ...
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided',
        message: 'Authorization required' 
      });
    }

    // รองรับทั้ง "Bearer TOKEN" และ "TOKEN"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : authHeader;

    // ... (Log Codes) ...

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token format',
        message: 'Token must be in format: Bearer <token>' 
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'techbuddy-secret-key-2024'
    );

    console.log('✅ Token valid - User ID:', decoded.userId || decoded.id);

    // ********** ✅ จุดที่แก้ไข: แปลง ID เป็น Integer **********
    const userIdFromToken = parseInt(decoded.id, 10);
    if (isNaN(userIdFromToken)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload',
        message: 'User ID in token is not a valid number'
      });
    }
    // ******************************************************

    // ดึงข้อมูล user จาก database
    const user = await prisma.user.findUnique({
      where: { id: userIdFromToken }, // ใช้ ID ที่แปลงเป็น Int แล้ว
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        avatarUrl: true,
        nativeLanguage: true,
        learningLanguage: true,
        isOnline: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists' 
      });
    }

    console.log('✅ User found:', user.userId);

    // เพิ่มข้อมูล user ใน request object
    req.user = user;
    req.userId = user.id; 
    
    next();

  } catch (error) {
    console.error('❌ Auth error:', error.name);
    console.error('❌ Error message:', error.message);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.' 
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }

    // Generic error
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication' 
    });
  }
};

module.exports = authMiddleware;