import { test, expect } from "./fixtures";

test.describe("管理员专属功能（白名单可见性）", () => {
  const PASSWORD = "Test1234!";

  test.beforeEach(async ({ apiHelpers }) => {
    await apiHelpers.resetDb();
  });

  test("普通用户不应看到时光机 / 重置数据库功能", async ({ page, apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("normal");
    await apiHelpers.register(email, PASSWORD);

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 普通用户不应看到时光机功能按钮 / 卡片标题（注意：正文介绍文案可能提到"时光机"，所以要精确匹配按钮）
    // 时光机卡片标题通常是"时光机"或"Time Warp"
    // 但它通过 isPrivileged && 渲染，普通用户DOM里不会有这些卡片标题元素
    await expect(page.getByText(/^时光机$|^Time Warp$|^タイムワープ$/)).toHaveCount(0);
    // "重置系统数据库"按钮也应不出现
    await expect(
      page.getByRole("button", { name: /^重置系统|^Reset System|^Restablecer sistema$/ })
    ).toHaveCount(0);
    // "快进 1 天 / 3 天 / 30 天" 这类按钮也应不出现
    await expect(
      page.getByRole("button", { name: /快进\s*\d|Advance\s+\d|進める\s*\d|Avanzar\s+\d/ })
    ).toHaveCount(0);
  });

  test("wujizong@gmail.com 应能看到时光机 / 重置数据库功能", async ({ page, apiHelpers }) => {
    // 在测试数据库里手动注册这个特殊邮箱
    const email = "wujizong@gmail.com";
    await apiHelpers.register(email, PASSWORD);

    await page.goto("/");
    await page.locator('input[type="email"]').first().waitFor({ state: "visible" });
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole("button", { name: /登录智能词库/ }).click();
    await page.waitForLoadState("networkidle");

    // 管理员应能看到时光机
    await expect(page.getByText(/时光机|Time Warp|タイムワープ/i).first()).toBeVisible({
      timeout: 8_000,
    });
    // 管理员应能看到"重置系统数据库"按钮
    await expect(
      page.getByRole("button", { name: /重置系统|Reset System|Restablecer sistema/i }).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
