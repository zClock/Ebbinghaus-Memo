import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../api/index";

describe("AI 生成接口与快速模式安全性测试 (AI & Fast Mode Security)", () => {
  it("未经授权的外部请求调用批量导入接口应被拒 (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/words/import-batch")
      .send({
        spellings: ["unauthorized_word"],
        language: "English"
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/未登录/);
  });

  it("携带无效 Token 调用的外部请求应被拒 (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/words/import-batch")
      .set("Authorization", "Bearer invalid_fake_token_12345")
      .send({
        spellings: ["fake_token_word"],
        language: "English"
      });

    expect(res.status).toBe(401);
  });

  it("未经授权调用单词 AI 创建接口应被拒 (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/words/create")
      .send({
        spelling: "single_unauth_word",
        language: "English"
      });

    expect(res.status).toBe(401);
  });

  it("已授权用户调用批量导入接口应成功，且模式强制为 fast", async () => {
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

    const importRes = await request(app)
      .post("/api/words/import-batch")
      .set("Authorization", `Bearer ${token}`)
      .send({
        spellings: ["securityword"],
        language: "English",
        mode: "quality"
      });

    expect(importRes.status).toBe(200);
    expect(importRes.body.mode).toBe("fast");
  });
});
