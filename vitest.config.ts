import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 测试文件约定：tests/**/*.test.ts
    include: ["tests/**/*.test.ts"],
    // 单元测试与集成测试分目录，方便按需运行
    // 运行全部：npm test
    // 只跑单元：npm test -- tests/unit
    // 只跑集成：npm test -- tests/integration
    environment: "node",
    globals: false,
    // 集成测试默认有超时保护
    testTimeout: 10000,
    // 隔离每个测试文件，避免本地 JSON 数据库状态串扰
    isolate: true,
  },
});
