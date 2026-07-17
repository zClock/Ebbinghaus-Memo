# plan.md — Ebbinghaus-Memo 优化与技术债务计划

> 本文件记录**已识别但尚未实施**的优化项、bug 修复、技术债务清理。新需求从 [spec.md](file:///spec.md) 来时，把相关优化点挪到这里跟踪。

- **状态图例**：🔲 未开始 / 🚧 进行中 / ✅ 已完成 / ❌ 已废弃
- **优先级**：P0（阻塞） / P1（重要） / P2（可选）

---

## 1. 安全与可靠性（P0）

### 1.1 🔲 密码哈希升级
- **现状**：`crypto.createHash("sha256")` 单次哈希，无 salt
- **目标**：迁移到 `bcrypt` 或 `argon2`，保留旧 hash 的渐进式升级（登录时检测到旧格式自动 rehash）
- **影响范围**：[server.ts](file:///server.ts) 的 `hashPassword` + 数据库 `password_hash` 字段
- **风险**：上线前必须做兼容期，否则老用户无法登录

### 1.2 🔲 AI Provider 密钥保护
- **现状**：`.env.local` 明文存放 Gemini/GLM/Supabase Service Role 密钥
- **目标**：补充文档/检查清单，避免 service_role key 被意外提交
- **现状**：`.env*` 已在 `.gitignore`，但建议加 `git secrets` 或 pre-commit 钩子

---

## 2. 代码质量（P1）

### 2.1 🚧 修复 TypeScript 类型错误
- **现状**：`npm run lint` 报 14+ 个错误（详见 spec.md §6.1）
- **根本原因**：`TranslationSet` 接口与 5 种语言翻译对象不同步
- **子任务**：
  - 🔲 补齐 [src/lib/translations.ts](file:///src/lib/translations.ts) 中缺失的翻译字段（Chinese/English/Japanese/Spanish/French/Portuguese）
  - 🔲 修正 [src/components/WordList.tsx](file:///src/components/WordList.tsx) 中拼错的字段引用（`addSuccessMsg` → `addedSuccess` 等）
- **验收**：`npm run lint` 0 错误

### 2.2 🔲 统一 AI 模型配置
- **现状**：`gemini-3.5-flash` / `gemini-3.1-flash-lite` 硬编码在 [server.ts](file:///server.ts)
- **目标**：抽到环境变量 `GEMINI_MODELS="gemini-3.5-flash,gemini-3.1-flash-lite"`，方便未来升级

### 2.3 🔲 Supabase 错误处理统一
- **现状**：`serverDb.ts` 里多处 `if (isSupabaseConfigured && supabase)` 分支，错误日志风格不一
- **目标**：封装一个统一的 Supabase 调用包装器，统一日志与重试策略

---

## 3. 架构演进（P2）

### 3.1 🔲 时间旅行按用户隔离
- **现状**：`system_offset_ms` 是全局配置，所有用户共享同一虚拟时间
- **目标**：迁移到 `users` 表的 `time_offset_ms` 字段，每个用户独立
- **影响**：[serverDb.ts](file:///serverDb.ts) `getSystemOffsetMs` / `setSystemOffsetMs` + [supabase-schema.sql](file:///supabase-schema.sql)

### 3.2 🔲 本地 db.json 并发安全
- **现状**：全量读-改-写，多请求并发时会丢更新
- **目标**：本地模式加文件锁，或直接引导用户切到 Supabase
- **优先级低**：单用户本地开发场景影响小

### 3.3 🔲 AI Provider 抽象层
- **现状**：Gemini 和 GLM 的调用逻辑耦合在 `generateAiWordDetails`
- **目标**：抽出 `providers/gemini.ts` 和 `providers/glm.ts`，主入口按优先级链式调用
- **触发时机**：当第 3 个 provider（如 OpenAI/Claude）加入时

### 3.4 🔲 测试基建
- **现状**：无任何测试
- **目标**：引入 vitest + 对 SRS 算法做单元测试（业务核心，最值得测）
- **不建议**：不为了覆盖率写无效的 mock 测试

---

## 4. UX 优化（P2，按需排期）

### 4.1 🔲 复习会话中断恢复
- **现状**：刷新页面会丢失会话进度
- **目标**：会话状态持久化到 localStorage 或后端

### 4.2 🔲 移动端适配审查
- **现状**：TailwindCSS 用了大量 `sm:` / `md:` 断点，但未做系统性的移动端测试
- **目标**：在 iOS Safari / Android Chrome 做一轮走查

### 4.3 🔲 离线模式
- **现状**：所有操作依赖网络
- **目标**：Service Worker + IndexedDB 缓存，弱网下能查看词库

---

## 5. 文档（持续）

### 5.1 ✅ 初始化三件套
- [CLAUDE.md](file:///CLAUDE.md) — AI 协作指南
- [spec.md](file:///spec.md) — 功能基线
- [plan.md](file:///plan.md) — 本文件

### 5.2 🔲 README 重写
- **现状**：[README.md](file:///README.md) 还是 AI Studio 模板，没说清本项目
- **目标**：补充项目简介、本地启动步骤、环境变量说明、端口（3003）

---

## 6. 已完成项目归档

（暂无，已完成项从此处向上累积后移除）

---

## 版本历史

- **v1.0（2026-07-17）**：基线版本。基于代码调研梳理出 4 大类共 12 项待办。
