// backend/src/services/tts.service.js

const gtts = require('gtts');
const fs = require('fs');
const path = require('path');

class TTSService {
  constructor() {
    // สร้างโฟลเดอร์สำหรับเก็บไฟล์เสียง
    this.audioDir = path.join(__dirname, '../../public/audio/thai');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Generate Thai audio file using Google TTS
   * @param {string} text - Thai text to convert
   * @param {number} wordId - Word ID for filename
   * @returns {Promise<string>} - Audio file path
   */
  async generateAudio(text, wordId) {
    try {
      const filename = `thai_word_${wordId}.mp3`;
      const filepath = path.join(this.audioDir, filename);

      // Check if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`   ⏭️  Audio already exists for word ${wordId}`);
        return `/audio/thai/${filename}`;
      }

      // Generate TTS
      const speech = new gtts(text, 'th'); // 'th' = Thai language

      return new Promise((resolve, reject) => {
        speech.save(filepath, (err) => {
          if (err) {
            console.error(`   ❌ TTS Error for word ${wordId}:`, err);
            reject(err);
          } else {
            console.log(`   ✅ Generated audio: ${filename}`);
            resolve(`/audio/thai/${filename}`);
          }
        });
      });
    } catch (error) {
      console.error('TTS Service Error:', error);
      throw error;
    }
  }

  /**
   * Generate slow Thai audio for pronunciation practice
   * @param {string} text - Thai text
   * @param {number} wordId - Word ID
   * @returns {Promise<string>} - Audio file path
   */
  async generateSlowAudio(text, wordId) {
    try {
      const filename = `thai_word_${wordId}_slow.mp3`;
      const filepath = path.join(this.audioDir, filename);

      if (fs.existsSync(filepath)) {
        return `/audio/thai/${filename}`;
      }

      const speech = new gtts(text, 'th');
      speech.speed = 0.5; // Slow speed

      return new Promise((resolve, reject) => {
        speech.save(filepath, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`   ✅ Generated slow audio: ${filename}`);
            resolve(`/audio/thai/${filename}`);
          }
        });
      });
    } catch (error) {
      console.error('Slow TTS Error:', error);
      throw error;
    }
  }

  /**
   * Delete audio file
   * @param {string} audioUrl - Audio URL to delete
   */
  deleteAudio(audioUrl) {
    try {
      const filepath = path.join(__dirname, '../../public', audioUrl);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`   🗑️  Deleted audio: ${audioUrl}`);
      }
    } catch (error) {
      console.error('Delete Audio Error:', error);
    }
  }
}

module.exports = new TTSService();