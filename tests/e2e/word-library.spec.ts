import fs from "fs";
import path from "path";
import { test, expect } from "./fixtures";

const BASE_URL = "http://localhost:3100";

test.describe("词库管理", () => {
  const PASSWORD = "Test1234!";

  test.beforeEach(async ({ apiHelpers }) => {
    await apiHelpers.resetDb();
  });

  async function loginAndGoToLibrary(page: any, apiHelpers: any) {
    const email = apiHelpers.uniqueEmail("word_lib");
    const { token } = await apiHelpers.register(email, PASSWORD);

    // seed 几个词
    await apiHelpers.addWord(token, {
      spelling: "serendipity",
      definition: "意外发现美好事物的能力",
    });

    // UI 登录
    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 进入词库
    await page.getByRole("button", { name: /词库|Library/i }).first().click();
    return { email, token };
  }

  test("前端列表应显示数据库里的单词", async ({ page, apiHelpers }) => {
    await loginAndGoToLibrary(page, apiHelpers);
    await expect(page.getByText("serendipity").first()).toBeVisible({ timeout: 10_000 });
  });

  test("通过 API 获取单词列表应包含已添加的词", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("word_list");
    const { token } = await apiHelpers.register(email, PASSWORD);
    await apiHelpers.addWord(token, {
      spelling: "ephemeral",
      definition: "短暂的，瞬息的",
    });

    const res = await fetch("http://localhost:3100/api/words", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok).toBe(true);
    const json = await res.json();
    const words = json.words || json;
    expect(Array.isArray(words)).toBe(true);
    expect(words.some((w: any) => (w.spelling || w.word) === "ephemeral")).toBe(true);
  });

  test("搜索框输入应过滤单词", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("word_search");
    const { token } = await apiHelpers.register(email, PASSWORD);
    await apiHelpers.addWord(token, { spelling: "unique_word_xyz", definition: "测试词" });
    await apiHelpers.addWord(token, { spelling: "another_word_abc", definition: "另一个词" });

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /词库|Library/i }).first().click();

    // 搜索框 placeholder 是动态的，用 Search 图标附近的 input 定位
    const searchInput = page
      .locator('input[type="text"], input:not([type])')
      .first();
    await searchInput.waitFor({ state: "visible", timeout: 8_000 });
    await searchInput.fill("unique_word_xyz");
    await page.waitForTimeout(500);

    await expect(page.getByText("unique_word_xyz").first()).toBeVisible({ timeout: 5_000 });
  });

  test("切换筛选 Tab 应正常响应", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("word_tab");
    const { token } = await apiHelpers.register(email, PASSWORD);
    await apiHelpers.addWord(token, { spelling: "alpha", definition: "阿尔法" });
    await apiHelpers.addWord(token, { spelling: "beta", definition: "贝塔" });

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /词库|Library/i }).first().click();

    // 点"已掌握"Tab，应该看不到刚加的新词（stage=0）
    const masteredTab = page
      .getByText(/^已掌握|^Mastered|^習得済|^Dominad/, { exact: false })
      .first();
    await masteredTab.waitFor({ state: "visible", timeout: 8_000 });
    await masteredTab.click();
    await page.waitForTimeout(500);
  });

  // ===== 批量删除（v1.9.5）=====
  test("批量删除:全选当前页并删除多个单词", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("batch_del");
    const { token } = await apiHelpers.register(email, PASSWORD);
    await apiHelpers.addWord(token, { spelling: "batch_word_one", definition: "词一" });
    await apiHelpers.addWord(token, { spelling: "batch_word_two", definition: "词二" });
    await apiHelpers.addWord(token, { spelling: "batch_word_three", definition: "词三" });

    // UI 登录 + 进入词库
    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /词库|Library/i }).first().click();

    // 等待词库数据加载完成
    await expect(page.getByText("batch_word_one").first()).toBeVisible({ timeout: 10_000 });

    // 自动接受删除确认对话框（confirm）
    page.on("dialog", (d) => d.accept());

    // 进入批量管理模式
    await page.getByRole("button", { name: /批量管理|Batch Manage/ }).click();

    // 全选当前页
    await page.locator("label", { hasText: /^全选本页|^Select page/ }).first().click();

    // 点击「删除选中」
    await page.getByRole("button", { name: /删除选中|Delete selected/ }).first().click();
    await page.waitForLoadState("networkidle");

    // 验证:三个词都已从数据库删除
    const res = await fetch(`${BASE_URL}/api/words?language=All`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    const spellings = (json.words || json).map((w: any) => w.spelling);
    expect(spellings).not.toContain("batch_word_one");
    expect(spellings).not.toContain("batch_word_two");
    expect(spellings).not.toContain("batch_word_three");
  });

  test("批量删除:级联清理复习历史与周计划关联词", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("batch_cascade");
    const { token } = await apiHelpers.register(email, PASSWORD);
    const w1 = await apiHelpers.addWord(token, { spelling: "cascade_one", definition: "级联一" });
    const w2 = await apiHelpers.addWord(token, { spelling: "cascade_two", definition: "级联二" });

    // 取 userId
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();
    const userId = me.user?.id || me.id;

    // 直接写一条 history 关联 w1,并建一个关联 w1+w2 的周计划任务
    const dbPath = path.resolve(process.cwd(), "data", "db.test.json");
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    db.histories = db.histories || [];
    db.histories.push({
      id: "h_test_cascade",
      userId,
      wordId: w1.id,
      wordSpelling: "cascade_one",
      stage: 0,
      reviewedAt: new Date().toISOString(),
      isCorrect: true,
    });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

    const planId = "plan-test-cascade";
    const taskId = "task-test-cascade";
    const planRes = await fetch(`${BASE_URL}/api/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id: planId,
        title: "测试计划",
        startDate: "2026-07-20",
        endDate: "2026-07-26",
        status: "active",
        days: [
          {
            dayOfWeek: 1,
            tasks: [{ id: taskId, type: "language", title: "复习", linkedWordIds: [w1.id, w2.id] }],
          },
        ],
      }),
    });
    expect(planRes.ok).toBe(true);

    // 批量删除 w1 + w2
    const res = await fetch(`${BASE_URL}/api/words/batch-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: [w1.id, w2.id] }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.deletedCount).toBe(2);
    expect(data.affectedTaskIds).toContain(taskId);

    // 验证:history 级联清理 + linkedWordIds 清理(直接读测试库文件)
    const db2 = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    expect((db2.histories || []).some((h: any) => h.wordId === w1.id)).toBe(false);
    const task = (db2.learningTasks || []).find((t: any) => t.id === taskId);
    expect(task).toBeTruthy();
    expect(task.linkedWordIds).not.toContain(w1.id);
    expect(task.linkedWordIds).not.toContain(w2.id);
  });
});
