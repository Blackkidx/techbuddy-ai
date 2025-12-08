// addTestUsers.js (FIXED VERSION)
// Run: node addTestUsers.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addTestUsers() {
  try {
    console.log('🚀 Adding test users with correct emails...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ==========================================
    // ✅ Add alice@test.com
    // ==========================================
    console.log('1️⃣ Checking alice@test.com...');
    
    const existingAlice = await prisma.user.findUnique({
      where: { email: 'alice@test.com' }
    });

    if (existingAlice) {
      console.log('   ✅ alice@test.com already exists');
      console.log(`   🆔 User ID: ${existingAlice.userId}`);
    } else {
      // นับ users เพื่อสร้าง userId ใหม่
      const userCount = await prisma.user.count();
      const aliceUserId = `TB${String(userCount + 1).padStart(6, '0')}`;
      
      const alice = await prisma.user.create({
        data: {
          userId: aliceUserId,
          username: 'Alice',
          email: 'alice@test.com',
          password: hashedPassword,
          nativeLanguage: 'English',      // ✅ ใช้ nativeLanguage แทน
          learningLanguage: 'Japanese'    // ✅ เพิ่ม learningLanguage
        }
      });
      
      console.log('   ✅ Created alice@test.com');
      console.log(`   🆔 User ID: ${alice.userId}`);
    }

    // ==========================================
    // ✅ Add bob@test.com
    // ==========================================
    console.log('\n2️⃣ Checking bob@test.com...');
    
    const existingBob = await prisma.user.findUnique({
      where: { email: 'bob@test.com' }
    });

    if (existingBob) {
      console.log('   ✅ bob@test.com already exists');
      console.log(`   🆔 User ID: ${existingBob.userId}`);
    } else {
      const userCount = await prisma.user.count();
      const bobUserId = `TB${String(userCount + 1).padStart(6, '0')}`;
      
      const bob = await prisma.user.create({
        data: {
          userId: bobUserId,
          username: 'Bob',
          email: 'bob@test.com',
          password: hashedPassword,
          nativeLanguage: 'Japanese',     // ✅ ใช้ nativeLanguage
          learningLanguage: 'English'     // ✅ เพิ่ม learningLanguage
        }
      });
      
      console.log('   ✅ Created bob@test.com');
      console.log(`   🆔 User ID: ${bob.userId}`);
    }

    // ==========================================
    // ✅ Summary
    // ==========================================
    console.log('\n🎉 ========== SUMMARY ==========');
    console.log('\n📝 Login credentials:');
    console.log('   Email: alice@test.com');
    console.log('   Password: password123');
    console.log('   (Native: English, Learning: Japanese)\n');
    console.log('   Email: bob@test.com');
    console.log('   Password: password123');
    console.log('   (Native: Japanese, Learning: English)');
    console.log('\n================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

addTestUsers();