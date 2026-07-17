import { test, expect } from "./fixtures";
import fs from "fs";

test.describe("复习会话", () => {
  const PASSWORD = "Test1234!";

  test.beforeEach(async ({ apiHelpers }) => {
    await apiHelpers.resetDb();
  });

  test("空词库进入复习页应显示无待复习", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("review_empty");
    await apiHelpers.register(email, PASSWORD);

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 点复习按钮
    const reviewBtn = page.getByRole("button", { name: /复习|Review|復習|Repaso/i }).first();
    await reviewBtn.waitFor({ state: "visible", timeout: 8_000 });
    await reviewBtn.click();

    // 应该看到"今日无复习"之类的提示（实际文案为"词库状态：完全充沛"或类似）
    await expect(
      page.getByText(/完全充沛|词库状态|No words|all caught up|すべて|Sin palabras|Aucun|今天所有/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("添加到期词后应能进入复习", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("review_with_words");
    const { token } = await apiHelpers.register(email, PASSWORD);

    // 直接写一个已到期的词到 db（nextReviewAt = 过去时间）
    const dbPath = "data/db.test.json";
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    db.words.push({
      id: "w_review_test",
      userId: db.users[0].id,
      language: "English",
      spelling: "deadline",
      phonetic: "/ˈdedlaɪn/",
      definition: "截止日期",
      example: "The deadline is tomorrow.",
      exampleTranslation: "截止日期是明天。",
      mnemonic: "",
      audioUrl: "",
      reviewStage: 1,
      consecutiveCorrect: 0,
      nextReviewAt: new Date(Date.now() - 60_000).toISOString(),
      lastReviewedAt: null,
      reviewCount: 0,
      correctCount: 0,
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 进入复习
    const reviewBtn = page.getByRole("button", { name: /复习|Review|復習/i }).first();
    await reviewBtn.waitFor({ state: "visible", timeout: 8_000 });
    await reviewBtn.click();

    // 选闪卡模式 + 启动复习
    await page.getByRole("button", { name: /闪卡|Flashcard|フラッシュ/i }).first().click();
    await page.getByRole("button", { name: /启动复习|Start|開始|Iniciar/i }).first().click();

    // 应该看到单词（deadline）或提交核对按钮
    await expect(
      page.getByText(/deadline|提交核对|Check|チェック|Verificar/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("复习结果提交 API 应正常返回", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("review_api");
    const { token } = await apiHelpers.register(email, PASSWORD);
    await apiHelpers.addWord(token, { spelling: "test_word", definition: "测试" });

    // 先拿到 wordId
    const listRes = await fetch("http://localhost:3100/api/words", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listJson = await listRes.json();
    const word = (listJson.words || listJson)[0];
    const wordId = word.id;

    // 直接调提交复习接口（接口期待 results 数组）
    const res = await fetch("http://localhost:3100/api/review/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        results: [
          {
            wordId,
            isCorrect: true,
            language: "English",
          },
        ],
      }),
    });

    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json).toBeTruthy();
    expect(json.updatedWords || json.newHistories).toBeTruthy();
  });
});
