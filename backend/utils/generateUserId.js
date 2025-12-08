const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate unique User ID in format: TB######
 * Example: TB000001, TB000002, TB000123
 */
async function generateUserId() {
  try {
    const count = await prisma.user.count();
    const nextNumber = count + 1;
    const userId = `TB${String(nextNumber).padStart(6, '0')}`;
    
    // ตรวจสอบว่ามี userId นี้อยู่แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { userId }
    });
    
    if (existingUser) {
      return generateUserId(); // recursive
    }
    
    return userId;
  } catch (error) {
    console.error('Error generating userId:', error);
    throw new Error('Failed to generate user ID');
  }
}

/**
 * Validate User ID format
 */
function validateUserId(userId) {
  const regex = /^TB\d{6}$/;
  return regex.test(userId);
}

module.exports = { 
  generateUserId,
  validateUserId 
};