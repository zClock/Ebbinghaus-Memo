import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// INLINE: 数据库适配层（原 serverDb.ts）
// 为避免 Vercel @vercel/node runtime 找不到模块，必须内联到同一文件
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let supabase: any = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log("[Database] Supabase client initialized successfully.");
  } catch (err) {
    console.error("[Database] Failed to initialize Supabase client:", err);
  }
} else {
  console.log("[Database] Supabase environment variables not configured. Falling back to local db.json.");
}

const isVercelEnv = !!process.env.VERCEL;
// 支持通过环境变量覆盖本地 db.json 路径（用于 E2E 测试隔离）
const DB_PATH = isVercelEnv
  ? path.join("/tmp", "db.json")
  : process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(process.cwd(), "data", "db.json");

interface WordDbSchema {
  words: any[];
  histories: any[];
  systemOffsetMs: number;
  users?: any[];
  sessions?: any[];
}

function initLocalDb(): WordDbSchema {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData: WordDbSchema = {
      words: [],
      histories: [],
      systemOffsetMs: 0,
      users: [],
      sessions: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const data = JSON.parse(raw);
    if (!data.words) data.words = [];
    if (!data.histories) data.histories = [];
    if (typeof data.systemOffsetMs !== "number") data.systemOffsetMs = 0;
    if (!data.users) data.users = [];
    if (!data.sessions) data.sessions = [];
    return data;
  } catch (err) {
    console.error("[Database] Failed to parse local db file:", err);
    return { words: [], histories: [], systemOffsetMs: 0, users: [], sessions: [] };
  }
}

function readLocalDb(): WordDbSchema {
  return initLocalDb();
}

function writeLocalDb(data: WordDbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function toDbUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    name: user.name,
    daily_goal: user.dailyGoal,
    level: user.level,
    created_at: user.createdAt
  };
}

function fromDbUser(dbUser: any) {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    passwordHash: dbUser.password_hash,
    name: dbUser.name,
    dailyGoal: dbUser.daily_goal,
    level: dbUser.level,
    createdAt: dbUser.created_at
  };
}

function toDbSession(session: any) {
  if (!session) return null;
  return {
    token: session.token,
    user_id: session.userId,
    expires_at: session.expiresAt
  };
}

function fromDbSession(dbSession: any) {
  if (!dbSession) return null;
  return {
    token: dbSession.token,
    userId: dbSession.user_id,
    expiresAt: Number(dbSession.expires_at)
  };
}

function toDbWord(word: any) {
  if (!word) return null;
  return {
    id: word.id,
    user_id: word.userId,
    spelling: word.spelling,
    phonetic: word.phonetic,
    definition: word.definition,
    example: word.example,
    example_translation: word.exampleTranslation,
    mnemonic: word.mnemonic,
    audio_url: word.audioUrl,
    created_at: word.createdAt,
    review_stage: word.reviewStage,
    consecutive_correct: word.consecutiveCorrect,
    last_reset_at: word.lastResetAt,
    next_review_at: word.nextReviewAt,
    language: word.language || "English"
  };
}

function fromDbWord(dbWord: any) {
  if (!dbWord) return null;
  return {
    id: dbWord.id,
    userId: dbWord.user_id,
    spelling: dbWord.spelling,
    phonetic: dbWord.phonetic || "/-/",
    definition: dbWord.definition || "",
    example: dbWord.example || "",
    exampleTranslation: dbWord.example_translation || "",
    mnemonic: dbWord.mnemonic || "",
    audioUrl: dbWord.audio_url || null,
    createdAt: dbWord.created_at,
    reviewStage: dbWord.review_stage ?? 0,
    consecutiveCorrect: dbWord.consecutive_correct ?? 0,
    lastResetAt: dbWord.last_reset_at,
    nextReviewAt: dbWord.next_review_at,
    language: dbWord.language || "English"
  };
}

function toDbHistory(h: any) {
  if (!h) return null;
  return {
    id: h.id,
    user_id: h.userId,
    word_id: h.wordId,
    word_spelling: h.wordSpelling,
    stage: h.stage,
    reviewed_at: h.reviewedAt,
    is_correct: h.isCorrect
  };
}

function fromDbHistory(dbH: any) {
  if (!dbH) return null;
  return {
    id: dbH.id,
    userId: dbH.user_id,
    wordId: dbH.word_id,
    wordSpelling: dbH.word_spelling,
    stage: dbH.stage,
    reviewedAt: dbH.reviewed_at,
    isCorrect: dbH.is_correct
  };
}

async function getSystemOffsetMs(): Promise<number> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "system_offset_ms")
        .single();
      if (error) {
        if (error.code === "PGRST116") {
          await supabase.from("system_config").insert({ key: "system_offset_ms", value: "0" });
          return 0;
        }
        throw error;
      }
      return data ? Number(data.value) : 0;
    } catch (err) {
      console.error("[Database] Error reading systemOffsetMs from Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  return db.systemOffsetMs || 0;
}

async function setSystemOffsetMs(ms: number): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("system_config")
        .upsert({ key: "system_offset_ms", value: String(ms) });
      if (error) throw error;
      return;
    } catch (err) {
      console.error("[Database] Error setting systemOffsetMs in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  db.systemOffsetMs = ms;
  writeLocalDb(db);
}

async function findUserByEmail(email: string): Promise<any | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();
      if (error) throw error;
      return data ? fromDbUser(data) : null;
    } catch (err) {
      console.error("[Database] Error finding user by email in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  const user = (db.users || []).find(u => u.email === cleanEmail);
  return user ? { ...user } : null;
}

async function findUserById(id: string): Promise<any | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? fromDbUser(data) : null;
    } catch (err) {
      console.error("[Database] Error finding user by id in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  const user = (db.users || []).find(u => u.id === id);
  return user ? { ...user } : null;
}

async function createUser(user: any, defaultWords: any[]): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error: userErr } = await supabase
        .from("users")
        .insert(toDbUser(user));
      if (userErr) throw userErr;

      if (defaultWords && defaultWords.length > 0) {
        const dbWords = defaultWords.map(toDbWord);
        const { error: wordsErr } = await supabase
          .from("words")
          .insert(dbWords);
        if (wordsErr) {
          if (wordsErr.message && wordsErr.message.includes("language")) {
            console.warn("[Database] 'language' column missing during createUser, retrying without 'language'...");
            const dbWordsNoLang = dbWords.map((dw: any) => {
              const copy = { ...dw };
              delete copy.language;
              return copy;
            });
            const { error: retryErr } = await supabase
              .from("words")
              .insert(dbWordsNoLang);
            if (retryErr) throw retryErr;
          } else {
            throw wordsErr;
          }
        }
      }
      return;
    } catch (err) {
      console.error("[Database] Error creating user in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  db.users = db.users || [];
  db.users.push(user);
  db.words = db.words || [];
  db.words.push(...defaultWords);
  writeLocalDb(db);
}

async function updateUser(id: string, updates: any): Promise<any> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = updates.dailyGoal;
      if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;

      const { data, error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return fromDbUser(data);
    } catch (err) {
      console.error("[Database] Error updating user in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  const index = (db.users || []).findIndex(u => u.id === id);
  if (index === -1) throw new Error("User not found");

  const user = db.users![index];
  if (updates.name !== undefined) user.name = updates.name.trim();
  if (updates.level !== undefined) user.level = updates.level;
  if (updates.dailyGoal !== undefined) user.dailyGoal = updates.dailyGoal;
  if (updates.passwordHash !== undefined) user.passwordHash = updates.passwordHash;

  db.users![index] = user;
  writeLocalDb(db);
  return { ...user };
}

async function findSessionByToken(token: string): Promise<any | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      return data ? fromDbSession(data) : null;
    } catch (err) {
      console.error("[Database] Error finding session in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  const session = (db.sessions || []).find(s => s.token === token);
  return session ? { ...session } : null;
}

async function createSession(session: any): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("sessions")
        .insert(toDbSession(session));
      if (error) throw error;
      return;
    } catch (err) {
      console.error("[Database] Error creating session in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  db.sessions = db.sessions || [];
  db.sessions.push(session);
  writeLocalDb(db);
}

async function deleteSession(token: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("token", token);
      if (error) throw error;
      return;
    } catch (err) {
      console.error("[Database] Error deleting session in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  if (db.sessions) {
    db.sessions = db.sessions.filter(s => s.token !== token);
    writeLocalDb(db);
  }
}

async function getUserWords(userId: string): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return (data || []).map(fromDbWord);
    } catch (err) {
      console.error("[Database] Error reading words from Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  return db.words.filter(w => w.userId === userId).map(w => ({ ...w }));
}

async function getUserDueWords(userId: string, vTime: Date): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review_at", vTime.toISOString())
        .lt("review_stage", 6);
      if (error) throw error;
      return (data || []).map(fromDbWord);
    } catch (err) {
      console.error("[Database] Error reading due words from Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  return db.words.filter(w => {
    return w.userId === userId &&
           new Date(w.nextReviewAt).getTime() <= vTime.getTime() &&
           w.reviewStage < 6;
  }).map(w => ({ ...w }));
}

async function getUserHistories(userId: string): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("histories")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return (data || []).map(fromDbHistory);
    } catch (err) {
      console.error("[Database] Error reading histories from Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  return (db.histories || []).filter(h => h.userId === userId).map(h => ({ ...h }));
}

async function findWordBySpelling(userId: string, spelling: string, language?: string): Promise<any | null> {
  const cleanSpelling = spelling.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("words")
        .select("*")
        .eq("user_id", userId)
        .eq("spelling", cleanSpelling);
      if (language) {
        query = query.eq("language", language);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? fromDbWord(data) : null;
    } catch (err) {
      console.error("[Database] Error finding word by spelling in Supabase:", err);
      throw err;
    }
  }
  const db = readLocalDb();
  const word = db.words.find(w => w.spelling === cleanSpelling && w.userId === userId && (!language || (w.language || "English") === language));
  return word ? { ...word } : null;
}

async function createWord(word: any): Promise<any> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbWord = toDbWord(word);
      const { data, error } = await supabase
        .from("words")
        .insert(dbWord)
        .select()
        .single();
      if (error) {
        if (error.message && error.message.includes("language")) {
          console.warn("[Database] 'language' column missing during createWord, retrying without 'language'...");
          const dbWordNoLang = { ...dbWord };
          delete dbWordNoLang.language;
          const { data: retryData, error: retryErr } = await supabase
            .from("words")
            .insert(dbWordNoLang)
            .select()
            .single();
          if (retryErr) throw retryErr;
          return fromDbWord(retryData);
        }
        throw error;
      }
      return fromDbWord(data);
    } catch (err) {
      console.error("[Database] Error creating word in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  db.words.push(word);
  writeLocalDb(db);
  return { ...word };
}

async function createWordsBatch(words: any[]): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbWords = words.map(toDbWord);
      const { error } = await supabase
        .from("words")
        .insert(dbWords);
      if (error) {
        if (error.message && error.message.includes("language")) {
          console.warn("[Database] 'language' column missing during createWordsBatch, retrying without 'language'...");
          const dbWordsNoLang = dbWords.map((dw: any) => {
            const copy = { ...dw };
            delete copy.language;
            return copy;
          });
          const { error: retryErr } = await supabase
            .from("words")
            .insert(dbWordsNoLang);
          if (retryErr) throw retryErr;
          return;
        }
        throw error;
      }
      return;
    } catch (err) {
      console.error("[Database] Error batch creating words in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  db.words.push(...words);
  writeLocalDb(db);
}

async function deleteWord(userId: string, wordId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("words")
        .delete()
        .eq("id", wordId)
        .eq("user_id", userId);
      if (error) throw error;
      return;
    } catch (err) {
      console.error("[Database] Error deleting word in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  db.words = db.words.filter(w => !(w.id === wordId && w.userId === userId));
  db.histories = db.histories.filter(h => !(h.wordId === wordId && h.userId === userId));
  writeLocalDb(db);
}

async function updateWord(userId: string, wordId: string, updates: any): Promise<any> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: any = {};
      if (updates.definition !== undefined) dbUpdates.definition = updates.definition;
      if (updates.phonetic !== undefined) dbUpdates.phonetic = updates.phonetic;
      if (updates.example !== undefined) dbUpdates.example = updates.example;
      if (updates.exampleTranslation !== undefined) dbUpdates.example_translation = updates.exampleTranslation;
      if (updates.mnemonic !== undefined) dbUpdates.mnemonic = updates.mnemonic;

      const { data, error } = await supabase
        .from("words")
        .update(dbUpdates)
        .eq("id", wordId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return fromDbWord(data);
    } catch (err) {
      console.error("[Database] Error updating word in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  const idx = db.words.findIndex(w => w.id === wordId && w.userId === userId);
  if (idx === -1) throw new Error("Word not found");

  const word = db.words[idx];
  if (updates.definition !== undefined) word.definition = updates.definition;
  if (updates.phonetic !== undefined) word.phonetic = updates.phonetic;
  if (updates.example !== undefined) word.example = updates.example;
  if (updates.exampleTranslation !== undefined) word.exampleTranslation = updates.exampleTranslation;
  if (updates.mnemonic !== undefined) word.mnemonic = updates.mnemonic;

  db.words[idx] = word;
  writeLocalDb(db);
  return { ...word };
}

async function submitReview(userId: string, reviewResults: any[], vTime: Date): Promise<{ updatedWords: any[], newHistories: any[] }> {
  const SRS_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30];
  const updatedWords: any[] = [];
  const newHistories: any[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const wordIds = reviewResults.map(r => r.wordId);
      const { data: dbWords, error: fetchErr } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", userId)
        .in("id", wordIds);

      if (fetchErr) throw fetchErr;

      const wordsMap = new Map<string, any>((dbWords || []).map(w => [w.id, fromDbWord(w)]));

      for (const result of reviewResults) {
        const { wordId, firstTryCorrect } = result;
        const word = wordsMap.get(wordId);
        if (!word) continue;

        const prevStage = word.reviewStage;

        if (firstTryCorrect) {
          word.consecutiveCorrect += 1;
          if (word.consecutiveCorrect >= 3) {
            word.reviewStage = 5;
            word.lastResetAt = vTime.toISOString();
            word.nextReviewAt = new Date(vTime.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          } else {
            word.reviewStage = Math.min(5, word.reviewStage + 1);
            const intervalDays = SRS_INTERVALS_DAYS[word.reviewStage];
            word.lastResetAt = vTime.toISOString();
            word.nextReviewAt = new Date(vTime.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
          }
        } else {
          word.reviewStage = 0;
          word.consecutiveCorrect = 0;
          word.lastResetAt = vTime.toISOString();
          word.nextReviewAt = new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString();
        }

        updatedWords.push(word);

        const history = {
          id: "hist_" + Math.random().toString(36).substring(2, 11),
          userId,
          wordId,
          wordSpelling: word.spelling,
          stage: prevStage,
          reviewedAt: vTime.toISOString(),
          isCorrect: firstTryCorrect
        };
        newHistories.push(history);
      }

      if (updatedWords.length > 0) {
        const { error: wordsUpsertErr } = await supabase
          .from("words")
          .upsert(updatedWords.map(toDbWord));
        if (wordsUpsertErr) throw wordsUpsertErr;
      }

      if (newHistories.length > 0) {
        const { error: histInsertErr } = await supabase
          .from("histories")
          .insert(newHistories.map(toDbHistory));
        if (histInsertErr) throw histInsertErr;
      }

      return { updatedWords, newHistories };
    } catch (err) {
      console.error("[Database] Error submitting reviews in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  for (const result of reviewResults) {
    const { wordId, firstTryCorrect } = result;
    const wordIndex = db.words.findIndex(w => w.id === wordId && w.userId === userId);
    if (wordIndex === -1) continue;

    const word = db.words[wordIndex];
    const prevStage = word.reviewStage;

    if (firstTryCorrect) {
      word.consecutiveCorrect += 1;
      if (word.consecutiveCorrect >= 3) {
        word.reviewStage = 5;
        word.lastResetAt = vTime.toISOString();
        word.nextReviewAt = new Date(vTime.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        word.reviewStage = Math.min(5, word.reviewStage + 1);
        const intervalDays = SRS_INTERVALS_DAYS[word.reviewStage];
        word.lastResetAt = vTime.toISOString();
        word.nextReviewAt = new Date(vTime.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      word.reviewStage = 0;
      word.consecutiveCorrect = 0;
      word.lastResetAt = vTime.toISOString();
      word.nextReviewAt = new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    db.words[wordIndex] = word;
    updatedWords.push({ ...word });

    const history = {
      id: "hist_" + Math.random().toString(36).substring(2, 11),
      userId,
      wordId,
      wordSpelling: word.spelling,
      stage: prevStage,
      reviewedAt: vTime.toISOString(),
      isCorrect: firstTryCorrect
    };
    db.histories.push(history);
    newHistories.push(history);
  }

  writeLocalDb(db);
  return { updatedWords, newHistories };
}

async function resetUserWords(userId: string, userDefaultWords: any[], vTime: Date, language?: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 按语言筛选删除（若未传 language 则删除全部）
      let wordIdsToDelete: string[] = [];
      if (language) {
        const { data: langWords, error: queryErr } = await supabase
          .from("words")
          .select("id")
          .eq("user_id", userId)
          .eq("language", language);
        if (queryErr) throw queryErr;
        wordIdsToDelete = (langWords || []).map((w: any) => w.id);
      }

      if (wordIdsToDelete.length > 0) {
        await supabase.from("histories").delete().in("word_id", wordIdsToDelete);
        await supabase.from("words").delete().in("id", wordIdsToDelete);
      } else if (!language) {
        // 无 language 参数，全量删除
        await supabase.from("histories").delete().eq("user_id", userId);
        await supabase.from("words").delete().eq("user_id", userId);
      }

      if (userDefaultWords.length > 0) {
        const { error: insWordsErr } = await supabase
          .from("words")
          .insert(userDefaultWords.map(toDbWord));
        if (insWordsErr) throw insWordsErr;
      }
      return;
    } catch (err) {
      console.error("[Database] Error resetting words in Supabase:", err);
      throw err;
    }
  }

  const db = readLocalDb();
  if (language) {
    // 本地 JSON：按语言筛选删除
    const langWordIds = new Set(db.words.filter(w => w.userId === userId && w.language === language).map(w => w.id));
    db.words = db.words.filter(w => !langWordIds.has(w.id));
    db.histories = db.histories.filter(h => !langWordIds.has(h.wordId));
  } else {
    db.words = db.words.filter(w => w.userId !== userId);
    db.histories = db.histories.filter(h => h.userId !== userId);
  }
  db.words.push(...userDefaultWords);
  writeLocalDb(db);
}

async function getUserLanguageSettings(userId: string, language: string): Promise<{ dailyGoal: number, level: string }> {
  const cleanLang = language || "English";
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("user_language_settings")
        .select("*")
        .eq("user_id", userId)
        .eq("language", cleanLang)
        .maybeSingle();
      if (error) {
        console.error("[Database] Error getting user language settings, falling back:", error);
      } else if (data) {
        return {
          dailyGoal: Number(data.daily_goal),
          level: data.level
        };
      }
    } catch (err) {
      console.error("[Database] Exception fetching user language settings, falling back:", err);
    }
  }

  const db = readLocalDb();
  const dbLocal = (db as any).languageSettings || [];
  const found = dbLocal.find((s: any) => s.userId === userId && s.language === cleanLang);
  if (found) {
    return {
      dailyGoal: Number(found.dailyGoal),
      level: found.level
    };
  }

  const user = await findUserById(userId);
  if (user) {
    return {
      dailyGoal: user.dailyGoal,
      level: user.level
    };
  }

  return {
    dailyGoal: 15,
    level: cleanLang === "Japanese" ? "N5" : "CET4"
  };
}

async function upsertUserLanguageSettings(userId: string, language: string, dailyGoal: number, level: string): Promise<void> {
  const cleanLang = language || "English";
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("user_language_settings")
        .upsert({
          user_id: userId,
          language: cleanLang,
          daily_goal: dailyGoal,
          level: level
        }, { onConflict: "user_id,language" });
      if (error) {
        console.warn("[Database] Error upserting language settings, table may not exist:", error);
      } else {
        return;
      }
    } catch (err) {
      console.warn("[Database] Exception upserting language settings, table may not exist:", err);
    }
  }

  const db = readLocalDb();
  if (!(db as any).languageSettings) {
    (db as any).languageSettings = [];
  }
  const index = (db as any).languageSettings.findIndex((s: any) => s.userId === userId && s.language === cleanLang);
  if (index !== -1) {
    (db as any).languageSettings[index] = { userId, language: cleanLang, dailyGoal, level };
  } else {
    (db as any).languageSettings.push({ userId, language: cleanLang, dailyGoal, level });
  }
  writeLocalDb(db);
}

// Vercel 上环境变量已注入，本地开发从 .env.local 加载
if (!process.env.VERCEL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
}

const app = express();

// Set up Google GenAI if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found, running in dictionary-only/fallback mode.");
}

// GLM fallback configuration (Anthropic-compatible endpoint)
const glmConfig = {
  apiKey: process.env.GLM_API_KEY || "",
  baseUrl: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/anthropic",
  model: process.env.GLM_MODEL || "glm-4.6"
};
const isGlmConfigured = Boolean(glmConfig.apiKey && glmConfig.apiKey !== "YOUR_GLM_API_KEY_HERE");
if (isGlmConfigured) {
  console.log(`GLM fallback configured: ${glmConfig.baseUrl} (model: ${glmConfig.model})`);
} else {
  console.log("GLM fallback not configured (fill GLM_API_KEY in .env.local to enable).");
}

// ==========================================
// 本地英汉词典（用于「辨义选择」复习模式的干扰词生成）
// 启动时一次性加载 data/dictionary.json 到内存
// ==========================================
interface DictEntry { w: string; d: string; }
let dictionary: DictEntry[] = [];
let dictByLength: Map<number, DictEntry[]> = new Map(); // 按长度索引，加速相似词查询
let dictionaryLoaded = false;

function loadDictionary() {
  if (dictionaryLoaded) return;
  const dictPath = path.join(process.cwd(), "data", "dictionary.json");
  try {
    if (!fs.existsSync(dictPath)) {
      console.warn(`[Dictionary] File not found: ${dictPath}. Definition Choice mode will be disabled.`);
      return;
    }
    const raw = fs.readFileSync(dictPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid dictionary format");
    dictionary = parsed.filter((e: any) => e && typeof e.w === "string" && typeof e.d === "string");
    // 按长度索引（加速相似词查询时只扫相近长度的候选）
    dictByLength = new Map();
    for (const entry of dictionary) {
      const len = entry.w.length;
      if (!dictByLength.has(len)) dictByLength.set(len, []);
      dictByLength.get(len)!.push(entry);
    }
    dictionaryLoaded = true;
    console.log(`[Dictionary] Loaded ${dictionary.length} entries from ${dictPath}`);
  } catch (err) {
    console.error(`[Dictionary] Failed to load:`, err);
  }
}
loadDictionary();

// 计算两个单词的 Levenshtein 编辑距离
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,        // 删除
        dp[j - 1] + 1,    // 插入
        prev + (a[i - 1] === b[j - 1] ? 0 : 1) // 替换
      );
      prev = tmp;
    }
  }
  return dp[n];
}

// 综合相似度分数：编辑距离 + 长度差 + 前缀/后缀重合
// 分数越低越相似（0 表示完全相同）
function similarityScore(target: string, candidate: string): number {
  const editDist = levenshtein(target, candidate);
  const lenDiff = Math.abs(target.length - candidate.length);
  // 前缀共享（0~min(len)）
  let prefixShared = 0;
  const minLen = Math.min(target.length, candidate.length);
  for (let i = 0; i < minLen; i++) {
    if (target[i] === candidate[i]) prefixShared++;
    else break;
  }
  // 后缀共享
  let suffixShared = 0;
  for (let i = 1; i <= minLen; i++) {
    if (target[target.length - i] === candidate[candidate.length - i]) suffixShared++;
    else break;
  }
  // 综合：编辑距离权重最大；共享前缀/后缀越多越相似（扣分）
  return editDist * 2 + lenDiff - prefixShared - suffixShared * 0.5;
}

// 从字典中找出拼写最相似的 N 个干扰词
// 多层 fallback：严格匹配 → 放宽 → 移除分隔符 → 仍不足则返回少于 N 个（前端处理）
function findSimilarWords(
  spelling: string,
  count: number = 5
): { word: string; definition: string }[] {
  if (!dictionaryLoaded || dictionary.length === 0) return [];
  const target = spelling.trim().toLowerCase();

  // 单次查询：在长度差 maxLenDelta 的候选中打分，取编辑距离 ≤ maxEdit 的 top N
  const query = (
    tgt: string,
    maxLenDelta: number,
    maxEdit: number,
    limit: number
  ): { word: string; definition: string }[] => {
    const tgtLen = tgt.length;
    const candidates: DictEntry[] = [];
    for (let d = -maxLenDelta; d <= maxLenDelta; d++) {
      const candLen = tgtLen + d;
      if (candLen < 1) continue;
      const entries = dictByLength.get(candLen);
      if (entries) candidates.push(...entries);
    }
    const scored = candidates
      .filter(e => e.w !== tgt)
      .map(e => ({ entry: e, score: similarityScore(tgt, e.w), edit: levenshtein(tgt, e.w) }))
      .filter(s => s.edit <= maxEdit)
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
    return scored.map(s => ({ word: s.entry.w, definition: s.entry.d }));
  };

  // 从候选池随机抽 count 个
  const pickRandom = (
    pool: { word: string; definition: string }[],
    n: number
  ): { word: string; definition: string }[] => {
    if (pool.length <= n) return pool;
    const copy = [...pool];
    const picked: { word: string; definition: string }[] = [];
    while (picked.length < n && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
  };

  // 第一轮：严格匹配（长度差 ≤ 3，编辑距离 ≤ 5）
  let pool = query(target, 3, 5, 30);
  // 第二轮：候选不足，放宽（长度差 ≤ 5，编辑距离 ≤ 8）
  if (pool.length < count) {
    pool = query(target, 5, 8, 30);
  }
  // 第三轮：复合词场景（behind-the-meter 这种），按词组里最长的单词查
  // 例如 "behind-the-meter" → 取 "behind" 作为目标
  if (pool.length < count && /[-\s]/.test(target)) {
    const parts = target.split(/[-\s]/).filter(p => p.length >= 3);
    if (parts.length > 0) {
      // 取最长的部分
      const longest = parts.reduce((a, b) => a.length >= b.length ? a : b);
      pool = query(longest, 3, 5, 30);
    }
  }

  return pickRandom(pool, count);
}

// User and Session interfaces
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  dailyGoal: number;
  level: string;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}


const defaultWords = [
  {
    id: "seed-1",
    spelling: "curiosity",
    phonetic: "/ˌkjʊəriˈɒsəti/",
    definition: "n. 好奇心，求知欲；奇珍异宝",
    example: "Her intense curiosity about the cosmos drove her to pursue a career in astrophysics.",
    exampleTranslation: "她对宇宙的强烈好奇心促使她追求天体物理学的职业生涯。",
    mnemonic: "curi（关心/探索）+ osity（名词后缀，表性质）→ 渴望探索、关心的特性 → 好奇心。",
    audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/curiosity-us.mp3",
    createdAt: new Date().toISOString(),
    reviewStage: 0,
    consecutiveCorrect: 0,
    lastResetAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +1 day
  },
  {
    id: "seed-2",
    spelling: "resilience",
    phonetic: "/rɪˈzɪliəns/",
    definition: "n. 韧性，复原力；恢复力；弹性",
    example: "The community showed amazing resilience in rebuilding after the severe storm.",
    exampleTranslation: "在暴风雨过后，社区在重建过程中展现了惊人的恢复力。",
    mnemonic: "re（回）+ sil（跳）+ ience（名词后缀）→ 能够跳回原状 → 弹力、韧性、复原力。",
    audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/resilience-us.mp3",
    createdAt: new Date().toISOString(),
    reviewStage: 1,
    consecutiveCorrect: 1,
    lastResetAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // +2 days
  },
  {
    id: "seed-3",
    spelling: "ephemeral",
    phonetic: "/ɪˈfemərəl/",
    definition: "adj. 短暂的，朝生暮死的；瞬息即逝的",
    example: "Fame in the internet age is often ephemeral, lasting only a few days.",
    exampleTranslation: "互联网时代的虚名往往非常短暂，往往只能维持几天。",
    mnemonic: "ephemer（一日）+ al（形容词后缀）→ 只有一天的寿命 → 短暂的，朝生暮死的。",
    audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/ephemeral-us.mp3",
    createdAt: new Date().toISOString(),
    reviewStage: 2,
    consecutiveCorrect: 2,
    lastResetAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() // +4 days
  },
  {
    id: "seed-4",
    spelling: "persistent",
    phonetic: "/pəˈsɪstənt/",
    definition: "adj. 执着的，坚持不懈的；持续不断的",
    example: "Through persistent efforts, the research team finally solved the complex coding bug.",
    exampleTranslation: "通过不懈的努力，研究团队终于解决了这个复杂的代码缺陷。",
    mnemonic: "per（始终）+ sist（站立/坚持）+ ent（形容词后缀）→ 始终站立着不放弃 → 坚持不懈的。",
    audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/persistent-us.mp3",
    createdAt: new Date().toISOString(),
    reviewStage: 5,
    consecutiveCorrect: 3,
    lastResetAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days (mastered)
  }
];

// Middlewares
app.use(express.json());

// Helper to get virtual simulated time (Real time + Time Travel Offset)
async function getVirtualTime(): Promise<Date> {
  const offset = await getSystemOffsetMs();
  return new Date(Date.now() + offset);
}

// AI generation fallback for dictionary details
async function generateAiWordDetails(spelling: string, targetLanguage: string = "English"): Promise<{
  phonetic: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  mnemonic: string;
}> {
  const prompt = `You are a high-quality smart ${targetLanguage} dictionary helper for Chinese learners.
Generate comprehensive dictionary information for the word/phrase/character in ${targetLanguage}: "${spelling}".
Produce the results strictly in the required JSON structure.
Be accurate with pronunciation or phonetics symbols (e.g. IPA, romaji/kana for Japanese, etc.), clear with Chinese translation meanings, create a modern and helpful context example sentence in ${targetLanguage}, translate that sentence into natural Chinese, and provide a fun/etymological mnemonic association (like word roots, kanji/radical breakdown, similar sounding words, or funny stories) to help SRS memory.

Return ONLY a JSON object with exactly these keys:
{"phonetic": "...", "definition": "...", "example": "...", "exampleTranslation": "...", "mnemonic": "..."}`;

  // ----- Try Gemini first (primary) -----
  if (ai) {
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    for (const model of modelsToTry) {
      try {
        console.log(`[AI Dict] Attempting details generation for "${spelling}" using Gemini model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                phonetic: { type: Type.STRING, description: `IPA phonetic for ${targetLanguage}, e.g. /ɪˈfemərəl/` },
                definition: { type: Type.STRING, description: "Chinese definition/translations, e.g. adj. 短暂的，朝生暮死的" },
                example: { type: Type.STRING, description: `Elegant, clean ${targetLanguage} example sentence.` },
                exampleTranslation: { type: Type.STRING, description: "Natural Chinese translation of the example sentence." },
                mnemonic: { type: Type.STRING, description: "Mnemonic association or word breakdown in Chinese, helping memorization." }
              },
              required: ["phonetic", "definition", "example", "exampleTranslation", "mnemonic"]
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        console.log(`[AI Dict] Successfully generated details with Gemini model: ${model}`);
        return {
          phonetic: parsed.phonetic || "/-/",
          definition: parsed.definition || "未知释义",
          example: parsed.example || "No example sentence available.",
          exampleTranslation: parsed.exampleTranslation || "暂无例句翻译。",
          mnemonic: parsed.mnemonic || "暂无助记联想。"
        };
      } catch (err) {
        console.error(`[AI Dict] Gemini generation failed for model ${model}:`, err);
      }
    }
    console.log(`[AI Dict] All Gemini models failed for "${spelling}", falling back to GLM if configured.`);
  } else {
    console.log(`[AI Dict] Gemini not configured, trying GLM directly for "${spelling}".`);
  }

  // ----- Fallback to GLM (Anthropic-compatible endpoint) -----
  if (isGlmConfigured) {
    try {
      console.log(`[AI Dict] Attempting details generation for "${spelling}" using GLM model: ${glmConfig.model}`);
      const glmRes = await fetch(`${glmConfig.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": glmConfig.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: glmConfig.model,
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!glmRes.ok) {
        const errText = await glmRes.text();
        throw new Error(`GLM HTTP ${glmRes.status}: ${errText}`);
      }

      const glmData: any = await glmRes.json();
      const rawText = Array.isArray(glmData.content)
        ? glmData.content.map((c: any) => c.text || "").join("")
        : "";
      const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(jsonStr || "{}");
      console.log(`[AI Dict] Successfully generated details with GLM model: ${glmConfig.model}`);
      return {
        phonetic: parsed.phonetic || "/-/",
        definition: parsed.definition || "未知释义",
        example: parsed.example || "No example sentence available.",
        exampleTranslation: parsed.exampleTranslation || "暂无例句翻译。",
        mnemonic: parsed.mnemonic || "暂无助记联想。"
      };
    } catch (err) {
      console.error(`[AI Dict] GLM generation failed for "${spelling}":`, err);
      throw new Error(`Both Gemini and GLM failed: ${(err as Error).message}`);
    }
  }

  throw new Error("No AI provider available (neither Gemini nor GLM configured or all failed)");
}

// （原 generateDistractorWords AI 函数已废弃，改为本地词典 + 编辑距离算法 findSimilarWords）

// Password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Authentication middleware
const authMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登录，请先登录。" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const session = await findSessionByToken(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ error: "登录已过期，请重新登录。" });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: "用户不存在，请重新登录。" });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "认证出错，请重试。" });
  }
};

// --- Auth Routes ---

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, level, dailyGoal } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "请填写完整的邮箱、密码和昵称。" });
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: "该邮箱已被注册，请直接登录。" });
    }

    const userId = "usr_" + Math.random().toString(36).substring(2, 11);
    const newUser: User = {
      id: userId,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      name: name.trim(),
      dailyGoal: typeof dailyGoal === "number" ? dailyGoal : 15,
      level: level || "CET4",
      createdAt: new Date().toISOString()
    };

    await createUser(newUser, []);  // 新用户不再自动塞入种子词，等用户自行添加

    const token = crypto.randomBytes(32).toString("hex");
    const session: Session = {
      token,
      userId: newUser.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    await createSession(session);

    const { passwordHash, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "注册失败，请重试。详情: " + (err.message || err) });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "请填写邮箱和密码。" });
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    const user = await findUserByEmail(cleanEmail);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(400).json({ error: "邮箱或密码错误。" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const session: Session = {
      token,
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    await createSession(session);

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "登录失败，请重试。详情: " + (err.message || err) });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    await deleteSession(token);
  }
  res.json({ success: true, message: "已退出登录。" });
});

app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
  const { passwordHash, ...safeUser } = req.user;
  const lang = req.query.language as string || "English";
  try {
    const settings = await getUserLanguageSettings(req.userId, lang);
    safeUser.level = settings.level;
    safeUser.dailyGoal = settings.dailyGoal;
  } catch (err) {
    console.error("Error setting dynamic language settings in /api/auth/me:", err);
  }
  res.json(safeUser);
});

app.put("/api/auth/profile", authMiddleware, async (req: any, res) => {
  const { name, level, dailyGoal, language } = req.body;
  try {
    const updatedUser = await updateUser(req.userId, { name });
    const lang = language || "English";
    await upsertUserLanguageSettings(req.userId, lang, Number(dailyGoal || 15), level || "CET4");
    
    const settings = await getUserLanguageSettings(req.userId, lang);
    const { passwordHash, ...safeUser } = updatedUser;
    safeUser.level = settings.level;
    safeUser.dailyGoal = settings.dailyGoal;
    res.json(safeUser);
  } catch (err: any) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "更新资料失败。" });
  }
});

app.put("/api/auth/change-password", authMiddleware, async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "请填写旧密码和新密码。" });
  }

  try {
    const user = await findUserById(req.userId);
    if (!user || user.passwordHash !== hashPassword(oldPassword)) {
      return res.status(400).json({ error: "旧密码错误。" });
    }

    await updateUser(req.userId, { passwordHash: hashPassword(newPassword) });
    res.json({ success: true, message: "密码修改成功。" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "修改密码失败。" });
  }
});

// --- Stats / Words / Review Routes ---

app.get("/api/system/stats", authMiddleware, async (req: any, res) => {
  try {
    const vTime = await getVirtualTime();
    const userId = req.userId;
    const targetLang = req.query.language as string || "All";
    
    let userWords = await getUserWords(userId);
    if (targetLang !== "All") {
      userWords = userWords.filter(w => (w.language || "English") === targetLang);
    }
    const totalWords = userWords.length;
    const dueTodayCount = userWords.filter(w => {
      return new Date(w.nextReviewAt).getTime() <= vTime.getTime() && w.reviewStage < 6;
    }).length;

    const masteredCount = userWords.filter(w => w.reviewStage >= 5 || w.consecutiveCorrect >= 3).length;

    const stageDistribution = [0, 0, 0, 0, 0, 0, 0];
    userWords.forEach(w => {
      if (w.reviewStage >= 0 && w.reviewStage <= 6) {
        stageDistribution[w.reviewStage]++;
      }
    });

    let userHistories = await getUserHistories(userId);
    if (targetLang !== "All") {
      const wordIds = new Set(userWords.map(w => w.id));
      userHistories = userHistories.filter(h => wordIds.has(h.wordId));
    }
    let currentStreak = 0;
    let maxStreak = 0;

    if (userHistories.length > 0) {
      const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dateStrings = Array.from(new Set(
        userHistories.map(h => {
          const d = new Date(h.reviewedAt);
          return formatDate(d);
        })
      ));

      dateStrings.sort();

      const datesSet = new Set(dateStrings);
      let checkDate = new Date(vTime.getTime());
      let checkStr = formatDate(checkDate);

      if (datesSet.has(checkStr)) {
        currentStreak = 1;
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          const prevStr = formatDate(checkDate);
          if (datesSet.has(prevStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = formatDate(checkDate);
        if (datesSet.has(yesterdayStr)) {
          currentStreak = 1;
          while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const prevStr = formatDate(checkDate);
            if (datesSet.has(prevStr)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      let tempStreak = 0;
      let prevTimeMs: number | null = null;

      for (const dateStr of dateStrings) {
        const parts = dateStr.split("-").map(Number);
        const curTimeMs = new Date(parts[0], parts[1] - 1, parts[2]).getTime();

        if (prevTimeMs === null) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((curTimeMs - prevTimeMs) / (24 * 60 * 60 * 1000));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
        prevTimeMs = curTimeMs;
      }
    }

    const systemOffsetMs = await getSystemOffsetMs();

    res.json({
      totalWords,
      dueTodayCount,
      masteredCount,
      stageDistribution,
      systemOffsetDays: Math.round(systemOffsetMs / (24 * 60 * 60 * 1000)),
      virtualTime: vTime.toISOString(),
      currentStreak,
      maxStreak
    });
  } catch (err: any) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "获取统计数据失败: " + (err.message || err) });
  }
});

app.get("/api/words", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    let userWords = await getUserWords(userId);
    const targetLang = req.query.language as string || "All";
    if (targetLang !== "All") {
      userWords = userWords.filter(w => (w.language || "English") === targetLang);
    }
    res.json(userWords);
  } catch (err: any) {
    console.error("Words API error:", err);
    res.status(500).json({ error: "获取单词列表失败: " + (err.message || err) });
  }
});

app.get("/api/histories", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    let userHistories = await getUserHistories(userId);
    const targetLang = req.query.language as string || "All";
    if (targetLang !== "All") {
      const userWords = await getUserWords(userId);
      const langWordIds = new Set(userWords.filter(w => (w.language || "English") === targetLang).map(w => w.id));
      userHistories = userHistories.filter(h => langWordIds.has(h.wordId));
    }
    res.json(userHistories);
  } catch (err: any) {
    console.error("Histories API error:", err);
    res.status(500).json({ error: "获取复习历史失败: " + (err.message || err) });
  }
});

app.get("/api/words/due", authMiddleware, async (req: any, res) => {
  try {
    const vTime = await getVirtualTime();
    const userId = req.userId;
    let due = await getUserDueWords(userId, vTime);
    const targetLang = req.query.language as string || "All";
    if (targetLang !== "All") {
      due = due.filter(w => (w.language || "English") === targetLang);
    }
    res.json(due);
  } catch (err: any) {
    console.error("Due words API error:", err);
    res.status(500).json({ error: "获取待复习单词失败: " + (err.message || err) });
  }
});

app.post("/api/words/create", authMiddleware, async (req: any, res) => {
  const { spelling, language } = req.body;
  if (!spelling || !spelling.trim()) {
    return res.status(400).json({ error: "Word spelling is required" });
  }

  const cleanSpelling = spelling.trim().toLowerCase();
  const userId = req.userId;
  const targetLanguage = language || "English";

  try {
    const exists = await findWordBySpelling(userId, cleanSpelling, targetLanguage);
    if (exists) {
      return res.status(400).json({ error: `单词 "${cleanSpelling}" 已经存在于您的个人词库中。` });
    }

    let phonetic = "";
    let definition = "";
    let example = "";
    let exampleTranslation = "";
    let mnemonic = "";
    let audioUrl = "";

    if (targetLanguage === "English") {
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanSpelling}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          if (Array.isArray(dictData) && dictData.length > 0) {
            const item = dictData[0];
            phonetic = item.phonetic || (item.phonetics && item.phonetics.find((p: any) => p.text)?.text) || "";
            
            if (item.phonetics) {
              const validAudio = item.phonetics.find((p: any) => p.audio && p.audio.trim() !== "");
              if (validAudio) {
                audioUrl = validAudio.audio;
              }
            }

            if (item.meanings && item.meanings.length > 0) {
              const meaning = item.meanings[0];
              if (meaning.definitions && meaning.definitions.length > 0) {
                definition = meaning.definitions[0].definition || "";
                example = meaning.definitions[0].example || "";
              }
            }
          }
        }
      } catch (err) {
        console.warn("Standard Dictionary API fetch failed, proceeding to fallback", err);
      }
    }

    if (ai) {
      try {
        const aiData = await generateAiWordDetails(cleanSpelling, targetLanguage);
        phonetic = aiData.phonetic || phonetic;
        definition = aiData.definition;
        example = aiData.example;
        exampleTranslation = aiData.exampleTranslation;
        mnemonic = aiData.mnemonic;
      } catch (aiErr) {
        console.error("Gemini enrichment failed:", aiErr);
      }
    }

    if (!definition) {
      definition = "未找到中文释义，可手动编辑。";
    }
    if (!phonetic) {
      phonetic = "/-/";
    }
    if (!example) {
      example = "No illustrative example sentence found.";
      exampleTranslation = "暂无释义翻译。";
    }
    if (!mnemonic) {
      mnemonic = "联想记忆：试着将该词拆分或与已知词汇关联记忆。";
    }

    const vTime = await getVirtualTime();
    const newWord = {
      id: "word_" + Math.random().toString(36).substring(2, 11),
      userId,
      spelling: cleanSpelling,
      phonetic,
      definition,
      example,
      exampleTranslation,
      mnemonic,
      audioUrl: audioUrl || null,
      createdAt: vTime.toISOString(),
      reviewStage: 0,
      consecutiveCorrect: 0,
      lastResetAt: vTime.toISOString(),
      nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      language: targetLanguage
    };

    await createWord(newWord);

    res.status(201).json(newWord);
  } catch (err: any) {
    console.error("Create word error:", err);
    res.status(500).json({ error: "创建单词失败: " + (err.message || err) });
  }
});

app.post("/api/words/import-batch", authMiddleware, async (req: any, res) => {
  const { spellings, language } = req.body;
  if (!spellings || !Array.isArray(spellings)) {
    return res.status(400).json({ error: "Spellings 必须是一个数组" });
  }

  const targetLanguage = language || "English";

  try {
    const vTime = await getVirtualTime();
    const results: any[] = [];
    const errors: any[] = [];
    
    const userWordsList = await getUserWords(req.userId);
    const existingWords = new Set(
      userWordsList
        .filter(w => (w.language || "English") === targetLanguage)
        .map(w => w.spelling.toLowerCase())
    );

    const maxBatchSize = 30;
    const targetSpellings = Array.from(new Set(
      spellings
        .map(s => s.trim())
        .filter(s => s.length > 0)
    )).slice(0, maxBatchSize);

    if (targetSpellings.length === 0) {
      return res.status(400).json({ error: `未检测到有效的${targetLanguage === "English" ? "英文" : targetLanguage}单词，请检查输入。` });
    }

    for (const spelling of targetSpellings) {
      const cleanSpelling = spelling.toLowerCase();
      
      if (existingWords.has(cleanSpelling)) {
        errors.push({ spelling: cleanSpelling, error: "已存在于词库中" });
        continue;
      }

      let phonetic = "";
      let definition = "";
      let example = "";
      let exampleTranslation = "";
      let mnemonic = "";
      let audioUrl = "";

      if (targetLanguage === "English") {
        try {
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanSpelling}`);
          if (dictRes.ok) {
            const dictData = await dictRes.json();
            if (Array.isArray(dictData) && dictData.length > 0) {
              const item = dictData[0];
              phonetic = item.phonetic || (item.phonetics && item.phonetics.find((p: any) => p.text)?.text) || "";
              
              if (item.phonetics) {
                const validAudio = item.phonetics.find((p: any) => p.audio && p.audio.trim() !== "");
                if (validAudio) {
                  audioUrl = validAudio.audio;
                }
              }

              if (item.meanings && item.meanings.length > 0) {
                const meaning = item.meanings[0];
                if (meaning.definitions && meaning.definitions.length > 0) {
                  definition = meaning.definitions[0].definition || "";
                  example = meaning.definitions[0].example || "";
                }
              }
            }
          }
        } catch (err) {
          console.warn(`Standard Dictionary API fetch failed for ${cleanSpelling}`, err);
        }
      }

      if (ai) {
        try {
          const aiData = await generateAiWordDetails(cleanSpelling, targetLanguage);
          phonetic = aiData.phonetic || phonetic;
          definition = aiData.definition;
          example = aiData.example;
          exampleTranslation = aiData.exampleTranslation;
          mnemonic = aiData.mnemonic;
        } catch (aiErr) {
          console.error(`Gemini enrichment failed for ${cleanSpelling}:`, aiErr);
        }
      }

      if (!definition) {
        definition = "未找到中文释义，可手动编辑。";
      }
      if (!phonetic) {
        phonetic = "/-/";
      }
      if (!example) {
        example = "No illustrative example sentence found.";
        exampleTranslation = "暂无释义翻译。";
      }
      if (!mnemonic) {
        mnemonic = "联想记忆：试着将该词拆分或与已知词汇关联记忆。";
      }

      const newWord = {
        id: "word_" + Math.random().toString(36).substring(2, 11),
        userId: req.userId,
        spelling: cleanSpelling,
        phonetic,
        definition,
        example,
        exampleTranslation,
        mnemonic,
        audioUrl: audioUrl || null,
        createdAt: vTime.toISOString(),
        reviewStage: 0,
        consecutiveCorrect: 0,
        lastResetAt: vTime.toISOString(),
        nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        language: targetLanguage
      };

      results.push(newWord);
      existingWords.add(cleanSpelling);
    }

    if (results.length > 0) {
      await createWordsBatch(results);
    }

    res.json({
      successCount: results.length,
      addedWords: results.map(w => w.spelling),
      errors
    });
  } catch (err: any) {
    console.error("Batch import error:", err);
    res.status(500).json({ error: "批量导入单词失败: " + (err.message || err) });
  }
});

app.post("/api/review/submit", authMiddleware, async (req: any, res) => {
  const { results } = req.body;
  if (!results || !Array.isArray(results)) {
    return res.status(400).json({ error: "Invalid review results format" });
  }

  try {
    const vTime = await getVirtualTime();
    const { updatedWords, newHistories } = await submitReview(req.userId, results, vTime);
    res.json({ updatedWords, newHistories });
  } catch (err: any) {
    console.error("Submit review error:", err);
    res.status(500).json({ error: "提交复习结果失败: " + (err.message || err) });
  }
});

app.delete("/api/words/:id", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  try {
    await deleteWord(req.userId, id);
    res.json({ success: true, message: "单词已成功删除" });
  } catch (err: any) {
    console.error("Delete word error:", err);
    res.status(500).json({ error: "删除单词失败: " + (err.message || err) });
  }
});

app.patch("/api/words/:id", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const { definition, phonetic, example, exampleTranslation, mnemonic } = req.body;
  try {
    const updated = await updateWord(req.userId, id, { definition, phonetic, example, exampleTranslation, mnemonic });
    res.json(updated);
  } catch (err: any) {
    console.error("Update word error:", err);
    res.status(500).json({ error: "更新单词失败: " + (err.message || err) });
  }
});

app.post("/api/words/:id/regenerate", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  if (!ai) {
    return res.status(400).json({ error: "Gemini API 密钥未配置，无法进行 AI 重新生成。" });
  }

  try {
    const words = await getUserWords(req.userId);
    const word = words.find(w => w.id === id);
    if (!word) {
      return res.status(404).json({ error: "Word not found or unauthorized" });
    }

    const aiData = await generateAiWordDetails(word.spelling, word.language || "English");
    const updated = await updateWord(req.userId, id, {
      phonetic: aiData.phonetic || word.phonetic,
      definition: aiData.definition,
      example: aiData.example,
      exampleTranslation: aiData.exampleTranslation,
      mnemonic: aiData.mnemonic
    });

    res.json(updated);
  } catch (err: any) {
    console.error("AI Regeneration failed:", err);
    res.status(500).json({ error: "AI 生成失败，请稍后重试。详情: " + (err.message || err) });
  }
});

// 为「辨义选择」复习模式生成干扰词
// 入参：{ wordId: string }。返回：{ correct: {word, definition}, distractors: [{word, definition}, ...] }
// 干扰词来源：本地英汉词典 + 编辑距离算法（无 AI 依赖，稳定且快）
app.post("/api/generate-distractors", authMiddleware, async (req: any, res) => {
  const { wordId } = req.body;
  if (!wordId) {
    return res.status(400).json({ error: "wordId 必填" });
  }
  if (!dictionaryLoaded) {
    return res.status(500).json({ error: "本地词典未加载，无法生成干扰词。" });
  }

  try {
    const words = await getUserWords(req.userId);
    const word = words.find(w => w.id === wordId);
    if (!word) {
      return res.status(404).json({ error: "Word not found or unauthorized" });
    }

    const distractors = findSimilarWords(word.spelling, 5);
    if (distractors.length < 3) {
      // 极端情况：候选词太少（生僻词或特殊复合词）
      return res.status(500).json({
        error: `候选干扰词不足（仅找到 ${distractors.length} 个）。建议换一个更常用的单词。`
      });
    }

    res.json({
      correct: { word: word.spelling, definition: word.definition },
      distractors
    });
  } catch (err: any) {
    console.error("Distractor generation failed:", err);
    res.status(500).json({ error: "干扰词生成失败：" + (err.message || err) });
  }
});

app.post("/api/system/time-travel", authMiddleware, async (req: any, res) => {
  const { days } = req.body;
  if (typeof days !== "number") {
    return res.status(400).json({ error: "Days count must be a number" });
  }

  try {
    const currentOffset = await getSystemOffsetMs();
    const newOffset = currentOffset + days * 24 * 60 * 60 * 1000;
    await setSystemOffsetMs(newOffset);

    const newVirtualTime = await getVirtualTime();
    res.json({
      success: true,
      daysAdvanced: days,
      totalOffsetDays: Math.round(newOffset / (24 * 60 * 60 * 1000)),
      newVirtualTime: newVirtualTime.toISOString()
    });
  } catch (err: any) {
    console.error("Time travel error:", err);
    res.status(500).json({ error: "时间旅行设置失败。" });
  }
});

app.post("/api/system/reset", authMiddleware, async (req: any, res) => {
  const { fullReset, language } = req.body;
  try {
    const vTime = await getVirtualTime();
    if (fullReset) {
      const userId = req.userId;
      // 按语言重置：只清空指定语言的词库，不再塞种子词（符合"注册不加种子词"的新设计）
      await resetUserWords(userId, [], vTime, language);
      const updatedVTime = await getVirtualTime();
      const langLabel = language || "所有";
      return res.json({ success: true, message: `您的${langLabel}词库已清空并重置复习状态！`, virtualTime: updatedVTime.toISOString() });
    } else {
      await setSystemOffsetMs(0);
      const updatedVTime = await getVirtualTime();
      res.json({ success: true, message: "模拟时间已重置为系统实际时间。", virtualTime: updatedVTime.toISOString() });
    }
  } catch (err: any) {
    console.error("System reset error:", err);
    res.status(500).json({ error: "重置失败: " + (err.message || err) });
  }
});

export default app;
