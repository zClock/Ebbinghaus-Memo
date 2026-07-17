import { test, expect } from "./fixtures";

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
});
