// backend/routes/friends.js
// ✅ FINAL FIXED VERSION - รองรับทั้ง friendId (Int) และ friendUserId (String)

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// ====================================
// 1. Send Friend Request (POST /add)
// ✅ FIXED: รองรับทั้ง friendId (Int) และ friendUserId (String)
// ====================================
router.post('/add', async (req, res) => {
  try {
    const userId = req.user.id; // Int PK
    const currentUserUserId = req.user.userId; // String Custom ID

    // ✅ รองรับหลาย field names
    const { 
      friendId,      // Int PK
      friendUserId,  // String Custom ID
      userId: targetUserId,  // String Custom ID (alias)
      targetId,      // Int PK (alias)
      receiverId     // String Custom ID (alias)
    } = req.body;
    
    let targetFriend = null;
    let targetFriendId = null; // Int PK ที่จะใช้สร้าง Friendship

    console.log('📥 Add friend request:', {
      from: currentUserUserId,
      payload: req.body
    });

    // ========================================
    // Case 1: ส่ง friendUserId (String) มา
    // ========================================
    if (friendUserId) {
      console.log('🔍 Looking up friend by userId (String):', friendUserId);
      
      // ตรวจสอบว่าไม่ใช่ตัวเอง
      if (friendUserId === currentUserUserId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }
      
      targetFriend = await prisma.user.findUnique({
        where: { userId: friendUserId } // ✅ Query ด้วย String Custom ID
      });
      
      if (!targetFriend) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${friendUserId}" not found`
        });
      }
      
      targetFriendId = targetFriend.id; // ได้ Int PK
    }
    // ========================================
    // Case 2: ส่ง friendId (Int) มา
    // ========================================
    else if (friendId) {
      console.log('🔍 Looking up friend by id (Int):', friendId);
      
      const friendIdInt = parseInt(friendId, 10);
      
      if (isNaN(friendIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid friend ID format'
        });
      }
      
      // ตรวจสอบว่าไม่ใช่ตัวเอง
      if (friendIdInt === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }
      
      targetFriend = await prisma.user.findUnique({
        where: { id: friendIdInt } // ✅ Query ด้วย Int PK
      });
      
      if (!targetFriend) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${friendIdInt} not found`
        });
      }
      
      targetFriendId = friendIdInt;
    }
    // ========================================
    // Case 3: ส่ง targetUserId (String) มา
    // ========================================
    else if (targetUserId) {
      console.log('🔍 Looking up friend by targetUserId (String):', targetUserId);
      
      if (targetUserId === currentUserUserId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }
      
      targetFriend = await prisma.user.findUnique({
        where: { userId: targetUserId }
      });
      
      if (!targetFriend) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${targetUserId}" not found`
        });
      }
      
      targetFriendId = targetFriend.id;
    }
    // ========================================
    // Case 4: ส่ง targetId (Int) มา
    // ========================================
    else if (targetId) {
      console.log('🔍 Looking up friend by targetId (Int):', targetId);
      
      const targetIdInt = parseInt(targetId, 10);
      
      if (isNaN(targetIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target ID format'
        });
      }
      
      if (targetIdInt === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }
      
      targetFriend = await prisma.user.findUnique({
        where: { id: targetIdInt }
      });
      
      if (!targetFriend) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${targetIdInt} not found`
        });
      }
      
      targetFriendId = targetIdInt;
    }
    // ========================================
    // Case 5: ส่ง receiverId (String) มา
    // ========================================
    else if (receiverId) {
      console.log('🔍 Looking up friend by receiverId (String):', receiverId);
      
      if (receiverId === currentUserUserId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }
      
      targetFriend = await prisma.user.findUnique({
        where: { userId: receiverId }
      });
      
      if (!targetFriend) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${receiverId}" not found`
        });
      }
      
      targetFriendId = targetFriend.id;
    }
    // ========================================
    // Case 6: ไม่ส่งอะไรมาเลย
    // ========================================
    else {
      return res.status(400).json({
        success: false,
        message: 'Friend ID is required. Supported fields: friendId, friendUserId, userId, targetId, receiverId'
      });
    }

    // ========================================
    // ✅ พบ target friend แล้ว
    // ========================================
    console.log('✅ Found target friend:', {
      id: targetFriendId,
      userId: targetFriend.userId,
      username: targetFriend.username
    });

    // ตรวจสอบว่ามี friendship อยู่แล้วไหม
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: targetFriendId },
          { userId: targetFriendId, friendId: userId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        message: existingFriendship.status === 'PENDING' 
          ? 'Friend request already sent' 
          : 'Friendship already exists or was handled',
        status: existingFriendship.status
      });
    }

    // สร้าง friend request
    const friendship = await prisma.friendship.create({
      data: {
        userId: userId,
        friendId: targetFriendId, // ✅ ใช้ Int PK
        status: 'PENDING'
      },
      include: {
        friend: {
          select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            avatarUrl: true,
            nativeLanguage: true,
            learningLanguage: true
          }
        }
      }
    });

    console.log('✅ Friend request created:', friendship.id);

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      friendship
    });

  } catch (error) {
    console.error('❌ Add friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request',
      error: error.message
    });
  }
});

// ====================================
// 2. Get Friend List (GET /list)
// ====================================
router.get('/list', async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึง friendships ที่ status = ACCEPTED
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' }
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
            nativeLanguage: true,
            learningLanguage: true,
            isOnline: true,
            lastSeen: true
          }
        },
        friend: {
          select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            avatarUrl: true,
            nativeLanguage: true,
            learningLanguage: true,
            isOnline: true,
            lastSeen: true
          }
        }
      }
    });

    // Map ข้อมูลเพื่อนและเพิ่ม Null Check
    const friendsList = friendships
        .map(f => {
            const friendData = f.userId === userId ? f.friend : f.user;

            // Null/Integrity Check
            if (!friendData || !friendData.userId) {
                console.warn('⚠️ Skipping corrupted friend list record');
                return null;
            }

            return {
                id: friendData.id,
                userId: friendData.userId,
                username: friendData.username,
                email: friendData.email,
                avatarUrl: friendData.avatarUrl,
                isOnline: friendData.isOnline,
                lastSeen: friendData.lastSeen,
                nativeLanguage: friendData.nativeLanguage,
                learningLanguage: friendData.learningLanguage,
            };
        })
        .filter(friend => friend !== null);

    res.json({
      success: true,
      count: friendsList.length,
      friends: friendsList
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friends',
      error: error.message
    });
  }
});

// ====================================
// 3. Get All Pending Friend Requests (GET /requests)
// ====================================
router.get('/requests', async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            avatarUrl: true,
            nativeLanguage: true,
            learningLanguage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: requests.length,
      requests: requests.map(req => ({
        id: req.id,
        user: req.user,
        createdAt: req.createdAt
      }))
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend requests',
      error: error.message
    });
  }
});

// ====================================
// 3.1: Get Pending Friend Requests Count (GET /requests/pending)
// ====================================
router.get('/requests/pending', async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING'
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            avatarUrl: true,
            nativeLanguage: true,
            learningLanguage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      count: requests.length,
      requests: requests.map(req => ({
        id: req.id, 
        user: req.user,
      }))
    });

  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending friend requests',
      error: error.message
    });
  }
});

// ====================================
// 4. Accept Friend Request (POST /accept/:friendshipId)
// ====================================
router.post('/accept/:friendshipId', async (req, res) => {
  try {
    const { friendshipId: idString } = req.params;
    const userId = req.user.id;

    const friendshipId = parseInt(idString, 10);
    if (isNaN(friendshipId)) throw new Error('Invalid Friendship ID format');

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendship.friendId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Request already ${friendship.status.toLowerCase()}`
      });
    }

    await prisma.friendship.update({
      where: { id: friendshipId }, 
      data: { status: 'ACCEPTED' }
    });

    // สร้าง Reverse Friendship (Two-way)
    const reverseExists = await prisma.friendship.findFirst({
      where: {
        userId: userId,
        friendId: friendship.userId,
      }
    });

    if (!reverseExists) {
      await prisma.friendship.create({
        data: {
          userId: userId, 
          friendId: friendship.userId, 
          status: 'ACCEPTED'
        }
      });
    }

    res.json({
      success: true,
      message: 'Friend request accepted',
    });

  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept friend request',
      error: error.message
    });
  }
});

// ====================================
// 5. Reject Friend Request (POST /reject/:friendshipId)
// ====================================
router.post('/reject/:friendshipId', async (req, res) => {
  try {
    const { friendshipId: idString } = req.params;
    const userId = req.user.id;

    const friendshipId = parseInt(idString, 10);
    if (isNaN(friendshipId)) throw new Error('Invalid Friendship ID format');
    
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendship.friendId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    res.json({
      success: true,
      message: 'Friend request rejected',
    });

  } catch (error) {
    console.error('Reject friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject friend request',
      error: error.message
    });
  }
});

// ====================================
// 6. Remove Friend (DELETE /remove/:friendId)
// ====================================
router.delete('/remove/:friendId', async (req, res) => {
  try {
    const { friendId: friendIdString } = req.params;
    const userId = req.user.id;

    const friendId = parseInt(friendIdString, 10);
    if (isNaN(friendId)) throw new Error('Invalid Friend ID format');
    
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove friend',
      error: error.message
    });
  }
});

module.exports = router;