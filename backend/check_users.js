// backend/check_users.js
// เช็คว่ามี User อะไรบ้างใน Database

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n🔍 Checking Users in Database...\n');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,          // Int (Primary Key)
      userId: true,      // String (UUID)
      username: true,
      email: true
    }
  });

  console.log(`📊 Found ${users.length} users:\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. User:`);
    console.log(`   id (Int):     ${user.id}`);
    console.log(`   userId (UUID): ${user.userId}`);
    console.log(`   username:      ${user.username}`);
    console.log(`   email:         ${user.email}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkUsers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});