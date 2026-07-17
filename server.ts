import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import {
  isSupabaseConfigured,
  getSystemOffsetMs,
  setSystemOffsetMs,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  findSessionByToken,
  createSession,
  deleteSession,
  getUserWords,
  getUserDueWords,
  getUserHistories,
  findWordBySpelling,
  createWord,
  createWordsBatch,
  deleteWord,
  updateWord,
  submitReview,
  resetUserWords,
  syncUserDataFromCloud
} from "./serverDb";

dotenv.config();

const app = express();
const PORT = 3000;

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
async function generateAiWordDetails(spelling: string): Promise<{
  phonetic: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  mnemonic: string;
}> {
  if (!ai) {
    throw new Error("Gemini API not configured");
  }

  const prompt = `You are a high-quality smart English dictionary helper for Chinese learners.
Generate comprehensive dictionary information for the word/phrase: "${spelling}".
Produce the results strictly in the required JSON structure.
Be accurate with IPA phonetics (prefer US/UK standard), clear with Chinese translation meanings, create a modern and helpful context example sentence, translate that sentence into natural Chinese, and provide a fun/etymological mnemonic association (like word roots, similar sounding words, or funny stories) to help SRS memory.`;

  // We try multiple models because some models like gemini-3.5-flash might experience temporary high demand (503)
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[AI Dict] Attempting details generation for "${spelling}" using model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              phonetic: { type: Type.STRING, description: "IPA phonetic, e.g. /ɪˈfemərəl/" },
              definition: { type: Type.STRING, description: "Chinese definition/translations, e.g. adj. 短暂的，朝生暮死的" },
              example: { type: Type.STRING, description: "Elegant, clean English example sentence." },
              exampleTranslation: { type: Type.STRING, description: "Natural Chinese translation of the example sentence." },
              mnemonic: { type: Type.STRING, description: "Mnemonic association or word breakdown in Chinese, helping memorization." }
            },
            required: ["phonetic", "definition", "example", "exampleTranslation", "mnemonic"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      console.log(`[AI Dict] Successfully generated details with model: ${model}`);
      return {
        phonetic: parsed.phonetic || "/-/",
        definition: parsed.definition || "未知释义",
        example: parsed.example || "No example sentence available.",
        exampleTranslation: parsed.exampleTranslation || "暂无例句翻译。",
        mnemonic: parsed.mnemonic || "暂无助记联想。"
      };
    } catch (err) {
      console.error(`[AI Dict] Generation failed for model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini generation attempts failed");
}

// SRS Intervals mapping (0 to 5, in days)
const SRS_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30];

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

// Register
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

    // Copy standard default words and associate with this newUser
    const userDefaultWords = defaultWords.map(w => ({
      ...w,
      id: "word_" + Math.random().toString(36).substring(2, 11),
      userId: newUser.id,
      createdAt: new Date().toISOString(),
      lastResetAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));

    await createUser(newUser, userDefaultWords);

    // Create session
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

// Login
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

    // Create session
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

// Firebase Federated Login / Register
app.post("/api/auth/firebase-login", async (req, res) => {
  const { uid, email, name } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "Firebase 登录认证参数不完整。" });
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    let user = await findUserById(uid);
    if (!user) {
      user = await findUserByEmail(cleanEmail);
    }
    
    if (!user) {
      // Auto-register
      user = {
        id: uid,
        email: cleanEmail,
        passwordHash: "firebase_auth_federated",
        name: (name || email.split("@")[0] || "学习者").trim(),
        dailyGoal: 15,
        level: "CET4",
        createdAt: new Date().toISOString()
      };

      // Copy default words
      const userDefaultWords = defaultWords.map(w => ({
        ...w,
        id: "word_" + Math.random().toString(36).substring(2, 11),
        userId: user.id,
        createdAt: new Date().toISOString(),
        lastResetAt: new Date().toISOString(),
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
      await createUser(user, userDefaultWords);
    } else {
      // If user existed with different ID (e.g., registered via email before, now log in via Google), migrate their ID
      if (user.id !== uid) {
        const oldId = user.id;
        user.id = uid;
        await updateUser(oldId, { name: user.name });
      }
      
      if (name && (!user.name || user.name === "学习者")) {
        user = await updateUser(user.id, { name: name.trim() });
      }
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString("hex");
    const session: Session = {
      token,
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    await createSession(session);

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    console.error("Firebase login error:", err);
    res.status(500).json({ error: "Firebase 登录失败: " + (err.message || err) });
  }
});

// Logout
app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    await deleteSession(token);
  }
  res.json({ success: true, message: "已退出登录。" });
});

// Get currently logged-in user profile
app.get("/api/auth/me", authMiddleware, (req: any, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json(safeUser);
});

// Update profile info
app.put("/api/auth/profile", authMiddleware, async (req: any, res) => {
  const { name, level, dailyGoal } = req.body;
  try {
    const updatedUser = await updateUser(req.userId, { name, level, dailyGoal });
    const { passwordHash, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (err: any) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "更新资料失败。" });
  }
});

// Change Password
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

// Sync pull: Restore / sync user data from Firestore to the local db.json
app.post("/api/sync/pull", authMiddleware, async (req: any, res) => {
  const { words, histories } = req.body;
  if (!Array.isArray(words)) {
    return res.status(400).json({ error: "同步单词数据格式不正确。" });
  }

  const userId = req.userId;
  try {
    // Map and sanitize words
    const sanitizedWords = words.map(w => ({
      ...w,
      userId: userId, // Enforce correct ownership
      createdAt: w.createdAt || new Date().toISOString(),
      lastResetAt: w.lastResetAt || new Date().toISOString(),
      nextReviewAt: w.nextReviewAt || new Date().toISOString()
    }));

    // Map and sanitize histories
    const sanitizedHistories = Array.isArray(histories) ? histories.map(h => ({
      ...h,
      userId: userId
    })) : [];

    await syncUserDataFromCloud(userId, sanitizedWords, sanitizedHistories);
    res.json({ success: true, message: "云端数据已成功拉取并同步到本系统。" });
  } catch (err: any) {
    console.error("Sync pull error:", err);
    res.status(500).json({ error: "同步云端数据出错: " + (err.message || err) });
  }
});

// 1. Get stats
app.get("/api/system/stats", authMiddleware, async (req: any, res) => {
  const vTime = await getVirtualTime();
  const userId = req.userId;
  
  const userWords = await getUserWords(userId);
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

  // Calculate Streak metrics from user histories
  const userHistories = await getUserHistories(userId);
  let currentStreak = 0;
  let maxStreak = 0;

  if (userHistories.length > 0) {
    const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Extract unique calendar date strings (YYYY-MM-DD)
    const dateStrings = Array.from(new Set(
      userHistories.map(h => {
        const d = new Date(h.reviewedAt);
        return formatDate(d);
      })
    ));

    // Sort dates chronologically
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
      // Check yesterday
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

    // Calculate max streak historically
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
});

// 2. Fetch all words in database
app.get("/api/words", authMiddleware, async (req: any, res) => {
  const userId = req.userId;
  const userWords = await getUserWords(userId);
  res.json(userWords);
});

// 3. Fetch all review histories
app.get("/api/histories", authMiddleware, async (req: any, res) => {
  const userId = req.userId;
  const userHistories = await getUserHistories(userId);
  res.json(userHistories);
});

// 4. Fetch today's due words for review
app.get("/api/words/due", authMiddleware, async (req: any, res) => {
  const vTime = await getVirtualTime();
  const userId = req.userId;
  const due = await getUserDueWords(userId, vTime);
  res.json(due);
});

// 5. Create word (auto fetching dictionary / fallback Gemini)
app.post("/api/words/create", authMiddleware, async (req: any, res) => {
  const { spelling } = req.body;
  if (!spelling || !spelling.trim()) {
    return res.status(400).json({ error: "Word spelling is required" });
  }

  const cleanSpelling = spelling.trim().toLowerCase();
  const userId = req.userId;

  try {
    // Check if word already exists for this user
    const exists = await findWordBySpelling(userId, cleanSpelling);
    if (exists) {
      return res.status(400).json({ error: `单词 "${cleanSpelling}" 已经存在于您的个人词库中。` });
    }

    let phonetic = "";
    let definition = "";
    let example = "";
    let exampleTranslation = "";
    let mnemonic = "";
    let audioUrl = "";

    // Attempt dictionaryapi.dev first
    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanSpelling}`);
      if (dictRes.ok) {
        const dictData = await dictRes.json();
        if (Array.isArray(dictData) && dictData.length > 0) {
          const item = dictData[0];
          phonetic = item.phonetic || (item.phonetics && item.phonetics.find((p: any) => p.text)?.text) || "";
          
          // Find audio
          if (item.phonetics) {
            const validAudio = item.phonetics.find((p: any) => p.audio && p.audio.trim() !== "");
            if (validAudio) {
              audioUrl = validAudio.audio;
            }
          }

          // Try parsing definition/example
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

    // If Gemini is active, let's use it to generate highly enriched translations, examples, and mnemonics
    if (ai) {
      try {
        const aiData = await generateAiWordDetails(cleanSpelling);
        phonetic = aiData.phonetic || phonetic;
        definition = aiData.definition;
        example = aiData.example;
        exampleTranslation = aiData.exampleTranslation;
        mnemonic = aiData.mnemonic;
      } catch (aiErr) {
        console.error("Gemini enrichment failed:", aiErr);
      }
    }

    // Fallbacks if AI is off and API was incomplete or failed
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
    // Initially reviewStage = 0, nextReviewAt is tomorrow
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
      nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString() // +1 day (tomorrow)
    };

    await createWord(newWord);

    res.status(201).json(newWord);
  } catch (err: any) {
    console.error("Create word error:", err);
    res.status(500).json({ error: "创建单词失败: " + (err.message || err) });
  }
});

// 5.5 Batch import words
app.post("/api/words/import-batch", authMiddleware, async (req: any, res) => {
  const { spellings } = req.body;
  if (!spellings || !Array.isArray(spellings)) {
    return res.status(400).json({ error: "Spellings 必须是一个数组" });
  }

  try {
    const vTime = await getVirtualTime();
    const results: any[] = [];
    const errors: any[] = [];
    
    const userWordsList = await getUserWords(req.userId);
    const existingWords = new Set(userWordsList.map(w => w.spelling.toLowerCase()));

    // Limit batch size to prevent long timeouts or Gemini rate limit issues
    const maxBatchSize = 30;
    const targetSpellings = Array.from(new Set(
      spellings
        .map(s => s.trim())
        .filter(s => s.length > 0)
    )).slice(0, maxBatchSize);

    if (targetSpellings.length === 0) {
      return res.status(400).json({ error: "未检测到有效的英文单词，请检查输入。" });
    }

    // Process sequentially to be extremely safe with API rate limits (like Gemini)
    for (const spelling of targetSpellings) {
      const cleanSpelling = spelling.toLowerCase();
      
      // Check if word already exists in DB
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

      // 1. Try standard Dictionary API
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

      // 2. Try Gemini AI enrichment
      if (ai) {
        try {
          const aiData = await generateAiWordDetails(cleanSpelling);
          phonetic = aiData.phonetic || phonetic;
          definition = aiData.definition;
          example = aiData.example;
          exampleTranslation = aiData.exampleTranslation;
          mnemonic = aiData.mnemonic;
        } catch (aiErr) {
          console.error(`Gemini enrichment failed for ${cleanSpelling}:`, aiErr);
        }
      }

      // 3. Fallbacks
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
        nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };

      results.push(newWord);
      // Add to existingWords so duplicate inputs within the same batch are handled
      existingWords.add(cleanSpelling);
    }

    // Save to DB
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

// 6. Submit review outcomes (Batch submission at session conclusion)
app.post("/api/review/submit", authMiddleware, async (req: any, res) => {
  const { results } = req.body; // array of { wordId: string, firstTryCorrect: boolean }
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

// 7. Delete word
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

// 8. Edit Word Details manually
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

// 8.5 Regenerate Word details with AI
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

    const aiData = await generateAiWordDetails(word.spelling);
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

// 9. Time Travel simulated clock offset (Advancing clock for review trigger simulation)
app.post("/api/system/time-travel", authMiddleware, async (req: any, res) => {
  const { days } = req.body; // number of days to advance
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

// 10. Reset Time Travel offset and/or Reset the database entirely to seed values
app.post("/api/system/reset", authMiddleware, async (req: any, res) => {
  const { fullReset } = req.body;
  try {
    const vTime = await getVirtualTime();
    if (fullReset) {
      // Only reset words and histories for this specific user to keep others safe
      const userId = req.userId;
      const userDefaultWords = defaultWords.map(w => ({
        ...w,
        id: "word_" + Math.random().toString(36).substring(2, 11),
        userId: userId,
        createdAt: vTime.toISOString(),
        lastResetAt: vTime.toISOString(),
        nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString() // +1 day
      }));

      await resetUserWords(userId, userDefaultWords, vTime);
      const updatedVTime = await getVirtualTime();
      return res.json({ success: true, message: "您的个人词库已成功重置为初始种子状态！", virtualTime: updatedVTime.toISOString() });
    } else {
      // Just reset the clock offset
      await setSystemOffsetMs(0);
      const updatedVTime = await getVirtualTime();
      res.json({ success: true, message: "模拟时间已重置为系统实际时间。", virtualTime: updatedVTime.toISOString() });
    }
  } catch (err: any) {
    console.error("System reset error:", err);
    res.status(500).json({ error: "重置失败: " + (err.message || err) });
  }
});

// ==========================================
// VITE OR STATIC SERVING
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production build from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ebbinghaus Memo server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start().catch(err => {
    console.error("Failed to start server:", err);
  });
}

export default app;
