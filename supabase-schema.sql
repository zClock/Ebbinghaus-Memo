-- Ebbinghaus Memo Supabase Schema Setup Script
-- Copy and run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  daily_goal INTEGER DEFAULT 15,
  level TEXT DEFAULT 'CET4',
  created_at TEXT NOT NULL
);

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  expires_at NUMERIC NOT NULL
);

-- 3. Create words table
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  spelling TEXT NOT NULL,
  phonetic TEXT,
  definition TEXT,
  example TEXT,
  example_translation TEXT,
  mnemonic TEXT,
  audio_url TEXT,
  created_at TEXT NOT NULL,
  review_stage INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  last_reset_at TEXT NOT NULL,
  next_review_at TEXT NOT NULL,
  language TEXT DEFAULT 'English'
);

-- 4. Create histories table
CREATE TABLE IF NOT EXISTS histories (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT REFERENCES words(id) ON DELETE CASCADE,
  word_spelling TEXT,
  stage INTEGER,
  reviewed_at TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL
);

-- 5. Create user_language_settings table for multi-language settings per user
CREATE TABLE IF NOT EXISTS user_language_settings (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  daily_goal INTEGER DEFAULT 15,
  level TEXT DEFAULT 'CET4',
  PRIMARY KEY (user_id, language)
);

-- 6. Create system_config table for global configurations
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default system offset config
INSERT INTO system_config (key, value) VALUES ('system_offset_ms', '0')
ON CONFLICT (key) DO NOTHING;
