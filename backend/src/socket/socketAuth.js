// backend/src/socket/socketAuth.js
// 🔧 FIXED VERSION - แก้ปัญหา senderId = receiverId

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log('❌ Socket auth failed: No token provided');
      return next(new Error('Authentication error: No token'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔍 Debug: ดูว่า token มีอะไรบ้าง
    console.log('🔍 Token decoded:', {
      id: decoded.id,           // Int PK
      userId: decoded.userId,   // String Custom ID (TB000001)
      username: decoded.username,
      email: decoded.email
    });

    // ✅✅✅ CRITICAL FIX: ห้าม overwrite socket.id!
    socket.userPK = decoded.id;         // ✅ Primary Key ID (Integer) - for reference
    socket.userId = decoded.userId;     // ✅ Custom String ID (TB000001) ← สำคัญ!
    socket.email = decoded.email;
    socket.username = decoded.username || 'Unknown';

    // ⚠️ Validation: ตรวจสอบว่า userId (String) มีหรือไม่
    if (!socket.userId) {
      console.error('❌ Authentication failed: Missing userId in token');
      console.error('❌ Token payload:', decoded);
      return next(new Error('Authentication error: Token missing userId field'));
    }

    // ✅ Validation: ตรวจสอบว่า userId เป็น String ที่ถูกต้อง
    if (typeof socket.userId !== 'string') {
      console.error('❌ Authentication failed: userId is not a string');
      console.error('❌ userId:', socket.userId, typeof socket.userId);
      return next(new Error('Authentication error: userId must be a string'));
    }

    // ✅ Validation: ตรวจสอบว่า userId ขึ้นต้นด้วย "TB" (optional)
    if (!socket.userId.startsWith('TB')) {
      console.warn('⚠️ Warning: userId does not start with "TB":', socket.userId);
    }

    console.log(`✅ Socket authenticated:`, {
      socketId: socket.id,         // Socket.IO Connection ID (อย่าลืม!)
      userPK: socket.userPK,       // Int PK (3)
      userId: socket.userId,       // String ID (TB000001) ← ใช้ตัวนี้!
      username: socket.username    // alice_test
    });
    
    // ให้ผ่านไปต่อ
    next();

  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }

    return next(new Error('Authentication error'));
  }
};

module.exports = socketAuth;