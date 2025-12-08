// backend/controllers/chatController.js
// ✅ FINAL FIXED VERSION - แก้ไข MISSING EXPORTS และเพิ่ม Null Check ใน getFriends

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// =======================================================
// 1. Get Friends (Route: /friends)
// =======================================================
exports.getFriends = async (req, res) => {
  try {
    const userIdInt = req.user.id;
    const userIdString = req.user.userId;

    console.log('📋 Getting friends for user:', {
      userId: userIdString,
      id: userIdInt
    });

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userIdInt, status: 'ACCEPTED' },
          { friendId: userIdInt, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            avatarUrl: true,
            isOnline: true,
            lastSeen: true,
            nativeLanguage: true,
            learningLanguage: true
          }
        },
        friend: {
          select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            avatarUrl: true,
            isOnline: true,
            lastSeen: true,
            nativeLanguage: true,
            learningLanguage: true
          }
        }
      }
    });

    // 🚨 FIXED: Map ข้อมูลเพื่อนและเพิ่ม Null Check
    if (friendships.length > 0) {
      const friends = friendships.map(f => {
        const friendData = f.userId === userIdInt ? f.friend : f.user;

        // 🚨 Null/Integrity Check: กรอง Object ที่เป็น null หรือไม่มี userId (String ID) ทิ้ง
        if (!friendData || !friendData.userId) {
          console.warn('⚠️ Skipping corrupted friendship record (missing user data or userId)');
          return null;
        }

        return {
          id: friendData.id,
          userId: friendData.userId,
          username: friendData.username,
          email: friendData.email || '',
          avatarUrl: friendData.avatarUrl,
          isOnline: friendData.isOnline,
          lastSeen: friendData.lastSeen,
          nativeLanguage: friendData.nativeLanguage,
          learningLanguage: friendData.learningLanguage,
        };
      }).filter(friend => friend !== null); // กรองค่า null ออก

      return res.json({
        success: true,
        friends,
        count: friends.length
      });
    }

    // Fallback: return all users
    console.log('⚠️ No friendships found, returning all users');

    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          not: userIdInt
        }
      },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        nativeLanguage: true,
        learningLanguage: true
      },
      take: 50
    });

    res.json({
      success: true,
      friends: allUsers,
      count: allUsers.length
    });

  } catch (error) {
    console.error('❌ Get friends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends',
      message: error.message
    });
  }
};

// =======================================================
// 2. Send Message (Route: /send)
// ✅ FIXED: EXPORTED
// =======================================================
exports.sendMessage = async (req, res) => {
  console.warn('⚠️ HTTP POST /api/chat/send was called. Message sending should use Socket.IO.');
  res.status(202).json({
    success: true,
    message: 'Message processing moved to Socket.IO handler.',
    status: 'processing_via_socket'
  });
};

// =======================================================
// 3. Get Chat History (Route: /history)
// ✅ FIXED: EXPORTED
// =======================================================
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId: friendIdString } = req.query;
    const { limit = 50, before } = req.query;

    if (!friendIdString || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid User ID or Friend ID'
      });
    }

    const whereClause = {
      OR: [
        { senderId: userId, receiverId: friendIdString },
        { senderId: friendIdString, receiverId: userId }
      ]
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        sender: {
          select: { id: true, userId: true, username: true, avatarUrl: true, nativeLanguage: true }
        },
        receiver: {
          select: { id: true, userId: true, username: true, avatarUrl: true, learningLanguage: true }
        }
      }
    });

    const sortedMessages = messages.reverse();

    console.log(`✅ Loaded ${messages.length} messages`);

    res.json({
      success: true,
      messages: sortedMessages,
      count: messages.length
    });

  } catch (error) {
    console.error('❌ Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history',
      message: error.message
    });
  }
};

// =======================================================
// 3.1. Get Messages (Route: /messages/:friendId)
// ✅ FIXED: Added to match frontend API call
// =======================================================
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;
    const { limit = 50, before } = req.query;

    if (!friendId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid User ID or Friend ID'
      });
    }

    const whereClause = {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        sender: {
          select: { id: true, userId: true, username: true, avatarUrl: true, nativeLanguage: true }
        },
        receiver: {
          select: { id: true, userId: true, username: true, avatarUrl: true, learningLanguage: true }
        }
      }
    });

    const sortedMessages = messages.reverse();

    console.log(`✅ Loaded ${messages.length} messages for chat ${userId} <-> ${friendId}`);

    res.json({
      success: true,
      messages: sortedMessages,
      count: messages.length
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages',
      message: error.message
    });
  }
};

// =======================================================
// 4. Delete Message (Route: /messages/:id)
// ✅ FIXED: EXPORTED
// =======================================================
exports.deleteMessage = async (req, res) => {
  try {
    const { id: idString } = req.params;
    const userId = req.user.userId;

    const messageId = parseInt(idString, 10);

    if (!messageId || !userId) {
      return res.status(400).json({ error: 'Invalid message ID or User ID' });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.message.delete({ where: { id: messageId } });

    res.json({ success: true, message: 'Message deleted' });

  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// =======================================================
// 5. Mark As Read (Route: /messages/read/:friendId)
// ✅ FIXED: EXPORTED
// =======================================================
exports.markAsRead = async (req, res) => {
  res.json({ success: true, message: 'Mark as read placeholder' });
};

// =======================================================
// 6. Get Unread Count (Route: /unread)
// ✅ FIXED: EXPORTED
// =======================================================
exports.getUnreadCount = async (req, res) => {
  res.json({ success: true, unreadCount: 0 });
};