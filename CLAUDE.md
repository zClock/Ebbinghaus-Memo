# CLAUDE.md — Ebbinghaus-Memo 项目协作指南

> 本文件是给 AI Agent（Claude / 其他助手）的项目级持续指令。每次对话开始时自动加载，请严格遵守。

## 1. 项目概述

**Ebbinghaus-Memo** 是一款基于艾宾浩斯遗忘曲线的多语言背单词 Web 应用。
- 用户注册账号后，词库为空，由用户自行添加（支持单个/批量导入）
- 添加新词时，由 AI 自动生成中文释义、例句、助记
- 采用 6 阶段 SRS（间隔重复）算法：`[1, 2, 4, 7, 15, 30]` 天
- 支持多语言词库（English / Japanese / Spanish / French / Portuguese）
- 支持时间旅行（虚拟时间快进），用于触发复习演示
- 数据持久化到 Supabase Postgres（生产）或本地 JSON 文件（开发默认）

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite 6 + TailwindCSS 4 + lucide-react + motion + recharts |
| 后端 | Express 4 + tsx（直接运行 TypeScript）|
| 数据库 | 本地 `data/db.json`（默认）/ Supabase Postgres（生产）|
| AI | Google Gemini（主）+ GLM Anthropic 兼容端点（兜底）|
| 部署 | Vercel（`vercel.json` 已配置）|

## 3. 项目结构

```
.
├── server.ts              # 本地开发入口（监听 3003 端口 + Vite 中间件）
├── api/
│   ├── index.ts           # Vercel Serverless 单文件入口（全部 Express 业务逻辑内联于此）
│   └── serverDb.ts        # 数据库适配层（Supabase / 本地 JSON 双实现）—— ⚠️ 已内联进 api/index.ts
├── data/db.json           # 本地 JSON 数据库（默认）
├── supabase-schema.sql    # Supabase 建表 SQL
├── src/
│   ├── App.tsx            # 前端主应用（路由 + 状态 + API 调用）
│   ├── main.tsx           # React 入口
│   ├── types.ts           # 前端类型定义（User / Word / Stats）
│   ├── components/
│   │   ├── Auth.tsx       # 登录/注册（level 已移除，dailyGoal 输入修复）
│   │   ├── Dashboard.tsx  # 首页仪表盘（统计 + 时间旅行 + 空词库引导）
│   │   ├── WordList.tsx   # 词库管理（增删改查 + 批量导入 + 导入进度条）
│   │   ├── ReviewSession.tsx  # 复习会话（错词重考 + Unicode-safe 例句挖空）
│   │   ├── Profile.tsx    # 个人资料 + 勋章墙（level 入口已移除）
│   │   └── Navbar.tsx     # 顶部导航
│   └── lib/
│       ├── translations.ts    # 多语言文案（6 种 UI 语言）
│       └── reviewQueue.ts     # 复习队列纯函数（错词重考逻辑）
├── tests/
│   ├── unit/                 # 单元测试（纯函数、算法、数据映射）
│   │   ├── srs-algorithm.test.ts
│   │   └── reviewQueue.test.ts   # 错词重考队列逻辑（11 个用例）
│   └── integration/          # 集成测试（supertest + vi.mock 内存数据库）
│       └── firebase-removal.test.ts  # ⚠️ 当前 .skip（serverDb 内联后无法 mock，待重写）
├── vitest.config.ts       # Vitest 配置
├── .env.local             # 本地环境变量（**不提交**，已在 .gitignore）
├── .env.example           # 环境变量示例（提交）
└── package.json
```

### ⚠️ Vercel 部署关键约束
- Vercel `@vercel/node` runtime **只编译显式声明的 function 入口文件**
- 入口文件 import 的其他 `.ts` 即使在同目录也**不会被编译**
- 因此 `api/index.ts` 是**单文件 serverless function**，全部业务逻辑（包括数据库适配层）内联其中
- 修改 `api/` 下的文件时，**不能**拆分成多个 `.ts` 互相 import

## 4. 常用命令

```bash
# 安装依赖（项目原用 bun，本地用 npm 也兼容）
npm install

# 启动开发服务器（Express + Vite 中间件，端口 3003）
npm run dev

# 运行全部测试（Vitest）
npm test

# 只跑单元测试 / 集成测试
npm run test:unit
npm run test:integration

# 测试 watch 模式（开发时持续监听）
npm run test:watch

# 类型检查（注意：当前有已知报错，详见 spec.md §6）
npm run lint

# 生产构建（产出 dist/ + dist/server.cjs）
npm run build

# 启动生产服务器
npm run start
```

**访问地址**：http://localhost:3003

## 5. 环境变量

参考 `.env.example`。**关键约束**：
- `dotenv` 必须显式加载 `.env.local`（已配置在 `server.ts` 与 `serverDb.ts` 的顶部）
- `.env.local` 在 `.gitignore` 中，**永不提交**
- 必须的环境变量见 `.env.example`

主要变量：
- `GEMINI_API_KEY` — Gemini AI（必填，影响新词释义质量）
- `GLM_API_KEY` / `GLM_BASE_URL` / `GLM_MODEL` — GLM 兜底（可选）
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — 切换到云端数据库

## 6. Git 协作规范

本项目遵循 **AGENTS.md**（位于 `~/.agents/AGENTS.md`）定义的 Git Flow：

- 禁止直接提交到 `main` / `develop`
- 新功能：`feature/<描述>` ← `develop`
- 紧急修复：`hotfix/<描述>` ← `main` → 合回 `main` 和 `develop`
- 提交消息：Angular 规范 `<type>(<scope>): <subject>`
  - type: `feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`
- 合并到 `main` / `develop` 前**必须征求用户确认**

## 7. 开发约定

### 最小改动原则（YAGNI）
- 只做被明确要求的事，不夹带"顺手改进"
- 不为假想未来需求做设计
- 不为一次性操作写抽象

### 代码风格
- **TypeScript**，但不强制完美类型（`tsx` 运行时不做严格类型检查）
- 命名：camelCase（变量/函数）、PascalCase（组件/接口）
- 注释：仅在逻辑不直观时写，**用中文**
- API 错误响应统一中文：`{ error: "中文说明" }`
- 前端 fetch 一律带 `Authorization: Bearer ${token}`

### 数据库改动
- 优先复用 [serverDb.ts](file:///serverDb.ts) 已有的封装函数
- 涉及新表/字段时，**同步更新** [supabase-schema.sql](file:///supabase-schema.sql) 和本地 `db.json` 兼容路径
- Supabase 与本地 JSON 必须保持行为一致（双路径实现）

### AI 调用
- 复用 `generateAiWordDetails` 的双兜底模式（Gemini → GLM）
- 新增 AI 调用点必须能感知 provider 降级

### 不做的事
- ❌ 不主动加文档文件（除非明确要求）
- ❌ 不加 eslint/prettier 配置（除非明确要求）
- ❌ 不加多余的环境变量校验中间件

### 测试约定（强制）
**所有代码改动必须配测试**。新功能上线前，相关测试必须全绿。
- **框架**：Vitest（已在 [package.json](file:///package.json) 配置好）
- **单元测试**：放在 `tests/unit/`，测纯函数、算法、数据映射等不依赖外部的逻辑
- **集成测试**：放在 `tests/integration/`，用 `vi.mock` 替换 `serverDb` 模块为内存版假数据库，再用 `supertest` 对 `app` 实例发请求
- **运行**：`npm test`（一次性）/ `npm run test:watch`（监听）
- **覆盖范围**：业务核心逻辑必须有测试；样式/UI 细节不强制
- **修改已有功能时**：先看 `tests/` 里有没有相关测试，有则更新，没有则补
- ⚠️ **集成测试现状**：`firebase-removal.test.ts` 因 serverDb 内联到 `api/index.ts` 后无法 vi.mock，当前 `.skip`。新集成测试应改用基于真实本地 JSON 的端到端方式

### 纯函数优先原则
- **业务核心逻辑应抽成纯函数**，放在 `src/lib/` 下，配单元测试
- 示例：`src/lib/reviewQueue.ts`（复习队列管理）抽离后，让 React 组件复用且可测试
- React 组件只负责 UI 和状态管理，复杂算法调用纯函数

## 8. 当前已知问题

详见 [spec.md](file:///spec.md) §6「已知问题与限制」。改动相关模块时要注意不要引入冲突。

## 9. 持续维护

本文件随项目演进**持续更新**，关键触发点：
- 新增模块/组件 → 更新 §3 项目结构
- 新增环境变量 → 更新 §5
- 修改端口/启动命令 → 更新 §4
- 修改协作约定 → 更新 §6 / §7
