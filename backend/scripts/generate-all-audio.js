// backend/scripts/generate-all-audio.js

const { PrismaClient } = require('@prisma/client');
const gtts = require('gtts');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Audio directory
const AUDIO_DIR = path.join(__dirname, '../public/audio/thai');

// Ensure directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log('✅ Created audio directory:', AUDIO_DIR);
}

async function generateAllAudio() {
  try {
    console.log('🎤 Starting audio generation for all Thai words...\n');

    // Get all Thai words
    const words = await prisma.thaiWord.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`📊 Found ${words.length} words to process\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const word of words) {
      const audioFileName = `thai_word_${word.id}.mp3`;
      const audioPath = path.join(AUDIO_DIR, audioFileName);
      const audioUrl = `/audio/thai/${audioFileName}`;

      // Check if audio already exists
      if (fs.existsSync(audioPath)) {
        console.log(`⏭️  [${word.id}] Skip: "${word.thaiWord}" - Audio already exists`);
        
        // Update database anyway
        await prisma.thaiWord.update({
          where: { id: word.id },
          data: { audioUrl }
        });
        
        skipCount++;
        continue;
      }

      try {
        console.log(`🔄 [${word.id}] Generating: "${word.thaiWord}" (${word.pronunciation})`);
        
        // Generate audio using gtts
        const speech = new gtts(word.thaiWord, 'th');
        
        await new Promise((resolve, reject) => {
          speech.save(audioPath, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });

        // Wait a bit to ensure file is written
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify file was created
        if (!fs.existsSync(audioPath)) {
          throw new Error('File was not created');
        }

        // Update database with audio URL
        await prisma.thaiWord.update({
          where: { id: word.id },
          data: { audioUrl }
        });

        console.log(`✅ [${word.id}] Success: "${word.thaiWord}" - ${audioFileName}`);
        successCount++;

      } catch (error) {
        console.error(`❌ [${word.id}] Error: "${word.thaiWord}" - ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Audio Generation Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Generated: ${successCount} files`);
    console.log(`⏭️  Skipped:   ${skipCount} files (already exist)`);
    console.log(`❌ Errors:    ${errorCount} files`);
    console.log(`📊 Total:     ${words.length} words`);
    console.log('='.repeat(60));

    // Show file list
    console.log('\n📂 Audio directory:');
    console.log(`   ${AUDIO_DIR}\n`);
    
    if (fs.existsSync(AUDIO_DIR)) {
      const audioFiles = fs.readdirSync(AUDIO_DIR);
      
      if (audioFiles.length > 0) {
        console.log('📁 Files created:');
        audioFiles.forEach(file => {
          const filePath = path.join(AUDIO_DIR, file);
          const stats = fs.statSync(filePath);
          const sizeKB = (stats.size / 1024).toFixed(2);
          console.log(`   ✓ ${file} (${sizeKB} KB)`);
        });
      } else {
        console.log('⚠️  No audio files found!');
      }
    } else {
      console.log('❌ Audio directory does not exist!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
console.log('Starting audio generation script...\n');
generateAllAudio();