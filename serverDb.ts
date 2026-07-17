import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// SUPABASE CONFIGURATION & LAZY INIT
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

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

// ==========================================
// LOCAL FILE DATABASE (FALLBACK) CONFIG
// ==========================================
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? path.join("/tmp", "db.json")
  : path.join(process.cwd(), "data", "db.json");

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

interface WordDbSchema {
  words: any[];
  histories: any[];
  systemOffsetMs: number;
  users?: User[];
  sessions?: Session[];
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

// ==========================================
// DATA MAPPING HELPERS FOR POSTGRES (SNAKE_CASE)
// ==========================================
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

// ==========================================
// UNIFIED DATABASE ADAPTER ENDPOINTS
// ==========================================

export async function getSystemOffsetMs(): Promise<number> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "system_offset_ms")
        .single();
      if (error) {
        if (error.code === "PGRST116") {
          // Row not found, create it
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

export async function setSystemOffsetMs(ms: number): Promise<void> {
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

export async function findUserByEmail(email: string): Promise<any | null> {
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

export async function findUserById(id: string): Promise<any | null> {
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

export async function createUser(user: any, defaultWords: any[]): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert user
      const { error: userErr } = await supabase
        .from("users")
        .insert(toDbUser(user));
      if (userErr) throw userErr;

      // 2. Insert default words
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

  // Fallback to Local JSON DB
  const db = readLocalDb();
  db.users = db.users || [];
  db.users.push(user);
  db.words = db.words || [];
  db.words.push(...defaultWords);
  writeLocalDb(db);
}

export async function updateUser(id: string, updates: any): Promise<any> {
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

  // Local JSON Fallback
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

export async function findSessionByToken(token: string): Promise<any | null> {
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

export async function createSession(session: any): Promise<void> {
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

export async function deleteSession(token: string): Promise<void> {
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

export async function getUserWords(userId: string): Promise<any[]> {
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

export async function getUserDueWords(userId: string, vTime: Date): Promise<any[]> {
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
  // Local DB Fallback
  const db = readLocalDb();
  return db.words.filter(w => {
    return w.userId === userId && 
           new Date(w.nextReviewAt).getTime() <= vTime.getTime() && 
           w.reviewStage < 6;
  }).map(w => ({ ...w }));
}

export async function getUserHistories(userId: string): Promise<any[]> {
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

export async function findWordBySpelling(userId: string, spelling: string, language?: string): Promise<any | null> {
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

export async function createWord(word: any): Promise<any> {
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

export async function createWordsBatch(words: any[]): Promise<void> {
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

export async function deleteWord(userId: string, wordId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Postgres CASCADE will delete history, but let's delete explicitly if needed or cascade handles it
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

export async function updateWord(userId: string, wordId: string, updates: any): Promise<any> {
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

export async function submitReview(userId: string, reviewResults: any[], vTime: Date): Promise<{ updatedWords: any[], newHistories: any[] }> {
  const SRS_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30];
  const updatedWords: any[] = [];
  const newHistories: any[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch current words in batch to modify
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

      // Upsert words in Supabase
      if (updatedWords.length > 0) {
        const { error: wordsUpsertErr } = await supabase
          .from("words")
          .upsert(updatedWords.map(toDbWord));
        if (wordsUpsertErr) throw wordsUpsertErr;
      }

      // Insert histories in Supabase
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

  // Local JSON Fallback
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

export async function resetUserWords(userId: string, userDefaultWords: any[], vTime: Date): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Delete all words (and histories cascade) for this user
      const { error: delWordsErr } = await supabase
        .from("words")
        .delete()
        .eq("user_id", userId);
      if (delWordsErr) throw delWordsErr;

      // 2. Insert new default words
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

  // Local JSON Fallback
  const db = readLocalDb();
  db.words = db.words.filter(w => w.userId !== userId);
  db.histories = db.histories.filter(h => h.userId !== userId);
  db.words.push(...userDefaultWords);
  writeLocalDb(db);
}

export async function syncUserDataFromCloud(userId: string, words: any[], histories: any[]): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Clear existing user words (and histories cascade)
      const { error: delErr } = await supabase
        .from("words")
        .delete()
        .eq("user_id", userId);
      if (delErr) throw delErr;

      // 2. Insert synced words
      if (words.length > 0) {
        const { error: insWordsErr } = await supabase
          .from("words")
          .insert(words.map(toDbWord));
        if (insWordsErr) throw insWordsErr;
      }

      // 3. Insert synced histories
      if (histories.length > 0) {
        const { error: insHistErr } = await supabase
          .from("histories")
          .insert(histories.map(toDbHistory));
        if (insHistErr) throw insHistErr;
      }
      return;
    } catch (err) {
      console.error("[Database] Error syncing user data to Supabase:", err);
      throw err;
    }
  }

  // Local JSON Fallback
  const db = readLocalDb();
  db.words = db.words.filter(w => w.userId !== userId);
  db.histories = db.histories.filter(h => h.userId !== userId);
  db.words.push(...words);
  db.histories.push(...histories);
  writeLocalDb(db);
}

export async function getUserLanguageSettings(userId: string, language: string): Promise<{ dailyGoal: number, level: string }> {
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

  // Fallback to local JSON DB
  const db = readLocalDb();
  const dbLocal = (db as any).languageSettings || [];
  const found = dbLocal.find((s: any) => s.userId === userId && s.language === cleanLang);
  if (found) {
    return {
      dailyGoal: Number(found.dailyGoal),
      level: found.level
    };
  }

  // If not found in custom table, fallback to user's global settings
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

export async function upsertUserLanguageSettings(userId: string, language: string, dailyGoal: number, level: string): Promise<void> {
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
        // Fallback or retry: if table doesn't exist yet, we don't crash
        console.warn("[Database] Error upserting language settings, table may not exist:", error);
      } else {
        return;
      }
    } catch (err) {
      console.warn("[Database] Exception upserting language settings, table may not exist:", err);
    }
  }

  // Local JSON fallback
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
