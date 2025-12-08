// backend/check_friends.js
// เช็คว่า User ปัจจุบันมีเพื่อนใครบ้าง

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFriends() {
  console.log('\n🔍 Checking Friendships in Database...\n');
  
  const friendships = await prisma.friendship.findMany({
    include: {
      user: {
        select: {
          id: true,
          userId: true,
          username: true
        }
      },
      friend: {
        select: {
          id: true,
          userId: true,
          username: true
        }
      }
    }
  });

  console.log(`📊 Found ${friendships.length} friendships:\n`);
  
  friendships.forEach((friendship, index) => {
    console.log(`${index + 1}. Friendship:`);
    console.log(`   User:   ${friendship.user.username} (id=${friendship.user.id}, userId=${friendship.user.userId})`);
    console.log(`   Friend: ${friendship.friend.username} (id=${friendship.friend.id}, userId=${friendship.friend.userId})`);
    console.log(`   Status: ${friendship.status}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkFriends().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});