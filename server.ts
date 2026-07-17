import express from "express";
import path from "path";
import fs from "fs";
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
  getUserLanguageSettings,
  upsertUserLanguageSettings
} from "./serverDb";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const app = express();
const PORT = 3003;

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
    // We try multiple models because some models like gemini-3.5-flash might experience temporary high demand (503)
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
      // Anthropic format: response.content is an array of {type: "text", text: "..."}
      const rawText = Array.isArray(glmData.content)
        ? glmData.content.map((c: any) => c.text || "").join("")
        : "";
      // Strip possible markdown code fences
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

// Update profile info
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

// 1. Get stats
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

    // Calculate Streak metrics from user histories
    let userHistories = await getUserHistories(userId);
    if (targetLang !== "All") {
      const wordIds = new Set(userWords.map(w => w.id));
      userHistories = userHistories.filter(h => wordIds.has(h.wordId));
    }
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
  } catch (err: any) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "获取统计数据失败: " + (err.message || err) });
  }
});

// 2. Fetch all words in database
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

// 3. Fetch all review histories
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

// 4. Fetch today's due words for review
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

// 5. Create word (auto fetching dictionary / fallback Gemini)
app.post("/api/words/create", authMiddleware, async (req: any, res) => {
  const { spelling, language } = req.body;
  if (!spelling || !spelling.trim()) {
    return res.status(400).json({ error: "Word spelling is required" });
  }

  const cleanSpelling = spelling.trim().toLowerCase();
  const userId = req.userId;
  const targetLanguage = language || "English";

  try {
    // Check if word already exists for this user
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

    // Attempt dictionaryapi.dev first ONLY if target language is English
    if (targetLanguage === "English") {
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
    }

    // If Gemini is active, let's use it to generate highly enriched translations, examples, and mnemonics
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
      nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString(), // +1 day (tomorrow)
      language: targetLanguage
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

    // Limit batch size to prevent long timeouts or Gemini rate limit issues
    const maxBatchSize = 30;
    const targetSpellings = Array.from(new Set(
      spellings
        .map(s => s.trim())
        .filter(s => s.length > 0)
    )).slice(0, maxBatchSize);

    if (targetSpellings.length === 0) {
      return res.status(400).json({ error: `未检测到有效的${targetLanguage === "English" ? "英文" : targetLanguage}单词，请检查输入。` });
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

      // 1. Try standard Dictionary API ONLY if English
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

      // 2. Try Gemini AI enrichment
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
        nextReviewAt: new Date(vTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        language: targetLanguage
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
    const { createServer: createViteServer } = await import("vite");
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
