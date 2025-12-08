// backend/src/socket/index.js
// Socket.IO Main Setup - ตั้งค่า Socket.IO Server

const { Server } = require('socket.io');
const socketAuth = require('./socketAuth');
const messageHandler = require('./handlers/messageHandler');
const typingHandler = require('./handlers/typingHandler');

/**
 * Initialize Socket.IO Server
 * @param {Object} httpServer - HTTP Server instance
 * @returns {Object} io - Socket.IO instance
 */
const initializeSocket = (httpServer) => {
  
  // สร้าง Socket.IO instance
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // ในการ production ควรระบุ domain ที่ชัดเจน
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000  // 25 seconds
  });

  console.log('🚀 Socket.IO Server initialized');

  // ใช้ Authentication Middleware
  io.use(socketAuth);

  // จัดการ Connection
  io.on('connection', (socket) => {
    
    console.log(`\n✅ New Socket Connection:`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   User ID:   ${socket.userId}`);
    console.log(`   Username:  ${socket.username}`);

    // เข้า Room ของตัวเอง (สำหรับรับข้อความส่วนตัว)
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    console.log(`   Joined room: ${userRoom}\n`);

    // แจ้ง user อื่นๆ ว่า online แล้ว
    socket.broadcast.emit('user:status', {
      userId: socket.userId,
      username: socket.username,
      status: 'online'
    });

    // ส่ง confirmation กลับไปหา client
    socket.emit('connection:success', {
      socketId: socket.id,
      userId: socket.userId,
      message: 'Connected to TechBuddy Chat Server'
    });


    // Register Event Handlers
    messageHandler(io, socket);
    typingHandler(io, socket);


    /**
     * Event: user:online
     * เมื่อ user ประกาศว่า online
     */
    socket.on('user:online', async () => {
      try {
        console.log(`🟢 [${socket.username}] is now online`);

        // TODO: อัพเดท database (isOnline = true)
        
        // แจ้ง users อื่นๆ
        socket.broadcast.emit('user:status', {
          userId: socket.userId,
          username: socket.username,
          status: 'online'
        });

      } catch (error) {
        console.error('❌ Error in user:online:', error);
      }
    });


    /**
     * Event: disconnect
     * เมื่อ user ตัดการเชื่อมต่อ
     */
    socket.on('disconnect', (reason) => {
      console.log(`\n❌ Socket Disconnected:`);
      console.log(`   User:   ${socket.username} (${socket.userId})`);
      console.log(`   Reason: ${reason}\n`);

      // แจ้ง users อื่นๆ ว่า offline
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        username: socket.username,
        status: 'offline'
      });

      // TODO: อัพเดท database (isOnline = false, lastSeen = now)
    });


    /**
     * Event: error
     * เมื่อเกิด error
     */
    socket.on('error', (error) => {
      console.error(`❌ Socket Error [${socket.username}]:`, error);
    });

  });

  return io;
};

module.exports = initializeSocket;