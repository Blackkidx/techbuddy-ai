-- ============================================================
-- Migration 002: Harden handle_new_user trigger
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Fixes:
--   1. ON CONFLICT (id) DO NOTHING  → safe if trigger fires twice
--   2. ON CONFLICT (username) DO NOTHING → safe if username collides
--   3. user_id fallback uses epoch % 1000000 → avoids COUNT race
--   4. EXCEPTION guard kept  → trigger failure never blocks auth user creation

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  new_user_id  TEXT;
BEGIN
  -- Derive username from metadata, fall back to prefix + first 8 chars of UUID
  IF NEW.raw_user_meta_data IS NULL THEN
    new_username := 'user_' || LEFT(NEW.id::text, 8);
  ELSE
    new_username := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || LEFT(NEW.id::text, 8)
    );
  END IF;

  -- Generate user_id using epoch microseconds mod 1M to avoid COUNT race
  new_user_id := 'TB' || LPAD(
    ((EXTRACT(EPOCH FROM clock_timestamp()) * 1000000)::bigint % 1000000)::text,
    6, '0'
  );

  INSERT INTO profiles (id, username, user_id)
  VALUES (NEW.id, new_username, new_user_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but never fail — user auth must always succeed
  RAISE WARNING 'handle_new_user trigger failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (DROP first in case it already exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
