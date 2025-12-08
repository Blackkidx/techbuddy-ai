// backend/src/server.js (อัพเดตเพิ่ม Socket.IO)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); // ✅ เพิ่ม http
const initializeSocket = require('./src/socket'); // ✅ เพิ่ม Socket.IO

const app = express();

// ==========================================
// Middleware
// ==========================================

// CORS - อนุญาตทุก origin (สำหรับ development)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio'))); 

// Request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// Routes
// ==========================================

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const feedbackRoutes = require('./routes/feedback');
const friendRoutes = require('./routes/friends');
const thaiTutorRoutes = require('./routes/thaiTutor.routes'); 

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/thai-tutor', thaiTutorRoutes); 

// ==========================================
// Health Check & ML Service
// ==========================================

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TechBuddy API is running',
    socket: 'enabled', // ✅ เพิ่มบอก socket status
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check with ML service
app.get('/api/health', async (req, res) => {
  try {
    let mlHealth = { status: 'not configured' };
    
    // ตรวจสอบว่ามี mlService หรือไม่
    try {
      const mlService = require('./services/mlService');
      mlHealth = await mlService.healthCheck();
    } catch (error) {
      mlHealth = { status: 'service not available', error: error.message };
    }
    
    res.json({
      api: 'healthy',
      socket: 'enabled', // ✅ เพิ่มบอก socket status
      ml_service: mlHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      api: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ML Prediction endpoint
app.post('/api/predict', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false,
        error: 'Text is required' 
      });
    }
    
    const mlService = require('./services/mlService');
    const result = await mlService.predict(text);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Prediction failed',
      message: error.message 
    });
  }
});

// ==========================================
// Error Handlers
// ==========================================

// 404 Handler - Route not found
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: {
      auth: '/api/auth',
      chat: '/api/chat',
      users: '/api/users',
      feedback: '/api/feedback',
      friends: '/api/friends',
      thaiTutor: '/api/thai-tutor', 
      health: '/api/health',
      predict: '/api/predict'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({ 
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// ✅ Socket.IO Setup (NEW!)
// ==========================================

// สร้าง HTTP Server (สำหรับ Socket.IO)
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// เก็บ io instance ไว้ใน app (ใช้ใน routes ได้)
app.set('io', io);

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ✅ เปลี่ยนจาก app.listen → httpServer.listen
httpServer.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   🚀 TechBuddy Backend Server (Socket.IO Enabled)     ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║   📡 HTTP Server:    http://localhost:${PORT.toString().padEnd(21)} ║`);
  console.log(`║   🔌 Socket.IO:      Enabled${' '.repeat(27)}║`);
  console.log(`║   🌍 Environment:    ${(process.env.NODE_ENV || 'development').padEnd(27)}║`);
  console.log(`║   ⏰ Started:        ${new Date().toLocaleString('th-TH').padEnd(27)}║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📚 Available Routes:');
  console.log(`   🔐 Auth:         http://localhost:${PORT}/api/auth`);
  console.log(`   💬 Chat:         http://localhost:${PORT}/api/chat`);
  console.log(`   👥 Users:        http://localhost:${PORT}/api/users`);
  console.log(`   💭 Feedback:     http://localhost:${PORT}/api/feedback`);
  console.log(`   🤝 Friends:      http://localhost:${PORT}/api/friends`);
  console.log(`   📚 Thai Tutor:   http://localhost:${PORT}/api/thai-tutor`);
  console.log(`   ❤️  Health:       http://localhost:${PORT}/api/health`);
  console.log(`   🤖 Predict:      http://localhost:${PORT}/api/predict`);
  
  console.log('\n🇹🇭 Thai Tutor Endpoints:');
  console.log(`   📖 Daily Word:   http://localhost:${PORT}/api/thai-tutor/daily-word`);
  console.log(`   📂 Categories:   http://localhost:${PORT}/api/thai-tutor/categories`);
  console.log(`   💾 Save Word:    POST /api/thai-tutor/save-word`);
  console.log(`   ✅ Mark Learn:   POST /api/thai-tutor/mark-learned`);
  console.log(`   📊 Stats:        GET /api/thai-tutor/user/stats`);
  
  console.log('\n🔌 Socket.IO Events:');
  console.log('   📨 message:send     - Send message (real-time)');
  console.log('   📥 message:new      - Receive message');
  console.log('   ⌨️  typing:start    - User starts typing');
  console.log('   ⌨️  typing:stop     - User stops typing');
  console.log('   ✓✓ message:read    - Message read receipt');
  console.log('   🟢 user:online     - User online status');
  
  console.log('\n✅ Mobile apps can now connect!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP Server closed');
    io.close(() => {
      console.log('✅ Socket.IO closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP Server closed');
    io.close(() => {
      console.log('✅ Socket.IO closed');
      process.exit(0);
    });
  });
});

// Export for testing
module.exports = { app, httpServer, io };