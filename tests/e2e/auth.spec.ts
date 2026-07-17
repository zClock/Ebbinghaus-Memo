import { test, expect } from "./fixtures";

test.describe("认证流程", () => {
  test.beforeEach(async ({ cleanDb }) => {
    // cleanDb fixture 自动重置数据库
    void cleanDb;
  });

  test("通过 API 注册新用户应成功", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("auth_api");
    const { token, userId } = await apiHelpers.register(email, "Test1234!");

    expect(token).toBeTruthy();
    expect(userId).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
  });

  test("API 注册后可以用同样密码登录", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("auth_login");
    await apiHelpers.register(email, "Test1234!");

    const token = await apiHelpers.login(email, "Test1234!");
    expect(token).toBeTruthy();
  });

  test("错误密码登录应失败", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("auth_wrong");
    await apiHelpers.register(email, "Correct1234!");

    const res = await fetch("http://localhost:3100/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "WrongPassword!" }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });

  test("重复邮箱注册应失败", async ({ apiHelpers }) => {
    const email = apiHelpers.uniqueEmail("auth_dup");
    await apiHelpers.register(email, "Test1234!");

    const res = await fetch("http://localhost:3100/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!", name: "Another" }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });

  test("通过 UI 登录可进入主页", async ({ apiHelpers, uiHelpers, page }) => {
    const email = apiHelpers.uniqueEmail("auth_ui");
    await apiHelpers.register(email, "Test1234!");

    await uiHelpers.login(page, email, "Test1234!");

    // 进入主页后应该能看到顶部导航的某个元素（仪表盘/Dashboard/复习等）
    await expect(page.getByText(/仪表盘|今日复习|词库|Dashboard/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
