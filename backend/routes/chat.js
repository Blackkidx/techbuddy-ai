// backend/routes/chat.js (ฉบับแก้ไข)

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// ทุก route ต้อง login ก่อน
router.use(authMiddleware);

// Message routes
router.post('/send', chatController.sendMessage);

// ✅ FIXED: Route /history ใช้ .get และดึงข้อมูลจาก Query
router.get('/history', chatController.getChatHistory);

// ✅ FIXED: Route /messages/:friendId สำหรับดึงข้อความ
router.get('/messages/:friendId', chatController.getMessages);

// ✅ FIXED: Route /messages/:id ใช้สำหรับ Delete
router.delete('/messages/:id', chatController.deleteMessage);

// ✅ FIXED: Route /messages/read/:friendId ใช้สำหรับ Mark as Read
router.put('/messages/read/:friendId', chatController.markAsRead);

// Friends & utility routes
router.get('/friends', chatController.getFriends);
router.get('/unread', chatController.getUnreadCount);

module.exports = router;