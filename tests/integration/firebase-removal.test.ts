/**
 * 集成测试：Firebase 移除后的 API 行为
 *
 * 目标：验证 feature/remove-firebase 改动没有破坏核心 API 契约。
 *
 * 策略：
 *   1. 用 vi.mock 替换 serverDb 模块为内存版假数据库
 *      —— 完全避免文件系统与 Supabase 的副作用
 *   2. 设置 VERCEL=1 让 server.ts 跳过 start()（不监听端口）
 *   3. 用 supertest 对 app 实例发真实 HTTP 请求
 *
 * 不真实联网/读文件，只验证 server.ts 路由层契约。
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// 必须在 import app 之前设置环境
process.env.VERCEL = "1";
process.env.SUPABASE_URL = "";
process.env.SUPABASE_ANON_KEY = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.GEMINI_API_KEY = "";

// ============================================================
// 内存版 serverDb —— 实现 server.ts 用到的全部导出函数
// ============================================================
let users: any[] = [];
let sessions: any[] = [];
let words: any[] = [];
let histories: any[] = [];
let systemOffsetMs = 0;

const SEED_WORDS = [
  { spelling: "curiosity", phonetic: "/", definition: "n. 好奇心", example: "x", exampleTranslation: "x", mnemonic: "x", audioUrl: null, language: "English" },
  { spelling: "resilience", phonetic: "/", definition: "n. 韧性", example: "x", exampleTranslation: "x", mnemonic: "x", audioUrl: null, language: "English" },
  { spelling: "ephemeral", phonetic: "/", definition: "adj. 短暂的", example: "x", exampleTranslation: "x", mnemonic: "x", audioUrl: null, language: "English" },
  { spelling: "persistent", phonetic: "/", definition: "adj. 持续的", example: "x", exampleTranslation: "x", mnemonic: "x", audioUrl: null, language: "English" },
];

function resetDb() {
  users = [];
  sessions = [];
  words = [];
  histories = [];
  systemOffsetMs = 0;
}

vi.mock("../../serverDb", () => ({
  isSupabaseConfigured: false,
  getSystemOffsetMs: async () => systemOffsetMs,
  setSystemOffsetMs: async (ms: number) => { systemOffsetMs = ms; },
  findUserByEmail: async (email: string) => users.find(u => u.email === email.trim().toLowerCase()) || null,
  findUserById: async (id: string) => users.find(u => u.id === id) || null,
  createUser: async (user: any, defaultWords?: any[]) => {
    users.push(user);
    if (defaultWords && defaultWords.length > 0) {
      words.push(...defaultWords);
    } else {
      // 没传默认词时，自动塞 4 个种子词（与 server.ts 行为一致）
      const now = new Date().toISOString();
      words.push(...SEED_WORDS.map(w => ({
        ...w,
        id: "word_" + Math.random().toString(36).substring(2, 11),
        userId: user.id,
        createdAt: now,
        reviewStage: 0,
        consecutiveCorrect: 0,
        lastResetAt: now,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
      })));
    }
  },
  updateUser: async (id: string, patch: any) => {
    const u = users.find(x => x.id === id);
    if (!u) throw new Error("user not found");
    Object.assign(u, patch);
    return u;
  },
  findSessionByToken: async (token: string) => sessions.find(s => s.token === token && s.expiresAt > Date.now()) || null,
  createSession: async (s: any) => { sessions.push(s); },
  deleteSession: async (token: string) => {
    sessions = sessions.filter(s => s.token !== token);
  },
  getUserWords: async (userId: string) => words.filter(w => w.userId === userId),
  getUserDueWords: async (userId: string) => words.filter(w => w.userId === userId),
  getUserHistories: async (userId: string) => histories.filter(h => h.userId === userId),
  findWordBySpelling: async (userId: string, spelling: string, lang?: string) =>
    words.find(w => w.userId === userId && w.spelling === spelling.toLowerCase()) || null,
  createWord: async (w: any) => { words.push(w); },
  createWordsBatch: async (arr: any[]) => { words.push(...arr); },
  deleteWord: async (userId: string, id: string) => {
    words = words.filter(w => !(w.userId === userId && w.id === id));
    histories = histories.filter(h => !(h.userId === userId && h.wordId === id));
  },
  updateWord: async (userId: string, id: string, patch: any) => {
    const w = words.find(x => x.userId === userId && x.id === id);
    if (!w) throw new Error("word not found");
    Object.assign(w, patch);
    return w;
  },
  submitReview: async (userId: string, results: any[], vTime: Date) => {
    const updatedWords: any[] = [];
    const newHistories: any[] = [];
    for (const r of results) {
      const w = words.find(x => x.userId === userId && x.id === r.wordId);
      if (!w) continue;
      const isCorrect = !!r.firstTryCorrect;
      if (isCorrect) {
        w.consecutiveCorrect = (w.consecutiveCorrect || 0) + 1;
        w.reviewStage = Math.min((w.reviewStage || 0) + 1, 5);
      } else {
        w.consecutiveCorrect = 0;
        w.reviewStage = 0;
      }
      const intervalDays = [1, 2, 4, 7, 15, 30][w.reviewStage] || 1;
      w.nextReviewAt = new Date(vTime.getTime() + intervalDays * 86400000).toISOString();
      updatedWords.push(w);
      newHistories.push({
        id: "hist_" + Math.random().toString(36).substring(2, 9),
        userId,
        wordId: w.id,
        wordSpelling: w.spelling,
        stage: w.reviewStage,
        reviewedAt: vTime.toISOString(),
        isCorrect,
      });
    }
    return { updatedWords, newHistories };
  },
  resetUserWords: async (userId: string, defaultWords: any[], vTime: Date) => {
    words = words.filter(w => w.userId !== userId);
    histories = histories.filter(h => h.userId !== userId);
    words.push(...defaultWords);
  },
  getUserLanguageSettings: async (_userId: string) => [],
  upsertUserLanguageSettings: async () => {},
}));

// mock serverDb 完成后再动态导入 app
const appPromise = import("../../server").then(m => m.default);

// 测试用账号
const TEST_EMAIL = "test_user@example.com";
const TEST_PASSWORD = "password123";

async function registerAndLogin() {
  const app = await appPromise;
  await request(app)
    .post("/api/auth/register")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: "Tester", level: "CET4", dailyGoal: 10 })
    .expect(201);
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    .expect(200);
  return { app, token: loginRes.body.token as string, user: loginRes.body.user };
}

describe("Firebase 移除 - API 契约验证", () => {
  beforeEach(() => {
    resetDb();
  });

  describe("已移除的路由应返回 404", () => {
    it("POST /api/auth/firebase-login 不再存在", async () => {
      const app = await appPromise;
      const res = await request(app)
        .post("/api/auth/firebase-login")
        .send({ uid: "x", email: "x@example.com", name: "X" });
      expect(res.status).toBe(404);
    });

    it("POST /api/sync/pull 不再存在", async () => {
      const app = await appPromise;
      const res = await request(app)
        .post("/api/sync/pull")
        .set("Authorization", "Bearer fake_token")
        .send({ words: [], histories: [] });
      expect(res.status).toBe(404);
    });
  });

  describe("保留的核心流程仍正常", () => {
    it("注册新账号 → 自动塞入 4 个种子词", async () => {
      const app = await appPromise;
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "seed_test@example.com", password: TEST_PASSWORD, name: "Seed", level: "CET4", dailyGoal: 10 })
        .expect(201);

      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("seed_test@example.com");

      const wordsRes = await request(app)
        .get("/api/words")
        .set("Authorization", `Bearer ${res.body.token}`)
        .expect(200);
      expect(Array.isArray(wordsRes.body)).toBe(true);
      expect(wordsRes.body.length).toBe(4);
      const spellings = wordsRes.body.map((w: any) => w.spelling).sort();
      expect(spellings).toEqual(["curiosity", "ephemeral", "persistent", "resilience"]);
    });

    it("邮箱登录成功，返回有效 token", async () => {
      const { token, user } = await registerAndLogin();
      expect(token).toBeTruthy();
      expect(user.email).toBe(TEST_EMAIL);
    });

    it("错误密码登录被拒（400）", async () => {
      const { app } = await registerAndLogin();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: "wrong_password" })
        .expect(400);
      expect(res.body).toHaveProperty("error");
    });

    it("/api/auth/me（带 token）返回当前用户", async () => {
      const { app, token } = await registerAndLogin();
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(res.body.email).toBe(TEST_EMAIL);
    });

    it("未带 token 访问受保护接口返回 401", async () => {
      const app = await appPromise;
      const res = await request(app).get("/api/words").expect(401);
      expect(res.body).toHaveProperty("error");
    });

    it("时间旅行：快进 3 天后返回新的虚拟时间", async () => {
      const { app, token } = await registerAndLogin();
      const res = await request(app)
        .post("/api/system/time-travel")
        .set("Authorization", `Bearer ${token}`)
        .send({ days: 3 })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.daysAdvanced).toBe(3);
      expect(res.body.totalOffsetDays).toBe(3);
      expect(res.body.newVirtualTime).toBeTruthy();
    });

    it("重置时间（fullReset:false）→ totalOffsetDays 归零", async () => {
      const { app, token } = await registerAndLogin();
      await request(app)
        .post("/api/system/time-travel")
        .set("Authorization", `Bearer ${token}`)
        .send({ days: 5 });
      const res = await request(app)
        .post("/api/system/reset")
        .set("Authorization", `Bearer ${token}`)
        .send({ fullReset: false })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it("统计接口返回符合 schema 的对象", async () => {
      const { app, token } = await registerAndLogin();
      const res = await request(app)
        .get("/api/system/stats")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty("totalWords");
      expect(res.body).toHaveProperty("dueTodayCount");
      expect(res.body).toHaveProperty("masteredCount");
      expect(res.body.totalWords).toBe(4);
    });

    it("登出后旧 token 失效", async () => {
      const { app, token } = await registerAndLogin();
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      await request(app)
        .get("/api/words")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);
    });
  });
});
