# plan.md — Ebbinghaus-Memo 优化与技术债务计划

> 本文件记录**已识别但尚未实施**的优化项、bug 修复、技术债务清理。新需求从 [spec.md](file:///spec.md) 来时，把相关优化点挪到这里跟踪。

- **状态图例**：🔲 未开始 / 🚧 进行中 / ✅ 已完成 / ❌ 已废弃
- **优先级**：P0（阻塞） / P1（重要） / P2（可选）

---

## 1. 安全与可靠性（P0）

### 1.1 🔲 密码哈希升级
- **现状**：`crypto.createHash("sha256")` 单次哈希，无 salt
- **目标**：迁移到 `bcrypt` 或 `argon2`，保留旧 hash 的渐进式升级（登录时检测到旧格式自动 rehash）
- **影响范围**：[api/index.ts](file:///api/index.ts) 的 `hashPassword` + 数据库 `password_hash` 字段
- **风险**：上线前必须做兼容期，否则老用户无法登录

### 1.2 🔲 AI Provider 密钥保护
- **现状**：`.env.local` 明文存放 Gemini/GLM/Supabase Service Role 密钥
- **目标**：补充文档/检查清单，避免 service_role key 被意外提交
- **现状**：`.env*` 已在 `.gitignore`，但建议加 `git secrets` 或 pre-commit 钩子

---

## 2. 代码质量（P1）

### 2.1 🚧 修复 TypeScript 类型错误
- **现状**：`npm run lint` 报 14+ 个错误（详见 spec.md §6.1）
- **根本原因**：`TranslationSet` 接口与 5 种语言翻译对象不同步；WordList 引用大量不存在的翻译键
- **子任务**：
  - 🔲 补齐 [src/lib/translations.ts](file:///src/lib/translations.ts) 中缺失的翻译字段（Chinese/English/Japanese/Spanish/French/Portuguese）
  - 🔲 修正 [src/components/WordList.tsx](file:///src/components/WordList.tsx) 中拼错的字段引用（`addSuccessMsg` → `addedSuccess` 等）
- **验收**：`npm run lint` 0 错误

### 2.2 🔲 统一 AI 模型配置
- **现状**：`gemini-3.5-flash` / `gemini-3.1-flash-lite` 硬编码在 [api/index.ts](file:///api/index.ts)
- **目标**：抽到环境变量 `GEMINI_MODELS="gemini-3.5-flash,gemini-3.1-flash-lite"`，方便未来升级
- **⚠️ 待核实**：`gemini-3.5-flash` 模型名疑似不存在，需确认 GEMINI_API_KEY 对应可用模型

### 2.3 🔲 Supabase 错误处理统一
- **现状**：`api/index.ts` 里多处 `if (isSupabaseConfigured && supabase)` 分支，错误日志风格不一
- **目标**：封装一个统一的 Supabase 调用包装器，统一日志与重试策略

### 2.4 🔲 Vercel 单文件 bundle 优化
- **现状**：`api/index.ts` 因 Vercel runtime 约束必须单文件（~1800 行），可维护性差
- **目标**：探索 esbuild bundle 方案，让 dev 时多文件、deploy 时 bundle 成单文件
- **触发时机**：文件超过 2500 行或改动频繁出错时

---

## 3. 测试与质量保证（P1）

### 3.1 🚧 集成测试重写
- **现状**：`tests/integration/firebase-removal.test.ts` 因 serverDb 内联后无法 vi.mock，当前 `.skip`
- **目标**：改为基于真实本地 JSON 的端到端集成测试（启动 Express app + 临时 db.json + supertest）
- **覆盖范围**：注册/登录、单词 CRUD、复习提交、时间旅行、重置

### 3.2 🔲 i18n 翻译键统一
- **现状**：translations.ts 存在两套相似命名（如 `addedSuccess` vs `addSuccessMsg`、`spellingAddPlaceholder` vs `inputWordLabel`）
- **目标**：统一命名，删除冗余键，把 WordList 切换到正确键
- **影响**：6 种语言 × 多个 key，风险较高，建议单独迭代

---

## 4. 架构演进（P2）

### 4.1 🔲 时间旅行按用户隔离
- **现状**：`system_offset_ms` 是全局配置，所有用户共享同一虚拟时间
- **目标**：迁移到 `users` 表的 `time_offset_ms` 字段，每个用户独立
- **影响**：[api/index.ts](file:///api/index.ts) `getSystemOffsetMs` / `setSystemOffsetMs` + [supabase-schema.sql](file:///supabase-schema.sql)

### 4.2 🔲 本地 db.json 并发安全
- **现状**：全量读-改-写，多请求并发时会丢更新
- **目标**：本地模式加文件锁，或直接引导用户切到 Supabase
- **优先级低**：单用户本地开发场景影响小

### 4.3 🔲 AI Provider 抽象层
- **现状**：Gemini 和 GLM 的调用逻辑耦合在 `api/index.ts` 的 `generateAiWordDetails`
- **目标**：抽出 `providers/gemini.ts` 和 `providers/glm.ts`，主入口按优先级链式调用
- **触发时机**：当第 3 个 provider（如 OpenAI/Claude）加入时

### 4.4 🔲 非英语词典 API 接入
- **现状**：只有 English 走 dictionaryapi.dev 拿音标+音频，其他语言完全依赖 AI 和 TTS
- **目标**：为日语/西语/法语/葡语接入合适词典 API（如 Forvo for 音频）
- **触发时机**：用户反馈非英语词音频体验差时

---

## 5. UX 优化（P2，按需排期）

### 5.1 🔲 复习会话中断恢复
- **现状**：刷新页面会丢失会话进度
- **目标**：会话状态持久化到 localStorage 或后端

### 5.2 🔲 移动端适配审查
- **现状**：TailwindCSS 用了大量 `sm:` / `md:` 断点，但未做系统性的移动端测试
- **目标**：在 iOS Safari / Android Chrome 做一轮走查
- **重点**：Navbar 语言切换器在窄屏溢出（3 个控件挤一行）

### 5.3 🔲 离线模式
- **现状**：所有操作依赖网络
- **目标**：Service Worker + IndexedDB 缓存，弱网下能查看词库

### 5.4 🔲 WordList 虚拟时间一致性
- **现状**：WordList 用 `Date.now()` 判断"待复习"，但系统用虚拟时间 `vTime`
- **影响**：时间旅行后 Dashboard 显示有 N 个待复习，切到词库页"待复习"筛选显示 0
- **目标**：把 `stats.virtualTime` 传入 WordList 统一使用

### 5.5 🔲 "All" 视图添加单词提示
- **现状**：`selectedLanguage === "All"` 时添加单词强制变 English，无 UI 提示
- **目标**：表单上明确显示"将添加到：English"标签，或要求用户先选具体语言

---

## 6. 文档（持续）

### 6.1 ✅ 初始化三件套
- [CLAUDE.md](file:///CLAUDE.md) — AI 协作指南
- [spec.md](file:///spec.md) — 功能基线
- [plan.md](file:///plan.md) — 本文件

### 6.2 🔲 README 重写
- **现状**：[README.md](file:///README.md) 还是 AI Studio 模板，没说清本项目
- **目标**：补充项目简介、本地启动步骤、环境变量说明、端口（3003）

---

## 7. 已完成项目归档

### v1.4（2026-07-17）多语言支持修复
- ✅ regenerate 接口传 word.language 给 AI
- ✅ AI prompt schema description 动态化（不再硬编码 English）
- ✅ /api/system/reset 支持按 language 重置
- ✅ ReviewSession 例句挖空 Unicode-safe（修复日语 `\b` 失效）
- ✅ WordList 阶段标签修正为真实 SRS 间隔 [1,2,4,7,15,30] 天
- ✅ 翻译润色（中文/日语/葡语 3 处错误）
- ✅ i18n 翻译模板占位符 `{count}` 与代码 replace 对齐
- ✅ Auth 登录成功后立即跳转（去掉 setTimeout 避免 HMR 闭包失效）
- ✅ 添加单词显示后端错误信息（重复词提示）

### v1.3（2026-07-17）Vercel 部署 + 注册流程
- ✅ Vercel 部署修复（api/index.ts 单文件 serverless function）
- ✅ 批量导入进度条（逐个调用 + 实时百分比）
- ✅ 注册不再塞种子词（词库初始为空）
- ✅ 注册表单去掉 level 下拉
- ✅ dailyGoal 输入修复（0 → 040 bug）
- ✅ WordList 分页文案修复（`{current}` `{count}` replace）
- ✅ Dashboard 空词库引导按钮

### v1.2（2026-07-17）错词重考机制
- ✅ 纯函数 `src/lib/reviewQueue.ts`（单一事实源）
- ✅ 11 个单元测试（含 bug 回归）
- ✅ 修复 setState 异步闭包导致卡结束页的 bug
- ✅ 修复错词重复 push 的 bug

### v1.0（2026-07-17）测试基建
- ✅ 引入 Vitest
- ✅ SRS 算法单元测试

---

## 版本历史

- **v1.1（2026-07-17）**：基于 v1.0 plan，新增 i18n 翻译键统一、Vercel bundle 优化、集成测试重写、非英语词典 API、"All"视图提示、WordList 虚拟时间一致性等 6 项待办（来自多语言审计）。
- **v1.0（2026-07-17）**：基线版本。基于代码调研梳理出 4 大类共 12 项待办。
