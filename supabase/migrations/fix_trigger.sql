-- SQL Patch: Fix handle_new_user trigger in Supabase
-- Run this in the Supabase SQL Editor to resolve the "Database error saving new user" issue.
-- ⚠️  Superseded by migration 002_fix_trigger_robust.sql — prefer running that file instead.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  new_user_id  TEXT;
BEGIN
  -- Handle case where raw_user_meta_data is null
  IF NEW.raw_user_meta_data IS NULL THEN
    new_username := 'user_' || LEFT(NEW.id::text, 8);
  ELSE
    new_username := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || LEFT(NEW.id::text, 8)
    );
  END IF;

  -- Use epoch microseconds mod 1M to avoid COUNT(*) race condition
  new_user_id := 'TB' || LPAD(
    ((EXTRACT(EPOCH FROM clock_timestamp()) * 1000000)::bigint % 1000000)::text,
    6, '0'
  );

  -- ON CONFLICT DO NOTHING: safe if trigger fires more than once for the same user
  INSERT INTO profiles (id, username, user_id)
  VALUES (NEW.id, new_username, new_user_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but never fail — auth user creation must always succeed
  RAISE WARNING 'handle_new_user trigger failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
