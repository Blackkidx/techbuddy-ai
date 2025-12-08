// Fix orphaned Friendship records before migration
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedRecords() {
    try {
        console.log('🔧 Cleaning up orphaned Friendship records...');

        // Delete friendships where userId or friendId doesn't exist in User table
        const result = await prisma.$executeRaw`
      DELETE FROM "Friendship" 
      WHERE "userId" NOT IN (SELECT id FROM "User")
         OR "friendId" NOT IN (SELECT id FROM "User")
    `;

        console.log(`✅ Deleted ${result} orphaned friendship records`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupOrphanedRecords();
