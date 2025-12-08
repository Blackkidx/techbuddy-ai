// backend/prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting seed...\n');

    // เคลียร์ข้อมูลเก่า (ถ้ามี)
    console.log('🗑️  Cleaning old data...');
    await prisma.userFeedback.deleteMany();
    await prisma.message.deleteMany();
    await prisma.friendship.deleteMany();
    // ⚠️ คำเตือน: ถ้า User ถูกลบ ข้อมูลทั้งหมดที่อ้างอิง User จะถูกลบตาม (Cascade Delete)
    await prisma.user.deleteMany(); 
    console.log('✅ Old data cleaned\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Users
    console.log('👥 Creating users...');
    const users = await Promise.all([
      prisma.user.create({
        data: {
          userId: 'TB000001',
          username: 'alice_test',
          email: 'alice@techbuddy.com',
          password: hashedPassword,
          nativeLanguage: 'English',
          learningLanguage: 'Japanese',
        }
      }),
      prisma.user.create({
        data: {
          userId: 'TB000002',
          username: 'bob_test',
          email: 'bob@techbuddy.com',
          password: hashedPassword,
          nativeLanguage: 'English',
          learningLanguage: 'Japanese',
        }
      }),
      prisma.user.create({
        data: {
          userId: 'TB000003',
          username: 'charlie_jp',
          email: 'charlie@techbuddy.com',
          password: hashedPassword,
          nativeLanguage: 'Japanese',
          learningLanguage: 'English',
        }
      })
    ]);

    console.log(`✅ Created ${users.length} users`);
    console.log(`   - ${users[0].username} (${users[0].userId})`);
    console.log(`   - ${users[1].username} (${users[1].userId})`);
    console.log(`   - ${users[2].username} (${users[2].userId})\n`);

    // 2. Create Friendships
    // ใช้ users[X].id (Int) เพราะ Friendship.userId/friendId อ้างอิง User.id (Int)
    console.log('🤝 Creating friendships...');
    const friendships = await Promise.all([
      // Alice <-> Bob (ACCEPTED)
      prisma.friendship.create({
        data: {
          userId: users[0].id, // ✅ ใช้ Int ID
          friendId: users[1].id, // ✅ ใช้ Int ID
          status: 'ACCEPTED'
        }
      }),
      // Bob <-> Alice (reverse - two-way)
      prisma.friendship.create({
        data: {
          userId: users[1].id,
          friendId: users[0].id,
          status: 'ACCEPTED'
        }
      }),
      // Alice <-> Charlie (ACCEPTED)
      prisma.friendship.create({
        data: {
          userId: users[0].id,
          friendId: users[2].id,
          status: 'ACCEPTED'
        }
      }),
      // Charlie <-> Alice (reverse - two-way)
      prisma.friendship.create({
        data: {
          userId: users[2].id,
          friendId: users[0].id,
          status: 'ACCEPTED'
        }
      }),
      // Bob -> Charlie (PENDING - รอการยอมรับ)
      prisma.friendship.create({
        data: {
          userId: users[1].id,
          friendId: users[2].id,
          status: 'PENDING'
        }
      })
    ]);

    console.log(`✅ Created ${friendships.length} friendships`);
    console.log(`   - Alice <-> Bob (ACCEPTED)`);
    console.log(`   - Alice <-> Charlie (ACCEPTED)`);
    console.log(`   - Bob -> Charlie (PENDING)\n`);

    // 3. Create Messages
    // ใช้ users[X].userId (String) เพราะ Message.senderId/receiverId อ้างอิง User.userId (String)
    console.log('💬 Creating messages...');
    const messages = await Promise.all([
      prisma.message.create({
        data: {
          // ✅ FIX 1: ใช้ String UUID (.userId)
          senderId: users[0].userId, 
          receiverId: users[1].userId, 
          content: 'Hey Bob! Can you help me debug this API?',
          intent: 'Request',
          confidence: 0.87,
          translation: 'やあボブ！このAPIのデバッグを手伝ってくれる？',
          technicalTerms: ['API', 'debug']
        }
      }),
      prisma.message.create({
        data: {
          // ✅ FIX 2: ใช้ String UUID (.userId)
          senderId: users[1].userId, 
          receiverId: users[0].userId, 
          content: 'Sure! What seems to be the problem?',
          intent: 'Question',
          confidence: 0.92,
          translation: 'もちろん！何が問題みたいですか？',
        }
      }),
      prisma.message.create({
        data: {
          // ✅ FIX 3: ใช้ String UUID (.userId)
          senderId: users[0].userId, 
          receiverId: users[2].userId, 
          content: 'The server is not responding to POST requests',
          intent: 'Problem',
          confidence: 0.95,
          translation: 'サーバーがPOSTリクエストに応答していません',
          technicalTerms: ['server', 'POST']
        }
      }),
      prisma.message.create({
        data: {
          // ✅ FIX 4: ใช้ String UUID (.userId)
          senderId: users[2].userId, 
          receiverId: users[0].userId, 
          content: 'データベースの接続エラーが発生しました',
          language: 'ja',
          intent: 'Problem',
          confidence: 0.93,
          translation: 'A database connection error has occurred',
          technicalTerms: ['データベース', 'エラー']
        }
      })
    ]);

    console.log(`✅ Created ${messages.length} messages\n`);

    // 4. Create Sample Feedbacks
    // ใช้ users[X].id (Int) เพราะ UserFeedback.userId อ้างอิง User.id (Int)
    console.log('📝 Creating sample feedbacks...');
    const feedbacks = await Promise.all([
      prisma.userFeedback.create({
        data: {
          userId: users[0].id, 
          messageId: messages[0].id,
          feedbackType: 'intent',
          originalText: 'Can you help me?',
          aiPrediction: 'Question',
          userCorrection: 'Request',
          isCorrect: false,
          confidenceScore: 0.75
        }
      }),
      prisma.userFeedback.create({
        data: {
          userId: users[1].id,
          messageId: messages[1].id,
          feedbackType: 'translation',
          originalText: 'Sure! What seems to be the problem?',
          aiPrediction: 'もちろん！何が問題みたいですか？',
          userCorrection: 'もちろん！何が問題ですか？',
          isCorrect: false,
          confidenceScore: 0.92
        }
      })
    ]);

    console.log(`✅ Created ${feedbacks.length} feedbacks\n`);

    console.log('🎉 Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Friendships: ${friendships.length} (including two-way)`);
    console.log(`   - Messages: ${messages.length}`);
    console.log(`   - Feedbacks: ${feedbacks.length}\n`);
    
    console.log('🔐 Test Accounts:');
    console.log(`   Email: alice@techbuddy.com | Password: password123`);
    console.log(`   Email: bob@techbuddy.com   | Password: password123`);
    console.log(`   Email: charlie@techbuddy.com | Password: password123\n`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 