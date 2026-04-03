-- ============================================================
-- TechBuddy: Supabase Migration Schema
-- Converted from Prisma schema.prisma → Supabase SQL
-- ============================================================

-- ==========================================
-- 0. Enable Required Extensions
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Enum Types
-- ==========================================
CREATE TYPE friendship_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- ==========================================
-- 2. Profiles Table (replaces Prisma "User" model)
--    auth.users handles email/password
--    profiles stores app-specific user data
-- ==========================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id     TEXT UNIQUE,           -- Legacy ID like "TB000001" (optional, for backward compat)
  username    TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  native_language   TEXT DEFAULT 'English',
  learning_language TEXT DEFAULT 'Japanese',
  is_online   BOOLEAN DEFAULT false,
  last_seen   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- ==========================================
-- 3. Auto-create profile on signup (Trigger)
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    'TB' || LPAD((SELECT COUNT(*) + 1 FROM profiles)::text, 6, '0')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- 4. Auto-update updated_at (Trigger)
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. Friendships Table
-- ==========================================
CREATE TABLE friendships (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     friendship_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user_id   ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status    ON friendships(status);

CREATE TRIGGER set_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. Messages Table
-- ==========================================
CREATE TABLE messages (
  id              BIGSERIAL PRIMARY KEY,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  language        TEXT DEFAULT 'en',
  intent          TEXT,
  confidence      DOUBLE PRECISION,
  translation     TEXT,
  technical_terms TEXT[] DEFAULT '{}',
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_sender_id   ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at  ON messages(created_at);
CREATE INDEX idx_messages_is_read     ON messages(is_read);

CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. User Feedback Table
-- ==========================================
CREATE TABLE user_feedback (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id       BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  feedback_type    TEXT NOT NULL,        -- "intent", "translation", "ner"
  original_text    TEXT NOT NULL,
  ai_prediction    TEXT NOT NULL,
  user_correction  TEXT,
  is_correct       BOOLEAN DEFAULT true,
  confidence_score DOUBLE PRECISION,
  source_language  TEXT,
  target_language  TEXT,
  used_for_training BOOLEAN DEFAULT false,
  retrained_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_feedback_user_id          ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_message_id       ON user_feedback(message_id);
CREATE INDEX idx_user_feedback_feedback_type    ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_is_correct       ON user_feedback(is_correct);
CREATE INDEX idx_user_feedback_used_for_training ON user_feedback(used_for_training);
CREATE INDEX idx_user_feedback_source_language  ON user_feedback(source_language);
CREATE INDEX idx_user_feedback_target_language  ON user_feedback(target_language);

-- ==========================================
-- 8. Thai Words Table
-- ==========================================
CREATE TABLE thai_words (
  id                   BIGSERIAL PRIMARY KEY,
  thai_word            TEXT UNIQUE NOT NULL,
  pronunciation        TEXT NOT NULL,
  english_translation  TEXT NOT NULL,
  japanese_translation TEXT NOT NULL,
  cultural_context     TEXT,
  category             TEXT NOT NULL,   -- "greeting", "food", "work", "tech", etc.
  difficulty           TEXT NOT NULL,   -- "beginner", "intermediate", "advanced"
  audio_url            TEXT,
  example_sentence     TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_thai_words_category   ON thai_words(category);
CREATE INDEX idx_thai_words_difficulty ON thai_words(difficulty);
CREATE INDEX idx_thai_words_cat_diff   ON thai_words(category, difficulty);

CREATE TRIGGER set_thai_words_updated_at
  BEFORE UPDATE ON thai_words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. User Word Progress Table
-- ==========================================
CREATE TABLE user_word_progress (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id       BIGINT NOT NULL REFERENCES thai_words(id) ON DELETE CASCADE,
  learned       BOOLEAN DEFAULT false,
  saved         BOOLEAN DEFAULT false,
  review_count  INT DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word_id)
);

CREATE INDEX idx_user_word_progress_user_id ON user_word_progress(user_id);
CREATE INDEX idx_user_word_progress_word_id ON user_word_progress(word_id);
CREATE INDEX idx_user_word_progress_learned ON user_word_progress(learned);
CREATE INDEX idx_user_word_progress_saved   ON user_word_progress(saved);

CREATE TRIGGER set_user_word_progress_updated_at
  BEFORE UPDATE ON user_word_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 10. Daily Word Table
-- ==========================================
CREATE TABLE daily_words (
  id         BIGSERIAL PRIMARY KEY,
  word_id    BIGINT NOT NULL REFERENCES thai_words(id) ON DELETE CASCADE,
  date       DATE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_daily_words_date ON daily_words(date);

-- ==========================================
-- 11. Enable Realtime for key tables
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- ==========================================
-- 12. Row Level Security (RLS) Policies
-- ==========================================

-- --- Profiles ---
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --- Friendships ---
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- --- Messages ---
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete own sent messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- --- User Feedback ---
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- --- Thai Words (public read) ---
ALTER TABLE thai_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read thai words"
  ON thai_words FOR SELECT
  TO authenticated
  USING (true);

-- --- User Word Progress ---
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own word progress"
  ON user_word_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own word progress"
  ON user_word_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own word progress"
  ON user_word_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- --- Daily Words (public read) ---
ALTER TABLE daily_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read daily words"
  ON daily_words FOR SELECT
  TO authenticated
  USING (true);
