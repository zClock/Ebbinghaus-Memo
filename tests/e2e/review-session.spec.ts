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

  // ===== 短语支持（v1.10）=====

  // 直写一个「已到期」的词到 db（fixtures.addWordToDb 种的词永不到期，字段名也不同）
  function seedDueWord(db: any, userId: string, spelling: string) {
    db.words.push({
      id: "w_" + Math.random().toString(36).slice(2, 11),
      userId,
      language: "English",
      spelling,
      phonetic: "",
      definition: `【${spelling}】的中文释义`,
      example: "",
      exampleTranslation: "",
      mnemonic: "",
      audioUrl: "",
      reviewStage: 1,
      consecutiveCorrect: 0,
      nextReviewAt: new Date(Date.now() - 60_000).toISOString(),
      lastResetAt: null,
      lastReviewedAt: null,
      reviewCount: 0,
      correctCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  test("拼写模式:短语宽松判定（多余空格与大小写不误判）", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("phrase_spell");
    const { userId } = await apiHelpers.register(email, PASSWORD);

    const dbPath = "data/db.test.json";
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    seedDueWord(db, userId, "give up");
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    const reviewBtn = page.getByRole("button", { name: /复习|Review|復習/i }).first();
    await reviewBtn.waitFor({ state: "visible", timeout: 8_000 });
    await reviewBtn.click();

    // 选拼写模式 + 启动
    await page.locator("#btn-mode-spelling").click();
    await page.locator("#btn-start-review-session").click();

    // 输入带多余空格和大小写差异的答案 —— 宽松比对应判对
    await page.locator("#input-spelling-answer").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("#input-spelling-answer").fill("  Give   UP ");
    await page.locator("#btn-spelling-submit").click();

    await expect(page.getByText(/完全正确|Correct|正解/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("#btn-spelling-next")).toBeVisible();
  });

  test("辨义模式:跳过短语且不误推短语 SRS（泄漏回归）", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("phrase_def");
    const { userId } = await apiHelpers.register(email, PASSWORD);

    const dbPath = "data/db.test.json";
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    seedDueWord(db, userId, "deadline");
    seedDueWord(db, userId, "give up");
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 辨义模式按钮仅在语言筛选为具体语言（English/Japanese）时渲染，先切到英语
    await page.getByRole("combobox").nth(1).selectOption({ label: "英语 (EN)" });
    await page.waitForTimeout(500);

    const reviewBtn = page.getByRole("button", { name: /复习|Review|復習/i }).first();
    await reviewBtn.waitFor({ state: "visible", timeout: 8_000 });
    await reviewBtn.click();

    // 选辨义模式：应显示跳过提示
    await page.locator("#btn-mode-definition").click();
    await expect(page.getByText(/已跳过 1 个短语|1 phrases skipped/i).first()).toBeVisible({ timeout: 5_000 });

    // 启动后队列只有 1 个词（deadline）
    await page.locator("#btn-start-review-session").click();
    await expect(page.getByText("1 / 1").first()).toBeVisible({ timeout: 15_000 });

    // 答题：选出正确拼写 deadline
    const correctOption = page.getByRole("button", { name: /deadline/ }).first();
    await correctOption.waitFor({ state: "visible", timeout: 20_000 });
    await correctOption.click();
    await page.locator("#btn-definition-next").click();

    // 结算并同步结果
    const syncBtn = page.locator("#btn-sync-review-results");
    await syncBtn.waitFor({ state: "visible", timeout: 10_000 });
    await syncBtn.click();

    // 直读测试库断言：deadline 正常推进；give up 原封不动（未被凭空标对）
    await expect
      .poll(async () => {
        const after = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        const deadline = after.words.find((w: any) => w.spelling === "deadline");
        const giveUp = after.words.find((w: any) => w.spelling === "give up");
        return {
          deadlineStage: deadline?.reviewStage,
          giveUpStage: giveUp?.reviewStage,
          giveUpNext: giveUp?.nextReviewAt,
          giveUpHistory: (after.histories || []).some(
            (h: any) => h.wordSpelling === "give up"
          ),
        };
      }, { timeout: 15_000 })
      .toEqual({
        deadlineStage: 2, // 答对 → 阶段 1 → 2
        giveUpStage: 1, // 短语未参与，阶段不变
        giveUpNext: db.words.find((w: any) => w.spelling === "give up").nextReviewAt, // 复习时间原封不动
        giveUpHistory: false, // 没有假 history
      });
  });

  test("辨义模式:待复习全是短语时禁用启动并提示", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("phrase_only");
    const { userId } = await apiHelpers.register(email, PASSWORD);

    const dbPath = "data/db.test.json";
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    seedDueWord(db, userId, "give up");
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 辨义模式按钮仅在语言筛选为具体语言（English/Japanese）时渲染，先切到英语
    await page.getByRole("combobox").nth(1).selectOption({ label: "英语 (EN)" });
    await page.waitForTimeout(500);

    const reviewBtn = page.getByRole("button", { name: /复习|Review|復習/i }).first();
    await reviewBtn.waitFor({ state: "visible", timeout: 8_000 });
    await reviewBtn.click();

    await page.locator("#btn-mode-definition").click();

    // 启动按钮禁用 + 空态提示可见
    await expect(page.locator("#btn-start-review-session")).toBeDisabled();
    await expect(
      page.getByText(/均为短语|All due items are phrases/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});