import { test as base, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const TEST_DB_PATH = path.resolve(process.cwd(), "data", "db.test.json");
const BASE_URL = "http://localhost:3100";

/** 重置测试数据库到干净状态 */
async function resetTestDb() {
  const empty = {
    words: [],
    histories: [],
    systemOffsetMs: 0,
    users: [],
    sessions: [],
  };
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify(empty, null, 2), "utf8");
}

/** 通过 API 直接注册用户（不走 UI，加快测试速度） */
async function registerUserViaApi(
  email: string,
  password: string,
  name = "Test User"
): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    throw new Error(`registerUserViaApi failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return { token: json.token, userId: json.user.id };
}

/** 通过 API 直接登录 */
async function loginUserViaApi(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`loginUserViaApi failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.token;
}

/** 通过 UI 登录（用于需要 cookie/localStorage 场景） */
async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // 检查是否在登录页（输入框存在）
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 10_000 });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  // 登录按钮文案："登录智能词库"（登录模式默认显示）
  await page.getByRole("button", { name: /登录智能词库|完成注册并生成词库/ }).click();
  // 等待进入主页（dashboard 会出现统计卡片）
  await page.waitForLoadState("networkidle");
}

/** 直接插入单词到数据库文件（绕过 AI / dictionary 调用，加快测试 + CI 友好） */
async function addWordToDb(
  token: string,
  word: {
    spelling: string;
    language?: string;
    definition?: string;
    example?: string;
    mnemonic?: string;
  }
) {
  // 先登录拿到 userId
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) throw new Error(`auth/me failed: ${meRes.status}`);
  const meJson = await meRes.json();
  const userId = meJson.user?.id || meJson.id;
  if (!userId) throw new Error("无法获取 userId");

  // 直接读写 db.test.json（仅本地测试模式可用）
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), "data", "db.test.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const newWord = {
    id: "w_" + Math.random().toString(36).slice(2, 11),
    userId,
    language: word.language || "English",
    spelling: word.spelling,
    phonetic: "",
    definition: word.definition || "",
    example: word.example || "",
    exampleTranslation: "",
    mnemonic: word.mnemonic || "",
    audioUrl: "",
    stage: 0,
    nextReviewAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    lastReviewedAt: null,
    reviewCount: 0,
    correctCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.words = db.words || [];
  db.words.push(newWord);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  return newWord;
}

/** 生成唯一测试邮箱 */
function uniqueEmail(prefix = "test"): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `${prefix}+${ts}${rand}@example.com`;
}

export const test = base.extend<{
  cleanDb: void;
  apiHelpers: {
    register: typeof registerUserViaApi;
    login: typeof loginUserViaApi;
    addWord: typeof addWordToDb;
    uniqueEmail: typeof uniqueEmail;
    resetDb: typeof resetTestDb;
  };
  uiHelpers: {
    login: typeof loginViaUi;
  };
}>({
  cleanDb: async ({}, use) => {
    await resetTestDb();
    await use();
    // 测试结束不清空，方便本地调试查看数据
  },
  apiHelpers: async ({}, use) => {
    await use({
      register: registerUserViaApi,
      login: loginUserViaApi,
      addWord: addWordToDb,
      uniqueEmail,
      resetDb: resetTestDb,
    });
  },
  uiHelpers: async ({ page }, use) => {
    await use({ login: loginViaUi });
  },
});

export { expect };
