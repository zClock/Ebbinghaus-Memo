import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../api/index";

describe("批量导入模式安全性测试 (Batch Import Mode Security)", () => {
  it("外部 API 传输 mode='quality' 时服务端应强制重置为 'fast' 模式", async ({ skip }) => {
    // 注册账号获取 token
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: `batch_sec_${Date.now()}@example.com`,
        password: "TestPassword123!",
        name: "Security Tester"
      });

    expect(regRes.status).toBe(201);
    const token = regRes.body.token;
    expect(token).toBeDefined();

    // 试图强行传入 mode: "quality"
    const importRes = await request(app)
      .post("/api/words/import-batch")
      .set("Authorization", `Bearer ${token}`)
      .send({
        spellings: ["apple"],
        language: "English",
        mode: "quality"
      });

    expect(importRes.status).toBe(200);
    // 验证服务端强行将其重置为 fast 模式
    expect(importRes.body.mode).toBe("fast");
  }, 30000); // 30s timeout for live API call in test environment
});
