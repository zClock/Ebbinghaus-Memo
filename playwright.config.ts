import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 配置
 * - 启动独立的 dev server 用于 E2E 测试（端口 3100，独立 DB 文件）
 * - 不会污染本地开发数据库 data/db.json
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // 共享同一 db 文件，串行避免竞态
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 8_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "DB_PATH=./data/db.test.json PORT=3100 npm run dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
