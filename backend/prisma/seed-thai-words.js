// backend/prisma/seed-thai-words.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const thaiWords = [
  // === GREETINGS ===
  {
    thaiWord: 'สวัสดี',
    pronunciation: 'sa-wat-dee',
    englishTranslation: 'Hello / Goodbye',
    japaneseTranslation: 'こんにちは / さようなら',
    culturalContext: 'A respectful greeting used at any time of day. When speaking, Thai people often add "krap" (male) or "ka" (female) at the end for politeness. This is the most important word in Thai!',
    category: 'greeting',
    difficulty: 'beginner',
    exampleSentence: 'สวัสดีครับ (sa-wat-dee krap) - Hello (said by males)\nสวัสดีค่ะ (sa-wat-dee ka) - Hello (said by females)',
  },
  {
    thaiWord: 'ขอบคุณ',
    pronunciation: 'khop-khun',
    englishTranslation: 'Thank you',
    japaneseTranslation: 'ありがとうございます', // Adjusted to polite form
    culturalContext: 'Expressing gratitude. Add "krap/ka" for politeness. "Khop khun mak" means "thank you very much". Thai culture highly values showing appreciation.',
    category: 'greeting',
    difficulty: 'beginner',
    exampleSentence: 'ขอบคุณมากครับ (khop-khun mak krap) - Thank you very much',
  },
  {
    thaiWord: 'ไม่เป็นไร',
    pronunciation: 'mai-pen-rai',
    englishTranslation: "It's okay / Never mind / No problem",
    japaneseTranslation: '大丈夫です / 気にしないで',
    culturalContext: 'THE most Thai phrase! Represents the Thai attitude of acceptance and not worrying too much. Can mean "you\'re welcome", "no problem", "don\'t worry", or "it doesn\'t matter". Central to Thai philosophy of life.',
    category: 'greeting',
    difficulty: 'beginner',
    exampleSentence: 'ไม่เป็นไรครับ (mai-pen-rai krap) - It\'s okay, don\'t worry',
  },
  {
    thaiWord: 'ขอโทษ',
    pronunciation: 'khor-toht',
    englishTranslation: 'Sorry / Excuse me',
    japaneseTranslation: 'ごめんなさい / すみません',
    culturalContext: 'Used to apologize or to get someone\'s attention politely. Thai culture values politeness and respect.',
    category: 'greeting',
    difficulty: 'beginner',
    exampleSentence: 'ขอโทษครับ ผมมาสาย (khor-toht krap, phom ma sai) - Sorry, I\'m late',
  },

  // === CONVERSATION ===
  {
    thaiWord: 'เข้าใจไหม',
    pronunciation: 'kao-jai-mai',
    englishTranslation: 'Do you understand?',
    japaneseTranslation: 'わかりますか？',
    culturalContext: 'Common question in learning situations. "Mai" at the end makes it a yes/no question. To respond: "เข้าใจ" (kao-jai) = I understand.',
    category: 'conversation',
    difficulty: 'beginner',
    exampleSentence: 'คุณเข้าใจไหมครับ (khun kao-jai-mai krap) - Do you understand?',
  },
  {
    thaiWord: 'ช่วยได้ไหม',
    pronunciation: 'chuay-dai-mai',
    englishTranslation: 'Can you help?',
    japaneseTranslation: '手伝ってもらえますか？',
    culturalContext: 'Polite way to ask for help. Thai people are generally very helpful.',
    category: 'conversation',
    difficulty: 'beginner',
    exampleSentence: 'ช่วยผมได้ไหมครับ (chuay phom dai mai krap) - Can you help me?',
  },

  // === WORK ===
  {
    thaiWord: 'ทำงาน',
    pronunciation: 'tham-ngan',
    englishTranslation: 'Work / To work',
    japaneseTranslation: '仕事 / 働く',
    culturalContext: 'Can be both noun and verb. In Thai culture, work-life balance is important but dedication is valued.',
    category: 'work',
    difficulty: 'beginner',
    exampleSentence: 'ผมทำงานที่บริษัท (phom tham-ngan tee bo-ri-sat) - I work at a company',
  },
  {
    thaiWord: 'ประชุม',
    pronunciation: 'pra-chum',
    englishTranslation: 'Meeting',
    japaneseTranslation: '会議',
    culturalContext: 'Common in office settings. Thai meetings often start with relationship building.',
    category: 'work',
    difficulty: 'beginner',
    exampleSentence: 'มีประชุมตอนบ่าย (mee pra-chum ton bai) - Meeting this afternoon',
  },
  {
    thaiWord: 'เดดไลน์',
    pronunciation: 'dead-line',
    englishTranslation: 'Deadline',
    japaneseTranslation: '締め切り',
    culturalContext: 'Borrowed English word, commonly used in Thai workplaces.',
    category: 'work',
    difficulty: 'beginner',
    exampleSentence: 'เดดไลน์วันพรุ่งนี้ (dead-line wan phroong-nee) - Deadline tomorrow',
  },

  // === TECH ===
  {
    thaiWord: 'โค้ดดิ้ง',
    pronunciation: 'code-ding',
    englishTranslation: 'Coding',
    japaneseTranslation: 'コーディング',
    culturalContext: 'Borrowed English word. Thai developers often mix Thai and English.',
    category: 'tech',
    difficulty: 'intermediate',
    exampleSentence: 'ผมชอบโค้ดดิ้ง (phom chop code-ding) - I like coding',
  },
  {
    thaiWord: 'ดีบัก',
    pronunciation: 'dee-bug',
    englishTranslation: 'Debug',
    japaneseTranslation: 'デバッグ',
    culturalContext: 'Programming term from English. Common in tech conversations.',
    category: 'tech',
    difficulty: 'intermediate',
    exampleSentence: 'ต้องดีบักโค้ดก่อน (tong dee-bug code gon) - Need to debug first',
  },

  // === FOOD ===
  {
    thaiWord: 'อร่อย',
    pronunciation: 'a-roi',
    englishTranslation: 'Delicious',
    japaneseTranslation: 'おいしい',
    culturalContext: 'One of the most important words! Food is central to Thai social life.',
    category: 'food',
    difficulty: 'beginner',
    exampleSentence: 'อาหารอร่อยมาก (a-han a-roi mak) - Very delicious',
  },
  {
    thaiWord: 'หิว',
    pronunciation: 'hew',
    englishTranslation: 'Hungry',
    japaneseTranslation: 'お腹が空きました', // Adjusted to polite form
    culturalContext: 'Thai people often ask "กินข้าวหรือยัง" (Have you eaten?) as greeting.',
    category: 'food',
    difficulty: 'beginner',
    exampleSentence: 'ผมหิวครับ (phom hew krap) - I\'m hungry',
  },
  {
    thaiWord: 'เผ็ด',
    pronunciation: 'phet',
    englishTranslation: 'Spicy',
    japaneseTranslation: '辛い',
    culturalContext: 'Very important! You can say "ไม่เผ็ด" (not spicy) or "เผ็ดน้อย" (little spicy).',
    category: 'food',
    difficulty: 'beginner',
    exampleSentence: 'เผ็ดมากไหม (phet mak mai) - Is it very spicy?',
  },

  // === ENCOURAGEMENT ===
  {
    thaiWord: 'สู้ๆ',
    pronunciation: 'suu-suu',
    englishTranslation: 'Fighting! / Keep going!',
    japaneseTranslation: '頑張って！',
    culturalContext: 'Common encouragement. Similar to Korean "fighting!"',
    category: 'encouragement',
    difficulty: 'beginner',
    exampleSentence: 'สู้ๆนะครับ! (suu-suu na krap) - Keep fighting!',
  },
  {
    thaiWord: 'เป็นกำลังใจให้',
    pronunciation: 'pen-gam-lang-jai-hai',
    englishTranslation: 'To support / To encourage',
    japaneseTranslation: '応援しています', // Adjusted to natural expression
    culturalContext: 'Thai culture values encouragement and moral support.',
    category: 'encouragement',
    difficulty: 'intermediate',
    exampleSentence: 'ผมเป็นกำลังใจให้คุณ (phom pen-gam-lang-jai-hai khun) - I support you',
  },
  {
    thaiWord: 'เก่งมาก',
    pronunciation: 'geng-mak',
    englishTranslation: 'Very good! / Well done!',
    japaneseTranslation: 'すごい！ / よくできました', // Added "Well done" nuance
    culturalContext: 'Common praise for skills or achievement.',
    category: 'encouragement',
    difficulty: 'beginner',
    exampleSentence: 'คุณทำได้เก่งมาก (khun tham-dai geng-mak) - You did very well!',
  },
];

async function seedThaiWords() {
  console.log('🇹🇭 Seeding Thai words...\n');
  
  let created = 0;
  let skipped = 0;

  for (const word of thaiWords) {
    try {
      await prisma.thaiWord.upsert({
        where: { thaiWord: word.thaiWord },
        update: {},
        create: word,
      });
      created++;
      console.log(`   ✅ ${word.thaiWord} (${word.pronunciation})`);
    } catch (error) {
      skipped++;
      console.log(`   ⏭️  ${word.thaiWord} (already exists)`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Created: ${created} words`);
  console.log(`   - Skipped: ${skipped} words`);
  console.log(`   - Total: ${thaiWords.length} words\n`);
}

async function main() {
  try {
    await seedThaiWords();
    console.log('🎉 Thai words seed completed!\n');
  } catch (error) {
    console.error('❌ Error seeding Thai words:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();