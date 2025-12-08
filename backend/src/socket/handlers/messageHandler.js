// backend/src/socket/handlers/messageHandler.js (OPTIMIZED VERSION)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const mlService = require('../../../services/mlService'); // ✅ Import ML Service

/**
 * Cache สำหรับ userId lookup (เพื่อลดการ query DB)
 * Format: { "2": "TB000002", "3": "TB000003" }
 * ⚠️ Note: Cache นี้อาจไม่จำเป็นถ้า User ID เป็น String อยู่แล้ว แต่เก็บไว้เผื่อการแปลง Int/String ID
 */
const userIdCache = new Map();

/**
 * Helper: แปลง id → userId แบบมี cache (ปรับปรุงให้รองรับ String ID)
 */
async function resolveUserId(idOrUserId) {
  // ถ้าเป็น userId แล้ว (ขึ้นต้นด้วย TB) → return เลย
  if (typeof idOrUserId === 'string' && idOrUserId.startsWith('TB')) {
    return idOrUserId;
  }

  // เนื่องจาก DB คาดหวัง String ID เราจะใช้ค่าที่ส่งมาตรงๆ
  return String(idOrUserId);
}

const messageHandler = (io, socket) => {

  // ===== SEND MESSAGE (Real-time message creation) =====
  socket.on('message:send', async (data) => {
    try {
      console.log(`📤 [${socket.username}] Sending message via Socket:`, data);

      const { tempId, receiverId, content, language } = data; // ใช้ content แทน text

      // Validation
      if (!receiverId || !content) {
        socket.emit('message:error', {
          tempId,
          error: 'Missing required fields: receiverId or content'
        });
        return;
      }

      // ✅ ใช้ String ID โดยตรง
      const senderUserId = socket.userId;
      const receiverUserId = receiverId.toString(); // รับค่ามาแล้วแปลงเป็น String 

      // 1. Fetch Receiver's Native Language
      let targetLang = 'en'; // Default
      try {
        const receiverUser = await prisma.user.findUnique({
          where: { userId: receiverUserId },
          select: { nativeLanguage: true }
        });
        if (receiverUser && receiverUser.nativeLanguage) {
          targetLang = receiverUser.nativeLanguage;
          console.log(`🎯 Target Language for ${receiverUserId}: ${targetLang}`);
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch receiver language, defaulting to EN');
      }

      // 🧠 AI Analysis (เรียก ML Service)
      let aiResult = {
        intent: 'Chat',
        confidence: 0,
        translation: '',
        technicalTerms: []
      };

      try {
        // Pass targetLang to ML Service
        const analysis = await mlService.analyze(content, targetLang);

        if (analysis.success) {
          aiResult = {
            intent: analysis.intent || 'Chat',
            confidence: analysis.confidence || 0,
            translation: analysis.translation || '',
            technicalTerms: analysis.technicalTerms || []
          };
          console.log(`   🧠 AI Analysis Result: Intent=${aiResult.intent}, Translation="${aiResult.translation.substring(0, 20)}..."`);
        }
      } catch (aiError) {
        console.error('⚠️ AI Analysis failed, proceeding with defaults:', aiError.message);
      }

      // 🚩 บันทึกลง Database
      const message = await prisma.message.create({
        data: {
          senderId: senderUserId, // String ID
          receiverId: receiverUserId, // String ID
          content: content,
          language: language || 'en',
          intent: aiResult.intent,
          confidence: aiResult.confidence,
          translation: aiResult.translation,
          // ✅ Fix: Extract just the terms (strings) from the objects
          technicalTerms: aiResult.technicalTerms.map(t => t.term)
        },
      });

      // 🚩 ดึง Message พร้อม Include (จำเป็นสำหรับ Frontend UI)
      const fullMessage = await prisma.message.findUnique({
        where: { id: message.id },
        include: {
          sender: { select: { id: true, userId: true, username: true } },
          receiver: { select: { id: true, userId: true, username: true } }
        }
      });

      console.log(`✅ Message saved: ID=${message.id}`);

      // 1. ส่ง confirmation กลับไปหา sender (ยืนยันว่าบันทึกสำเร็จ)
      socket.emit('message:sent', {
        tempId,
        chatId: message.id,
        status: 'sent',
        createdAt: message.createdAt
      });

      // 2. ส่ง Event message:new ไปยังผู้รับและผู้ส่ง (Real-time update)
      const senderRoom = `user:${senderUserId}`;
      const receiverRoom = `user:${receiverUserId}`;

      // ✅ Add tempId for sender (for optimistic update matching)
      const messageForSender = {
        ...fullMessage,
        tempId: tempId, // ✅ Include tempId so mobile can match and update
      };

      // ส่งหาตัวเอง (ใช้ fullMessage with tempId)
      io.to(senderRoom).emit('message:new', messageForSender);

      // ส่งหาคู่สนทนา (ถ้าไม่ใช่ส่งหาตัวเอง)
      if (senderUserId !== receiverUserId) {
        io.to(receiverRoom).emit('message:new', fullMessage); // Receiver doesn't need tempId
      }

      console.log(`📨 Socket Event: message:new broadcasted to ${senderUserId} and ${receiverUserId}`);

    } catch (error) {
      console.error('❌ Error in message:send (Socket):', error);

      socket.emit('message:error', {
        tempId: data.tempId,
        error: error.message
      });
    }
  });

  // ===== READ MESSAGE =====
  socket.on('message:read', async (data) => {
    try {
      // ... Logic เดิม (ใช้ String ID)
      const { chatId, senderId } = data;
      console.log(`👁️ [${socket.username}] Read: ${chatId}`);

      const senderRoom = `user:${senderId}`; // senderId เป็น String ID

      io.to(senderRoom).emit('message:read', {
        chatId,
        readAt: new Date(),
        readBy: socket.userId
      });

      console.log(`✅ Read receipt → ${senderRoom}`);

    } catch (error) {
      console.error('❌ Error in message:read:', error);
    }
  });

  // ===== FETCH MESSAGES (Optional Socket Fetch) =====
  socket.on('messages:fetch', async (data) => {
    // ... Logic เดิม (ใช้ String ID)
    console.log('⚠️ messages:fetch event is deprecated. Use HTTP GET /api/chat/history instead.');
    socket.emit('messages:error', { error: 'Please use HTTP GET /api/chat/history for fetching history.' });
  });
};

module.exports = messageHandler;