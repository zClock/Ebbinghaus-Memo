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

-- ============================================================
-- 7. Learning Plans (周计划) — v1.9 引入
-- 把原本仅存于 localStorage 的周计划落到数据库,支持多设备同步
-- ============================================================

-- 7.1 learning_plans: 周计划主表
CREATE TABLE IF NOT EXISTS learning_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,                       -- YYYY-MM-DD (周一)
  end_date TEXT NOT NULL,                         -- YYYY-MM-DD (周日)
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user ON learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_status ON learning_plans(user_id, status);

-- 7.2 learning_tasks: 任务条目 (learning_plans 的子表)
CREATE TABLE IF NOT EXISTS learning_tasks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 冗余: 便于 RLS 与跨计划统计
  day_of_week SMALLINT NOT NULL
    CHECK (day_of_week BETWEEN 0 AND 7),          -- 0=Inbox 备忘灵感池, 1-7=周一到周日
  type TEXT NOT NULL,                              -- 任务类型 ID (如 shortTask/language/type-xxx)
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  linked_word_ids TEXT[] DEFAULT '{}',             -- 关联单词 ID 数组 (Postgres 原生数组)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_learning_tasks_plan_day ON learning_tasks(plan_id, day_of_week, sort_order);
CREATE INDEX IF NOT EXISTS idx_learning_tasks_user ON learning_tasks(user_id);

-- 7.3 learning_day_meta: 日级元信息 (休息日标记 / 整日打卡)
CREATE TABLE IF NOT EXISTS learning_day_meta (
  plan_id TEXT NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL
    CHECK (day_of_week BETWEEN 1 AND 7),          -- 不含 0 (Inbox 不打卡)
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (plan_id, day_of_week)
);

-- 7.4 user_task_types: 用户自定义任务类型配置 (对应前端的任务类型管理)
CREATE TABLE IF NOT EXISTS user_task_types (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,                                -- 类型 ID (如 shortTask/reading/type-xxx)
  label TEXT NOT NULL,
  icon TEXT NOT NULL,                              -- Lucide 图标名 (如 CheckSquare)
  color TEXT NOT NULL,                             -- 主题色名 (如 teal)
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);
