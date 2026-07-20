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

### 2.1 ✅ 修复 TypeScript 类型错误（v1.6 已大部分解决）
- **现状**：原 `npm run lint` 报 14+ 个错误（详见 spec.md §7.1）
- **v1.6 进展**：补齐了 WordList 引用的 59 个翻译键 × 5 种目标语言，以及 `emptyLibraryCta`、TranslationSet 接口字段，主要 lint 错误已消除
- **遗留**：少量历史字段（如 `addSuccessMsg` / `regenSuccessMsg`）可能仍待清理，建议下一次 lint 跑完看剩余项

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

### 3.1 ✅ E2E 测试替代集成测试（v1.6 完成）
- **现状**：`tests/integration/firebase-removal.test.ts` 因 serverDb 内联后无法 vi.mock，早已 `.skip`
- **v1.6 解决方案**：不再重写 vitest 集成测试，改为引入 Playwright E2E（17 个用例覆盖核心流程）
- **基建**：独立 dev server (port 3100) + 独立 `data/db.test.json` + GitHub Actions CI 自动跑
- **后续可继续扩充**：移动端 viewport 测试、非英语词库流程、批量导入 .txt 文件上传等

### 3.2 🔲 i18n 翻译键统一
- **现状**：translations.ts 仍存在两套相似命名（如 `addedSuccess` vs `addSuccessMsg`、`spellingAddPlaceholder` vs `inputWordLabel`）
- **v1.6 进展**：缺失的 59 个键已全部补齐（不再有空白问题），但冗余命名仍在
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

### 6.2 ✅ README 重写（v1.8.2 已完成）
- **现状**：README.md 已从 AI Studio 模板重写为项目真实内容（简介、技术栈、本地启动、环境变量、文档导航）

---

## 7. 已完成项目归档

### v1.9.2（2026-07-20）：补充 Git Flow SOP 协作规范
- ✅ [CLAUDE.md](file:///CLAUDE.md) §6 从纯规则列表扩展为 4 个可执行子节（6.1 SOP 6 步表 / 6.2 6 条红线 / 6.3 新 session 自检 / 6.4 Angular 提交规范 + scope 常用值）
- ✅ [spec.md](file:///spec.md) 新增 §7「协作流程（Git Flow SOP）」摘要章节，并把原 §7 已知问题调整为 §8，原 §8 版本历史调整为 §9
- ✅ [USER_MANUAL.md](file:///USER_MANUAL.md) 新增 §12「开发者协作流程（Git Flow）」简述，让参与项目的开发者快速理解工作流
- ✅ 目标：让新对话 session 接到代码任务时，按 CLAUDE.md §6.1 的 SOP 表自动执行 6 步流程，而不是直接在 main 上提交
- ✅ 流程验证：本次 4 个文档变更**完整走完 Git Flow**（feature 分支 → commit → push → 合并 main → 清理分支）作为示范

### v1.9.1（2026-07-20）：周计划数据落到数据库
- ✅ [supabase-schema.sql](file:///supabase-schema.sql) 新增 §7，包含 4 张表（`learning_plans` / `learning_tasks` / `learning_day_meta` / `user_task_types`）+ 4 个索引
- ✅ [api/index.ts](file:///api/index.ts) 新增 9 个 DAO 函数（`listUserPlans` / `createPlanWithContent` / `updatePlanMeta` / `deletePlan` / `upsertTask` / `deleteTask` / `upsertDayMeta` / `getUserTaskTypes` / `setUserTaskTypes`），全部支持 Supabase + 本地 JSON 双路径
- ✅ `WordDbSchema` 接口扩展 4 个可选字段；`initLocalDb` 老文件自动补字段（无需手动迁移）
- ✅ 新增 11 个 REST 端点：`GET/POST /api/plans`、`PATCH/DELETE /api/plans/:id`、`POST/PATCH/DELETE /api/plans/:id/tasks/:taskId`、`PATCH /api/plans/:id/days/:day`、`GET/PUT /api/user/task-types`、`POST /api/plans/migrate`
- ✅ [src/App.tsx](file:///src/App.tsx) 新增 `plans` / `taskTypes` state、`fetchPlansAndTypes`、`migrateLocalPlansIfNeeded`、8 个 CRUD handler；`loadAllData` 并行加载计划；`handleSubmitReview` 闭环改为调 PATCH API
- ✅ [src/components/LearningPlans.tsx](file:///src/components/LearningPlans.tsx) 重构为受控组件：移除所有 `localStorage` 读写，props 接口扩展到 13 项（新增 10 个 CRUD 回调 + `plans` / `taskTypes` 数据），所有业务函数改为 `async` + 调 props 回调
- ✅ localStorage 一次性迁移：用户登录后检测到老数据自动 POST 到 `/api/plans/migrate`，成功后清空 + 打标 `ebbinghaus_plans_migrated=true`（幂等）
- ✅ 端到端测试：11 项 API 流程全绿（注册→列空→创建计划→列出→PATCH任务→查完成状态→PATCH休息日→GET任务类型→DELETE计划→CASCADE验证→恢复空）
- ✅ tsc 类型检查：本次改动 0 错误（剩余 ReviewSession QueueWord 错误为历史遗留）

### v1.9（2026-07-20）：周计划学习日程系统（WeekTodo 风格看板）
- ✅ 新增 [src/components/LearningPlans.tsx](file:///src/components/LearningPlans.tsx)（~1500 行）：8 列横向滚动看板 + 左侧计划列表 + 任务类型管理模态框 + 任务编辑器（含词库关联搜索）
- ✅ 扩展 [src/types.ts](file:///src/types.ts) 新增 `LearningPlan` / `DayPlan` / `LearningTask` / `TaskType` 四个类型
- ✅ App.tsx 新增 `plans` 视图路由 + `allWords` 跨语言词库快照 + `customReviewWords` / `customReviewMetadata` 状态
- ✅ App.tsx 新增 `handleStartCustomReview` 方法，从周计划拉起针对关联词的复习会话
- ✅ App.tsx `handleSubmitReview` 增加自动闭环：复习完成后写回 localStorage 把对应任务标记为已完成
- ✅ Dashboard 新增「智能应用拓展中心 / Application Hub」白底容器 + 2 列应用卡（足球规则 + 周计划）
- ✅ Navbar 用「拓展应用」下拉菜单取代独立 Tab，避免 Tab 无限增长；6 种 UI 语言全覆盖
- ✅ 所有导航按钮加 `whitespace-nowrap`，修复窄屏文字换行
- ✅ WordList 新增顶部 tip bar 引导跳转到周计划
- ✅ Review 空态新增「📅 定制专属周计划」次按钮
- ✅ 6 种 UI 语言独立翻译表（zh/en/ja/es/fr/pt）
- ✅ localStorage 持久化：`ebbinghaus_learning_plans` + `ebbinghaus_task_types`
- ✅ tsc 类型检查 0 错误，dev server 启动验证通过

### v1.8.2（2026-07-19）：WordList 语言筛选下空词库温和提示 + README 重写
- ✅ WordList 顶部条件渲染琥珀色提示条：`selectedLanguage !== "All" && words.length === 0`
- ✅ 新增 i18n key `emptyLanguageHint` × 6 种语言（zh/en/ja/es/fr/pt）
- ✅ README.md 从 AI Studio 模板重写为项目真实内容
- ✅ CLAUDE.md / spec.md / plan.md 同步 v1.8.2 变动
- 背景：线上排查发现用户误切到法语筛选（localStorage 自动沿用上次 selectedLanguage）导致看不到英语词，确认数据未丢，加 UX 引导

### v1.8.1（2026-07-18）：FootballRules 移动端响应式 + 章节切换滚动复位 + bullet list 结构化渲染
- ✅ 修复手机端（iPhone 15 Pro 等）打开足球规则页面后看不到 14 条规则的 bug：grid 容器在手机端改为垂直堆叠 + 外层 `overflow-y-auto`,左侧章节列表 `h-[12vh]`,右侧规则正文撑开可见
- ✅ 章节切换时自动滚回顶部（`useEffect` 监听 `activeLawId`,重置 `scrollContainerRef` + `readerPaneRef` 的 `scrollTop`）
- ✅ bullet list 结构化渲染：新增 `renderStructuredContent()` helper,解析 `\n` 和 `- xxx` 为 `<ul><li>`
- ✅ 正文字号从 `text-xs sm:text-sm` 改为 `text-sm sm:text-base`,手机端易读性提升
- ✅ Vite dev server 加 `host: true`,允许手机端通过局域网 IP 真机调试

### v1.8（2026-07-18）：辨义选择复习模式 + 发音防抖 + 本地词典
- ✅ 新增第三种复习模式「辨义选择」：题干给中文释义，6 个拼写近似词里选对的
- ✅ 初版用 Gemini+GLM AI 生成干扰词，但因响应慢（3.5-20s）+ 偶发失败被替换
- ✅ 改用本地词典（10.4 万英汉词典）+ Levenshtein 编辑距离 + 多层 fallback 算法，响应降到 0.1s，零 AI 依赖
- ✅ 复合词 fallback（如 `behind-the-meter` 按最长词组查 `behind`）
- ✅ 发音按钮 800ms 防抖（抽共享 hook `src/lib/usePronunciation.ts`）
- ✅ 闪卡展开后点击释义/语境/助记区域不再误触收起
- ✅ 多个 UX bug 修复：前端闭包导致预加载失效 / 重试按钮无效 / 错词重考选项不构造
- ✅ 12 个新 i18n key × 6 种语言

### v1.7（2026-07-18）：FIFA 足球规则科普讲堂
- ✅ 移植独立项目的足球规则讲堂（17 章 FIFA 2026/2027 规则，687 行数据）
- ✅ 6 种 UI 语言完整本地化（36 个 football* 字段 × 6 语言，+222 行）
- ✅ 智能渲染策略（中文 UI → 中英对照；其他 UI → 仅英文）
- ✅ Dashboard 入口卡片 + 索引动画
- ✅ E2E 测试 17/17 全绿，无回归

### v1.6（2026-07-17）i18n 完整化 + E2E 测试基建
- ✅ 补齐 5 种目标语言 × 59 个 WordList 翻译键（共 +295 条）
- ✅ `getTranslation` 加 `{...Chinese, ...target}` 兜底（防御性）
- ✅ 补齐 `emptyLibraryCta` 6 语言翻译
- ✅ 修复 Dashboard 漏解构 `onNavigateWords` 导致按钮抛 ReferenceError
- ✅ 修复空词库按钮跳转到不存在的 view `"words"`（改为 `"library"`）
- ✅ 引入 Playwright + 17 个 E2E 测试 + GitHub Actions 自动化
- ✅ `api/index.ts` DB_PATH 支持 env 覆盖 / `server.ts` PORT 支持 env

### v1.5（2026-07-17）管理员白名单 + 浏览器 favicon
- ✅ Dashboard 时光机 + 重置系统数据库两个功能改为仅 `wujizong@gmail.com` 可见
- ✅ 普通用户隐藏后左侧分布图自动 `lg:col-span-12` 占满
- ✅ `index.html` 内联 SVG favicon（学士帽 + indigo 底）

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

- **v1.7（2026-07-19）**：基于 v1.8.2 完成，归档 WordList 语言筛选下空词库温和提示条 + README 重写 + 四份文档同步
- **v1.6（2026-07-18）**：基于 v1.8.1 完成，归档 FootballRules 移动端响应式修复 + 滚动复位 + 结构化渲染等 5 项任务
- **v1.5（2026-07-18）**：基于 v1.8 完成，归档辨义选择复习模式、本地词典干扰词算法、发音防抖等 8 项任务
- **v1.4（2026-07-18）**：基于 v1.7 完成，归档新完成的 5 项足球规则移植任务
- **v1.3（2026-07-17）**：基于 v1.6 完成情况更新——i18n 完整化、Playwright E2E 替代 vitest 集成测试、管理员白名单、favicon。重新组织"已完成项目归档"加入 v1.5 / v1.6 章节。
- **v1.1（2026-07-17）**：基于 v1.0 plan，新增 i18n 翻译键统一、Vercel bundle 优化、集成测试重写、非英语词典 API、"All"视图提示、WordList 虚拟时间一致性等 6 项待办（来自多语言审计）。
- **v1.0（2026-07-17）**：基线版本。基于代码调研梳理出 4 大类共 12 项待办。
