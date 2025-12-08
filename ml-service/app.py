# ml-service/app.py (Improved Version - Fixed Japanese NER & Translation)

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    AutoModelForSeq2SeqLM 
)
import re
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# ==========================================
# Global Variables
# ==========================================

intent_model = None
intent_tokenizer = None
intent_labels = None

ner_pipeline = None

translator_en_ja = None
tokenizer_en_ja = None

translator_ja_en = None
tokenizer_ja_en = None

# ==========================================
# Japanese Technical Terms Dictionary
# ==========================================

JAPANESE_TECH_TERMS = {
    # Japanese -> English mapping
    # Database & Backend
    'データベース': 'database',
    'エラー': 'error',
    '接続': 'connection',
    'サーバー': 'server',
    'バックエンド': 'backend',
    
    # Frontend & Mobile
    'フロントエンド': 'frontend',
    'モバイル': 'mobile',
    'ウェブ': 'web',
    'ブラウザ': 'browser',
    'アプリケーション': 'application',
    'アプリ': 'app',
    
    # Network & API
    'API': 'API',
    'ネットワーク': 'network',
    'プロトコル': 'protocol',
    'HTTP': 'HTTP',
    'HTTPS': 'HTTPS',
    'REST': 'REST',
    'WebSocket': 'WebSocket',
    
    # Hardware
    'CPU': 'CPU',
    'GPU': 'GPU',
    'SSD': 'SSD',
    'HDD': 'HDD',
    'RAM': 'RAM',
    'メモリ': 'memory',
    'メモリー': 'memory',
    'ハードウェア': 'hardware',
    'ディスク': 'disk',
    'ストレージ': 'storage',
    
    # Development
    'コード': 'code',
    'スクリプト': 'script',
    'プログラム': 'program',
    'デバッグ': 'debug',
    'テスト': 'test',
    'デプロイ': 'deploy',
    'デプロイメント': 'deployment',
    'ビルド': 'build',
    'コンパイル': 'compile',
    'バグ': 'bug',
    'リファクタリング': 'refactoring',
    
    # Authentication & Security
    'ログイン': 'login',
    'ログアウト': 'logout',
    'ユーザー': 'user',
    'パスワード': 'password',
    'セキュリティ': 'security',
    '認証': 'authentication',
    '暗号化': 'encryption',
    'トークン': 'token',
    'JWT': 'JWT',
    'OAuth': 'OAuth',
    
    # Cloud & DevOps
    'クラウド': 'cloud',
    'Docker': 'Docker',
    'Kubernetes': 'Kubernetes',
    'コンテナ': 'container',
    'AWS': 'AWS',
    'Azure': 'Azure',
    'GCP': 'GCP',
    'CI/CD': 'CI/CD',
    'DevOps': 'DevOps',
    
    # Data & Files
    'ファイル': 'file',
    'フォルダ': 'folder',
    'フォルダー': 'folder',
    'ディレクトリ': 'directory',
    'アップデート': 'update',
    'ダウンロード': 'download',
    'アップロード': 'upload',
    'バックアップ': 'backup',
    'データ': 'data',
    
    # System
    'システム': 'system',
    'OS': 'OS',
    'Linux': 'Linux',
    'Windows': 'Windows',
    'macOS': 'macOS',
    'Android': 'Android',
    'iOS': 'iOS',
    
    # Programming Languages
    'React': 'React',
    'React Native': 'React Native',
    'Node.js': 'Node.js',
    'Python': 'Python',
    'JavaScript': 'JavaScript',
    'TypeScript': 'TypeScript',
    'Java': 'Java',
    'Go': 'Go',
    'Rust': 'Rust',
    'C++': 'C++',
    'PHP': 'PHP',
    'Ruby': 'Ruby',
    'Swift': 'Swift',
    'Kotlin': 'Kotlin',
    
    # Databases
    'PostgreSQL': 'PostgreSQL',
    'MySQL': 'MySQL',
    'MongoDB': 'MongoDB',
    'Redis': 'Redis',
    'SQLite': 'SQLite',
    'MariaDB': 'MariaDB',
    'Oracle': 'Oracle',
    'SQL': 'SQL',
    
    # Frameworks & Libraries
    'Express': 'Express',
    'Django': 'Django',
    'Flask': 'Flask',
    'Spring': 'Spring',
    'Laravel': 'Laravel',
    'Vue': 'Vue',
    'Angular': 'Angular',
    'Next.js': 'Next.js',
    'Prisma': 'Prisma',
    
    # Formats & Protocols
    'JSON': 'JSON',
    'XML': 'XML',
    'YAML': 'YAML',
    'HTML': 'HTML',
    'CSS': 'CSS',
    
    # Tools
    'Git': 'Git',
    'GitHub': 'GitHub',
    'GitLab': 'GitLab',
    'npm': 'npm',
    'yarn': 'yarn',
    'pip': 'pip',
    'webpack': 'webpack',
    'Babel': 'Babel',
    
    # Other
    'レスポンス': 'response',
    'リクエスト': 'request',
    'エンドポイント': 'endpoint',
    'インターフェース': 'interface',
    'ライブラリ': 'library',
    'フレームワーク': 'framework',
    'バージョン': 'version',
    'リリース': 'release',
    '互換性': 'compatibility',
    '設定': 'configuration',
    'インストール': 'install',
    'アンインストール': 'uninstall'
}

# Language name to code mapping
LANGUAGE_NAME_TO_CODE = {
    # Full names to codes
    'english': 'en',
    'japanese': 'ja',
    'thai': 'th',
    # Capitalized versions
    'English': 'en',
    'Japanese': 'ja',
    'Thai': 'th',
    # Already codes (pass through)
    'en': 'en',
    'ja': 'ja',
    'th': 'th',
    'EN': 'en',
    'JA': 'ja',
    'TH': 'th',
    # Common variants
    'jp': 'ja',  # Common variant for Japanese
    'JP': 'ja'
}

# English Technical Terms (for protection during translation)
ENGLISH_TECH_TERMS = [
    'React Native', 'React', 'Node.js', 'Express', 'PostgreSQL', 'MySQL', 
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'API', 'REST', 'GraphQL', 'WebSocket', 'JWT', 'OAuth',
    'frontend', 'backend', 'database', 'server', 'client',
    'authentication', 'authorization', 'encryption', 'security',
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
    'HTML', 'CSS', 'JSON', 'XML', 'YAML',
    'Git', 'GitHub', 'GitLab', 'CI/CD', 'DevOps',
    'nginx', 'Apache', 'Tomcat', 'Redis', 'Kafka',
    'Prisma', 'Sequelize', 'TypeORM', 'Mongoose',
    'npm', 'yarn', 'pip', 'cargo', 'maven',
    'debug', 'bug', 'error', 'exception', 'crash',
    'deploy', 'build', 'compile', 'test', 'production'
]

# ==========================================
# Load Models
# ==========================================

def load_intent_model():
    """Load Intent Classification Model"""
    global intent_model, intent_tokenizer, intent_labels
    
    try:
        print("📦 Loading Intent Model...")
        model_path = "./model/techbuddy_intent_final"
        
        intent_tokenizer = AutoTokenizer.from_pretrained(model_path)
        intent_model = AutoModelForSequenceClassification.from_pretrained(model_path)
        intent_labels = ["Problem", "Question", "Request", "Update"]
        
        print("✅ Intent Model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading Intent Model: {e}")
        return False

def load_ner_model():
    """Load NER Model (BERT+CRF)"""
    global ner_pipeline
    
    try:
        print("📦 Loading NER Model (BERT+CRF)...")
        model_path = "./model/ner_model_final"
        
        from ner_pipeline import NERPipeline
        ner_pipeline = NERPipeline.from_pretrained(model_path)
        
        print("✅ NER Model (BERT+CRF) loaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error loading NER Model: {e}")
        import traceback
        traceback.print_exc()
        return False

def load_translation_models():
    """Load M2M100 Translation Model for better EN-JA/JA-EN translation"""
    global translator_en_ja, tokenizer_en_ja, translator_ja_en, tokenizer_ja_en
    
    # 💡 Use M2M100 - better for technical content
    MODEL_NAME = 'facebook/m2m100_418M'  # or 'facebook/m2m100_1.2B' for better quality
    
    try:
        print("📦 Loading Translation Model (M2M100)...")
        print(f"  Model: {MODEL_NAME}")
        
        from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
        
        # Load shared model and tokenizer
        tokenizer_en_ja = M2M100Tokenizer.from_pretrained(MODEL_NAME)
        translator_en_ja = M2M100ForConditionalGeneration.from_pretrained(MODEL_NAME)
        
        # Reuse for JA→EN (same model, different target language)
        tokenizer_ja_en = tokenizer_en_ja
        translator_ja_en = translator_en_ja
        
        print("✅ Translation Model (M2M100) loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading M2M100: {e}")
        print("⚠️  Trying fallback to MarianMT...")
        
        # Fallback to MarianMT
        try:
            EN_JA_MODEL = 'Helsinki-NLP/opus-mt-en-jap'  # Better model
            JA_EN_MODEL = 'Helsinki-NLP/opus-mt-jap-en'
            
            print(f"  Loading EN→JA from {EN_JA_MODEL}...")
            tokenizer_en_ja = AutoTokenizer.from_pretrained(EN_JA_MODEL)
            translator_en_ja = AutoModelForSeq2SeqLM.from_pretrained(EN_JA_MODEL)
            
            print(f"  Loading JA→EN from {JA_EN_MODEL}...")
            tokenizer_ja_en = AutoTokenizer.from_pretrained(JA_EN_MODEL)
            translator_ja_en = AutoModelForSeq2SeqLM.from_pretrained(JA_EN_MODEL)
            
            print("✅ Translation Models (MarianMT fallback) loaded!")
            return True
        except Exception as e2:
            print(f"❌ Error loading fallback models: {e2}")
            return False

# ==========================================
# Helper Functions - IMPROVED
# ==========================================

def normalize_language_code(lang):
    """Convert language name to language code (e.g., 'English' -> 'en')"""
    if not lang:
        return 'en'  # Default to English
    
    # Check if it's already a valid code or convert from name
    normalized = LANGUAGE_NAME_TO_CODE.get(lang) or LANGUAGE_NAME_TO_CODE.get(lang.lower())
    
    if normalized:
        return normalized
    
    # If not found, assume it's already a code and return lowercase
    return lang.lower()

def detect_language(text):
    """Detect if text is Japanese or English"""
    japanese_chars = sum(1 for char in text if '\u3040' <= char <= '\u30ff' or '\u4e00' <= char <= '\u9fff')
    
    if japanese_chars > len(text) * 0.3:
        return 'ja'
    return 'en'

def extract_japanese_technical_terms(text):
    """Extract Japanese technical terms using pattern matching"""
    found_terms = []
    
    for ja_term, en_term in JAPANESE_TECH_TERMS.items():
        if ja_term in text:
            start = text.find(ja_term)
            found_terms.append({
                'term': ja_term,
                'english': en_term,
                'start': start,
                'end': start + len(ja_term),
                'score': 1.0
            })
    
    # Remove overlapping/duplicate terms (keep longer ones)
    filtered_terms = []
    for term in sorted(found_terms, key=lambda x: len(x['term']), reverse=True):
        # Check if this term overlaps with any existing term
        overlaps = False
        for existing in filtered_terms:
            if (term['start'] >= existing['start'] and term['start'] < existing['end']) or \
               (term['end'] > existing['start'] and term['end'] <= existing['end']):
                overlaps = True
                break
        
        if not overlaps:
            filtered_terms.append(term)
    
    # Sort by start position
    return sorted(filtered_terms, key=lambda x: x['start'])

def extract_english_technical_terms(text):
    """Extract English technical terms using pattern matching (more reliable than BERT tokenization)"""
    # Always use pattern matching for better accuracy
    return extract_english_terms_by_pattern(text)
    
    # Old BERT-based code disabled due to tokenization issues
    # if ner_pipeline is None:
    #     return extract_english_terms_by_pattern(text)
    
    try:
        entities = ner_pipeline(text)
        
        # Merge subword tokens
        merged_terms = []
        current_term = None
        
        for entity in entities:
            word = entity['word']
            
            # Skip single characters (likely tokenization errors)
            if len(word) <= 1 and not word.isupper():
                continue
            
            # Start new term
            if current_term is None:
                current_term = {
                    'term': word,
                    'score': entity['score'],
                    'start': entity.get('start', 0),
                    'end': entity.get('end', 0)
                }
            else:
                # Merge if consecutive
                if entity.get('start', 0) <= current_term['end'] + 1:
                    current_term['term'] += word.replace('##', '')
                    current_term['end'] = entity.get('end', current_term['end'])
                    current_term['score'] = min(current_term['score'], entity['score'])
                else:
                    # Save previous term
                    if len(current_term['term']) > 1:  # Skip single chars
                        merged_terms.append(current_term)
                    
                    # Start new term
                    current_term = {
                        'term': word,
                        'score': entity['score'],
                        'start': entity.get('start', 0),
                        'end': entity.get('end', 0)
                    }
        
        # Add last term
        if current_term and len(current_term['term']) > 1:
            merged_terms.append(current_term)
        
        # Format results
        tech_terms = []
        for term in merged_terms:
            tech_terms.append({
                'term': term['term'],
                'score': round(term['score'], 3),
                'start': term['start'],
                'end': term['end']
            })
        
        return tech_terms
        
    except Exception as e:
        print(f"❌ NER extraction error: {e}")
        return extract_english_terms_by_pattern(text)

def extract_english_terms_by_pattern(text):
    """Fallback: Extract English technical terms by pattern matching"""
    found_terms = []
    text_lower = text.lower()
    
    for term in ENGLISH_TECH_TERMS:
        # Case-insensitive search
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        for match in pattern.finditer(text):
            found_terms.append({
                'term': match.group(),
                'score': 1.0,
                'start': match.start(),
                'end': match.end()
            })
    
    # Remove overlapping/duplicate terms (keep longer ones)
    filtered_terms = []
    for term in sorted(found_terms, key=lambda x: len(x['term']), reverse=True):
        # Check if this term overlaps with any existing term
        overlaps = False
        for existing in filtered_terms:
            if (term['start'] >= existing['start'] and term['start'] < existing['end']) or \
               (term['end'] > existing['start'] and term['end'] <= existing['end']):
                overlaps = True
                break
        
        if not overlaps:
            filtered_terms.append(term)
    
    # Sort by start position
    return sorted(filtered_terms, key=lambda x: x['start'])

def extract_technical_terms(text, language):
    """Main function to extract technical terms based on language"""
    if language == 'ja':
        return extract_japanese_technical_terms(text)
    else:
        return extract_english_technical_terms(text)

def protect_technical_terms(text, technical_terms):
    """Replace technical terms with natural placeholders before translation"""
    protected_text = text
    term_map = {}
    
    # Natural placeholder mapping (words that translate well)
    natural_placeholders = [
        "technology", "system", "platform", "framework", "service",
        "application", "software", "program", "tool", "interface",
        "module", "component", "library", "package", "environment"
    ]
    
    # Sort by start position (reverse) to avoid index shifting
    sorted_terms = sorted(technical_terms, key=lambda x: x['start'], reverse=True)
    
    for i, term_obj in enumerate(sorted_terms):
        term = term_obj['term']
        
        # Use natural placeholder (cycle through list)
        placeholder = natural_placeholders[i % len(natural_placeholders)]
        
        # Make it unique by adding context if needed
        if placeholder in term_map.values():
            placeholder = f"{placeholder} system"
        
        # Replace in text
        start = term_obj['start']
        end = term_obj['end']
        protected_text = protected_text[:start] + placeholder + protected_text[end:]
        
        # Store mapping (reverse: placeholder -> original term)
        term_map[placeholder] = term
    
    return protected_text, term_map

def restore_technical_terms(translated_text, term_map):
    """Restore technical terms from placeholders"""
    restored_text = translated_text
    
    for placeholder, original_term in term_map.items():
        restored_text = restored_text.replace(placeholder, original_term)
    
    return restored_text

def should_use_intent(text, technical_terms):
    """Determine if Intent Detection should be used"""
    
    if len(technical_terms) > 0:
        return True
    
    word_count = len(text.split())
    if word_count < 5:
        return False
    
    casual_phrases = [
        'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay',
        'good morning', 'good afternoon', 'good evening', 'good night',
        'bye', 'goodbye', 'see you', 'こんにちは', 'ありがとう', 'おはよう'
    ]
    lower_text = text.lower().strip()
    
    if lower_text in casual_phrases:
        return False
    
    return True

def predict_intent(text, source_lang):
    """Predict Intent Classification"""
    if intent_model is None:
        return None, None
    
    try:
        # If Japanese, translate to English first for better accuracy
        text_for_classification = text
        if source_lang == 'ja':
            translated = translate_text(text, 'ja', 'en', protect_terms=False)
            if translated:
                text_for_classification = translated
                print(f"  🔄 Translated for classification: {text_for_classification[:50]}...")
        
        inputs = intent_tokenizer(text_for_classification, return_tensors="pt", truncation=True, max_length=128)
        
        with torch.no_grad():
            outputs = intent_model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)
            
            confidence, predicted_idx = torch.max(probs, dim=-1)
            intent = intent_labels[predicted_idx.item()]
            
            return intent, round(confidence.item(), 3)
    except Exception as e:
        print(f"❌ Intent prediction error: {e}")
        return None, None

def translate_text(text, source_lang, target_lang, protect_terms=False):
    """Translate text using M2M100 or MarianMT (term protection disabled by default)"""
    
    global translator_en_ja, tokenizer_en_ja, translator_ja_en, tokenizer_ja_en

    if translator_en_ja is None or translator_ja_en is None:
        return None
    
    # Normalize language codes (e.g., 'English' -> 'en', 'Japanese' -> 'ja')
    source_lang = normalize_language_code(source_lang)
    target_lang = normalize_language_code(target_lang)
    
    print(f"  🔄 Normalized languages: {source_lang} -> {target_lang}")
    
    # Skip if same language
    if source_lang == target_lang:
        return None
    
    try:
        translation = None
        term_map = {}
        text_to_translate = text
        
        # Protect technical terms if enabled (currently disabled)
        if protect_terms:
            # Extract terms from source text
            technical_terms = extract_technical_terms(text, source_lang)
            if technical_terms:
                text_to_translate, term_map = protect_technical_terms(text, technical_terms)
                # print(f"  🛡️  Protected {len(term_map)} technical terms")  # Disabled for now

        # Check if using M2M100 (has set_src_lang_special_tokens method)
        is_m2m100 = hasattr(tokenizer_en_ja, 'set_src_lang_special_tokens')
        
        if is_m2m100:
            # M2M100 Translation
            print(f"  🔄 Using M2M100 translation ({source_lang} -> {target_lang})...")
            
            # Set source language
            tokenizer_en_ja.src_lang = source_lang
            
            # Tokenize
            inputs = tokenizer_en_ja(text_to_translate, return_tensors="pt", padding=True, max_length=512, truncation=True)
            
            # Generate translation
            generated_tokens = translator_en_ja.generate(
                **inputs,
                forced_bos_token_id=tokenizer_en_ja.get_lang_id(target_lang),
                num_beams=5,
                max_length=512,
                early_stopping=True
            )
            
            translation = tokenizer_en_ja.batch_decode(generated_tokens, skip_special_tokens=True)[0]
            
            # Clean output
            if translation and target_lang == 'ja':
                translation = translation.replace(" ", "")  # Remove spaces in Japanese
        
        else:
            # MarianMT Translation (fallback)
            print("  🔄 Using MarianMT translation...")
            
            # EN → JA
            if source_lang == 'en' and target_lang == 'ja':
                inputs = tokenizer_en_ja(text_to_translate, return_tensors="pt", padding=True, max_length=512, truncation=True)
                
                translated = translator_en_ja.generate(
                    **inputs,
                    num_beams=5,
                    max_length=512,
                    early_stopping=True
                )
                
                translation = tokenizer_en_ja.decode(translated[0], skip_special_tokens=True)
                
                # Clean Japanese output
                if translation:
                    translation = translation.replace(" ", "")
                    
                    # Remove translation prefix if present
                    prefixes = ["英語を日本語に翻訳:", "英語を日本語に翻訳します:", "Translate English to Japanese:"]
                    for prefix in prefixes:
                        if translation.startswith(prefix):
                            translation = translation[len(prefix):].strip()
            
            # JA → EN
            elif source_lang == 'ja' and target_lang == 'en':
                inputs = tokenizer_ja_en(text_to_translate, return_tensors="pt", padding=True, max_length=512, truncation=True)
                
                translated = translator_ja_en.generate(
                    **inputs,
                    num_beams=5,
                    max_length=512,
                    early_stopping=True
                )

                translation = tokenizer_ja_en.decode(translated[0], skip_special_tokens=True)
                
                # Remove translation prefix if present
                if translation:
                    prefixes = ["日本語を英語に翻訳:", "日本語を英語に翻訳します:", "Translate Japanese to English:"]
                    for prefix in prefixes:
                        if translation.startswith(prefix):
                            translation = translation[len(prefix):].strip()
        
        # Restore technical terms (if protected)
        if term_map:
            translation = restore_technical_terms(translation, term_map)
        
        return translation
            
    except Exception as e:
        print(f"❌ Translation error: {e}")
        import traceback
        traceback.print_exc()
        return None

# ==========================================
# Routes
# ==========================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'TechBuddy ML Service',
        'version': '2.0 - Improved',
        'models': {
            'intent': intent_model is not None,
            'ner': ner_pipeline is not None,
            'translation_en_ja': translator_en_ja is not None,
            'translation_ja_en': translator_ja_en is not None
        },
        'features': {
            'japanese_ner': 'Pattern-based',
            'english_ner': 'BERT+CRF',
            'technical_term_protection': True,
            'smart_intent_detection': True
        }
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Full AI Analysis Pipeline (Improved)
    Request: { "text": "..." }
    Response: { 
        "success": true, 
        "intent": "...", 
        "confidence": 0.95, 
        "translation": "...", 
        "technicalTerms": [...],
        "sourceLanguage": "en",
        "targetLanguage": "ja"
    }
    """
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        print(f"📥 Analyzing: {text[:50]}...")
        
        # Step 1: Detect source language
        source_lang = detect_language(text)
        print(f"🌐 Language: {source_lang}")
        
        # Auto-determine target language (default logic)
        # If target_lang is provided in request, use it. Otherwise default to EN/JA switch.
        req_target_lang = data.get('target_lang')
        
        if req_target_lang:
            target_lang = normalize_language_code(req_target_lang)
        else:
            target_lang = 'en' if source_lang == 'ja' else 'ja'
            
        print(f"🎯 Target Language: {target_lang}")
        
        # Step 2: Extract technical terms (language-specific)
        technical_terms = extract_technical_terms(text, source_lang)
        print(f"🔍 Technical terms: {len(technical_terms)}")
        if technical_terms:
            print(f"    → {[t['term'] for t in technical_terms[:5]]}")
        
        # Step 3: Smart Intent Detection
        intent = None
        confidence = None
        
        if should_use_intent(text, technical_terms):
            intent, confidence = predict_intent(text, source_lang)
            if intent:
                print(f"🎯 Intent: {intent} ({confidence})")
        else:
            print("ℹ️  Casual message - Intent skipped")
        
        # Step 4: Translation (without term protection for now - MarianMT handles tech terms better directly)
        translation = translate_text(text, source_lang, target_lang, protect_terms=False)
        if translation:
            print(f"🌍 Translation: {translation[:50]}...")
        
        # Response
        return jsonify({
            'success': True,
            'intent': intent,
            'confidence': confidence,
            'translation': translation,
            'technicalTerms': technical_terms,
            'sourceLanguage': source_lang,
            'targetLanguage': target_lang
        })
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==========================================
# Initialize
# ==========================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 TechBuddy ML Service Starting (Improved v2.0)")
    print("="*50 + "\n")
    
    # Load models
    intent_loaded = load_intent_model()
    ner_loaded = load_ner_model()
    translation_loaded = load_translation_models()
    
    print("\n" + "="*50)
    print("📊 Model Status:")
    print(f"  Intent Classification: {'✅' if intent_loaded else '❌'}")
    print(f"  NER (BERT+CRF):        {'✅' if ner_loaded else '❌'}")
    print(f"  Translation (EN↔JA):  {'✅' if translation_loaded else '❌'}")
    print("="*50)
    print("\n💡 New Features:")
    print("  ✅ Japanese NER with pattern matching")
    print("  ✅ Technical term protection during translation")
    print("  ✅ Auto target language detection")
    print("  ✅ Smart intent classification for Japanese")
    print("="*50 + "\n")
    
    if not intent_loaded:
        print("⚠️  Warning: Intent model failed to load!")
    
    if not ner_loaded:
        print("⚠️  Warning: NER model failed to load (will use pattern matching)")
    
    if not translation_loaded:
        print("⚠️  Warning: Translation models failed to load!")
    
    print("🌐 Starting Flask server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)