// backend/src/controllers/thaiTutor.controller.js (ฉบับแก้ไข)

const { PrismaClient } = require('@prisma/client');
const ttsService = require('../services/tts.service'); // Note: ต้องมั่นใจว่า tts.service ถูกต้อง

const prisma = new PrismaClient();

class ThaiTutorController {
  /**
   * GET /api/thai-tutor/daily-word
   * Get today's word of the day
   */
  async getDailyWord(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      // 1. Check if daily word exists for today
      let dailyWord = await prisma.dailyWord.findUnique({
        where: { date: today },
        include: {
          word: true,
        },
      });

      // 2. If no daily word, create one
      if (!dailyWord) {
        // Get random word
        const wordCount = await prisma.thaiWord.count();

        // ********** ✅ จุดที่แก้ไข 1: จัดการกรณีฐานข้อมูลว่างเปล่า **********
        if (wordCount === 0) {
          console.error('❌ DB Error: No Thai words found in thaiWord table.');
          return res.status(500).json({ // 500 เพราะข้อมูลหลักของ Server หาย
            success: false,
            message: 'Server data missing: No Thai words available for selection.',
          });
        }
        // *******************************************************************
        
        const skip = Math.floor(Math.random() * wordCount);

        const randomWord = await prisma.thaiWord.findMany({
          take: 1,
          skip: skip,
        });

        if (randomWord.length === 0) {
          // This should ideally not happen if wordCount > 0, but acts as a safeguard
          return res.status(500).json({
            success: false,
            message: 'Internal data selection failed.',
          });
        }

        // Create daily word entry
        dailyWord = await prisma.dailyWord.create({
          data: {
            wordId: randomWord[0].id,
            date: today,
          },
          include: {
            word: true,
          },
        });
      }

      const word = dailyWord.word;

      // 3. Generate audio if doesn't exist
      if (!word.audioUrl) {
        // ********** ✅ จุดที่แก้ไข 2: จัดการ Error จาก ttsService **********
        let audioUrl = null;
        try {
          // 🚩 พยายามเรียกใช้ TTS Service (เป็นจุดที่อาจเกิด External API Error/Timeout)
          audioUrl = await ttsService.generateAudio(
            word.thaiWord,
            word.id
          );
          
          if (audioUrl) {
            await prisma.thaiWord.update({
              where: { id: word.id },
              data: { audioUrl },
            });
            word.audioUrl = audioUrl;
          }
        } catch (ttsError) {
          console.error('⚠️ TTS Service Failed:', ttsError.message);
          // 🚩 ปล่อยให้โค้ดทำงานต่อไปได้ แม้จะไม่มี Audio (Graceful degradation)
          // word.audioUrl จะเป็น null
        }
        // *******************************************************************
      }

      // 4. ส่ง Response สำเร็จ
      res.json({
        success: true,
        data: {
          id: word.id,
          thaiWord: word.thaiWord,
          pronunciation: word.pronunciation,
          englishTranslation: word.englishTranslation,
          japaneseTranslation: word.japaneseTranslation,
          culturalContext: word.culturalContext,
          category: word.category,
          difficulty: word.difficulty,
          audioUrl: word.audioUrl,
          exampleSentence: word.exampleSentence,
        },
      });
    } catch (error) {
      // 🚩 Log Error ที่เกิดขึ้นจริงใน Server
      console.error('🔴 Get Daily Word FATAL Error:', error.stack || error); 
      res.status(500).json({
        success: false,
        message: 'Failed to get daily word due to a server crash.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/thai-tutor/categories
   * Get all categories with word counts
   */
  async getCategories(req, res) {
    try {
      const categories = await prisma.thaiWord.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
      });

      const formattedCategories = categories.map((cat) => ({
        name: cat.category,
        count: cat._count.category,
      }));

      res.json({
        success: true,
        data: formattedCategories,
      });
    } catch (error) {
      console.error('Get Categories Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
      });
    }
  }

  /**
   * GET /api/thai-tutor/words/category/:category
   * Get words by category
   */
  async getWordsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { difficulty } = req.query; // Optional filter

      const where = { category };
      if (difficulty) {
        where.difficulty = difficulty;
      }

      const words = await prisma.thaiWord.findMany({
        where,
        orderBy: {
          difficulty: 'asc', // beginner first
        },
      });

      res.json({
        success: true,
        data: words,
      });
    } catch (error) {
      console.error('Get Words By Category Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get words',
      });
    }
  }

  /**
   * GET /api/thai-tutor/word/:id
   * Get word details by ID
   */
  async getWordById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // From auth middleware

      const word = await prisma.thaiWord.findUnique({
        where: { id: parseInt(id) },
      });

      if (!word) {
        return res.status(404).json({
          success: false,
          message: 'Word not found',
        });
      }

      // Generate audio if doesn't exist
      if (!word.audioUrl) {
        // 🚩 จัดการ Error จาก ttsService เช่นเดียวกับ getDailyWord
        try {
          const audioUrl = await ttsService.generateAudio(word.thaiWord, word.id);
          
          if (audioUrl) {
            await prisma.thaiWord.update({
              where: { id: word.id },
              data: { audioUrl },
            });
            word.audioUrl = audioUrl;
          }
        } catch (ttsError) {
           console.error('⚠️ TTS Service Failed for getWordById:', ttsError.message);
        }
      }

      // Get user progress if logged in
      let userProgress = null;
      if (userId) {
        userProgress = await prisma.userWordProgress.findUnique({
          where: {
            userId_wordId: {
              userId: userId,
              wordId: word.id,
            },
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...word,
          userProgress: userProgress || {
            learned: false,
            saved: false,
            reviewCount: 0,
          },
        },
      });
    } catch (error) {
      console.error('Get Word By ID Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get word',
      });
    }
  }

  /**
   * POST /api/thai-tutor/save-word
   * Save word to user's personal dictionary
   */
  async saveWord(req, res) {
    try {
      const { wordId } = req.body;
      const userId = req.user.id; // From auth middleware

      const progress = await prisma.userWordProgress.upsert({
        where: {
          userId_wordId: {
            userId: userId,
            wordId: parseInt(wordId),
          },
        },
        update: {
          saved: true,
        },
        create: {
          userId: userId,
          wordId: parseInt(wordId),
          saved: true,
        },
      });

      res.json({
        success: true,
        message: 'Word saved successfully!',
        data: progress,
      });
    } catch (error) {
      console.error('Save Word Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save word',
      });
    }
  }

  /**
   * POST /api/thai-tutor/mark-learned
   * Mark word as learned
   */
  async markLearned(req, res) {
    try {
      const { wordId } = req.body;
      const userId = req.user.id;

      const progress = await prisma.userWordProgress.upsert({
        where: {
          userId_wordId: {
            userId: userId,
            wordId: parseInt(wordId),
          },
        },
        update: {
          learned: true,
          reviewCount: {
            increment: 1,
          },
          lastReviewed: new Date(),
        },
        create: {
          userId: userId,
          wordId: parseInt(wordId),
          learned: true,
          reviewCount: 1,
          lastReviewed: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Word marked as learned!',
        data: progress,
      });
    } catch (error) {
      console.error('Mark Learned Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark word as learned',
      });
    }
  }

  /**
   * GET /api/thai-tutor/user/saved-words
   * Get user's saved words
   */
  async getSavedWords(req, res) {
    try {
      const userId = req.user.id;

      const savedProgress = await prisma.userWordProgress.findMany({
        where: {
          userId: userId,
          saved: true,
        },
        include: {
          word: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const savedWords = savedProgress.map((p) => ({
        ...p.word,
        progress: {
          learned: p.learned,
          saved: p.saved,
          reviewCount: p.reviewCount,
          lastReviewed: p.lastReviewed,
        },
      }));

      res.json({
        success: true,
        data: savedWords,
      });
    } catch (error) {
      console.error('Get Saved Words Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get saved words',
      });
    }
  }

  /**
   * GET /api/thai-tutor/user/learned-words
   * Get user's learned words
   */
  async getLearnedWords(req, res) {
    try {
      const userId = req.user.id;

      const learnedProgress = await prisma.userWordProgress.findMany({
        where: {
          userId: userId,
          learned: true,
        },
        include: {
          word: true,
        },
        orderBy: {
          lastReviewed: 'desc',
        },
      });

      const learnedWords = learnedProgress.map((p) => ({
        ...p.word,
        progress: {
          learned: p.learned,
          saved: p.saved,
          reviewCount: p.reviewCount,
          lastReviewed: p.lastReviewed,
        },
      }));

      res.json({
        success: true,
        data: learnedWords,
      });
    } catch (error) {
      console.error('Get Learned Words Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get learned words',
      });
    }
  }

  /**
   * GET /api/thai-tutor/user/stats
   * Get user's learning statistics
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await prisma.userWordProgress.aggregate({
        where: { userId: userId },
        _count: {
          _all: true,
        },
        _sum: {
          reviewCount: true,
        },
      });

      const learnedCount = await prisma.userWordProgress.count({
        where: {
          userId: userId,
          learned: true,
        },
      });

      const savedCount = await prisma.userWordProgress.count({
        where: {
          userId: userId,
          saved: true,
        },
      });

      const totalWords = await prisma.thaiWord.count();

      res.json({
        success: true,
        data: {
          totalWords: totalWords,
          wordsInteracted: stats._count._all,
          wordsLearned: learnedCount,
          wordsSaved: savedCount,
          totalReviews: stats._sum.reviewCount || 0,
          progressPercentage: Math.round((learnedCount / totalWords) * 100),
        },
      });
    } catch (error) {
      console.error('Get User Stats Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user stats',
      });
    }
  }

  /**
   * DELETE /api/thai-tutor/unsave-word/:wordId
   * Remove word from saved list
   */
  async unsaveWord(req, res) {
    try {
      const { wordId } = req.params;
      const userId = req.user.id;

      await prisma.userWordProgress.update({
        where: {
          userId_wordId: {
            userId: userId,
            wordId: parseInt(wordId),
          },
        },
        data: {
          saved: false,
        },
      });

      res.json({
        success: true,
        message: 'Word removed from saved list',
      });
    } catch (error) {
      console.error('Unsave Word Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsave word',
      });
    }
  }
}

module.exports = new ThaiTutorController();