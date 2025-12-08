// backend/src/socket/handlers/typingHandler.js (OPTIMIZED VERSION)

/**
 * Typing Handler with Auto-Stop Timeout
 * - จัดการสถานะการพิมพ์
 * - หยุดอัตโนมัติหลัง 3 วินาทีถ้า client ไม่ส่ง stop
 */

const typingTimeouts = new Map(); // { userId_receiverId: timeoutId }

const typingHandler = (io, socket) => {

  /**
   * Event: typing:start
   */
  socket.on('typing:start', (data) => {
    try {
      const { receiverId } = data;
      const senderId = socket.userId;

      console.log(`⌨️ typing:start: ${senderId} → ${receiverId}`);

      // ✅ ยกเลิก timeout เดิม (ถ้ามี)
      const timeoutKey = `${senderId}_${receiverId}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey));
      }

      // ส่ง typing status
      const receiverRoom = `user:${receiverId}`;
      io.to(receiverRoom).emit('typing:status', {
        userId: senderId,
        username: socket.username,
        isTyping: true
      });

      // ✅ ตั้ง auto-stop หลัง 3 วินาที
      const timeout = setTimeout(() => {
        io.to(receiverRoom).emit('typing:status', {
          userId: senderId,
          username: socket.username,
          isTyping: false
        });
        typingTimeouts.delete(timeoutKey);
        console.log(`⏱️ Auto-stopped typing: ${timeoutKey}`);
      }, 3000);

      typingTimeouts.set(timeoutKey, timeout);

    } catch (error) {
      console.error('❌ Error in typing:start:', error);
    }
  });

  /**
   * Event: typing:stop
   */
  socket.on('typing:stop', (data) => {
    try {
      const { receiverId } = data;
      const senderId = socket.userId;

      console.log(`⌨️ typing:stop: ${senderId} → ${receiverId}`);

      // ✅ ยกเลิก timeout
      const timeoutKey = `${senderId}_${receiverId}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey));
        typingTimeouts.delete(timeoutKey);
      }

      // ส่ง typing status
      const receiverRoom = `user:${receiverId}`;
      io.to(receiverRoom).emit('typing:status', {
        userId: senderId,
        username: socket.username,
        isTyping: false
      });

    } catch (error) {
      console.error('❌ Error in typing:stop:', error);
    }
  });

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    // ✅ ลบ timeout ทั้งหมดของ user นี้
    const userId = socket.userId;
    const toDelete = [];

    for (const [key, timeout] of typingTimeouts.entries()) {
      if (key.startsWith(`${userId}_`)) {
        clearTimeout(timeout);
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => typingTimeouts.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cleared ${toDelete.length} typing timeouts for ${userId}`);
    }
  });

};

module.exports = typingHandler;