import { test, expect } from "./fixtures";

test.describe("导航与国际化", () => {
  const PASSWORD = "Test1234!";

  test.beforeEach(async ({ apiHelpers }) => {
    await apiHelpers.resetDb();
  });

  async function login(page: any, apiHelpers: any) {
    const email = apiHelpers.uniqueEmail("nav");
    await apiHelpers.register(email, PASSWORD);

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");
    return email;
  }

  test("4 个主 Tab 切换应正常响应", async ({ page, apiHelpers }) => {
    await login(page, apiHelpers);

    // 控制面板
    await page.getByRole("button", { name: /控制面板|Dashboard/i }).first().click();
    await page.waitForTimeout(300);

    // 词库管理
    await page.getByRole("button", { name: /词库管理|Library/i }).first().click();
    await page.waitForTimeout(300);

    // 开始复习
    await page.getByRole("button", { name: /开始复习|Review/i }).first().click();
    await page.waitForTimeout(300);

    // 个人资料（用户名按钮）
    await page.getByRole("button", { name: /Test User/i }).first().click();
    await page.waitForTimeout(300);
  });

  test("切换 UI 语言到目标语言应看到非中文文案", async ({ page, apiHelpers }) => {
    await login(page, apiHelpers);

    // #select-ui-lang 值是 "zh" / "target"
    const uiLangSelect = page.locator("#select-ui-lang");
    await uiLangSelect.waitFor({ state: "visible", timeout: 5_000 });

    // 切换到 target（英文 UI）
    await uiLangSelect.selectOption("target");
    await page.waitForTimeout(800); // 等待重渲染

    // 验证：导航按钮应变成英文
    await expect(
      page.getByRole("button", { name: /Dashboard|Control|Library|Review/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("切换 UI 语言到英文再切回中文应正常", async ({ page, apiHelpers }) => {
    await login(page, apiHelpers);

    const uiLangSelect = page.locator("#select-ui-lang");
    await uiLangSelect.waitFor({ state: "visible", timeout: 5_000 });

    // 切到 target（英文）
    await uiLangSelect.selectOption("target");
    await page.waitForTimeout(800);

    // 切回 zh（中文）
    await uiLangSelect.selectOption("zh");
    await page.waitForTimeout(800);

    // 验证：中文按钮应该重新出现
    await expect(
      page.getByRole("button", { name: /控制面板|词库管理|开始复习/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
