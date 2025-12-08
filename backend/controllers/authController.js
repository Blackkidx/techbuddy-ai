// backend/controllers/authController.js
// ✅ COMPLETE FIXED VERSION

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ==========================================
// Helper: Generate User ID
// ==========================================
const generateUserId = async () => {
  const userCount = await prisma.user.count();
  const nextNumber = (userCount + 1).toString().padStart(6, '0');
  return `TB${nextNumber}`;
};

// ==========================================
// Helper: Generate JWT Token
// ==========================================
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      userId: user.userId,
      email: user.email,
      username: user.username 
    },
    process.env.JWT_SECRET || 'your-secret-key-change-this',
    { expiresIn: '7d' }
  );
};

// ==========================================
// Register User
// ==========================================
exports.register = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password,
      nativeLanguage,
      learningLanguage,
    } = req.body;

    console.log('📝 Register request:', { 
      username, 
      email, 
      nativeLanguage, 
      learningLanguage 
    });

    // ==========================================
    // Validation
    // ==========================================
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Username length validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    // ==========================================
    // Check if user already exists
    // ==========================================
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const existingUsername = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // ==========================================
    // Generate User ID
    // ==========================================
    const userId = await generateUserId();
    console.log('🆔 Generated User ID:', userId);

    // ==========================================
    // Hash Password
    // ==========================================
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ==========================================
    // Create User
    // ==========================================
    const user = await prisma.user.create({
      data: {
        userId,
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        nativeLanguage: nativeLanguage || 'English',
        learningLanguage: learningLanguage || 'Japanese',
        isOnline: true // Set online on registration
      }
    });

    console.log('✅ User created successfully:', user.userId);

    // ==========================================
    // Generate JWT Token
    // ==========================================
    const token = generateToken(user);

    // ==========================================
    // Return Response (exclude password)
    // ==========================================
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'Registration successful! 🎉',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `This ${field} is already taken`
      });
    }

    // Handle validation errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data provided'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==========================================
// Login User
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last seen & online status
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isOnline: true,
        lastSeen: new Date()
      }
    });

    // Generate token
    const token = generateToken(user);

    // Return response
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Login successful:', user.userId);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==========================================
// Logout User
// ==========================================
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update online status
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline: false,
        lastSeen: new Date()
      }
    });

    console.log('👋 User logged out:', req.user.userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// ==========================================
// Get Current User
// ==========================================
exports.me = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        nativeLanguage: true,
        learningLanguage: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      ...user
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    });
  }
};

// ==========================================
// Update Profile
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, nativeLanguage, learningLanguage,  } = req.body;

    console.log('📝 Updating profile for:', req.user.userId);

    // Build update data
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (nativeLanguage !== undefined) updateData.nativeLanguage = nativeLanguage;
    if (learningLanguage !== undefined) updateData.learningLanguage = learningLanguage;

    // Check if username is taken (if changing)
    if (username && username !== req.user.username) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        nativeLanguage: true,
        learningLanguage: true,
        avatarUrl: true
      }
    });

    console.log('✅ Profile updated:', updatedUser.userId);

    res.json({
      success: true,
      message: 'Profile updated successfully! ✨',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// ==========================================
// Change Password
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log('✅ Password changed for:', user.userId);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// ==========================================
// Refresh Token
// ==========================================
exports.refresh = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify old token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token: newToken,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};

module.exports = exports;