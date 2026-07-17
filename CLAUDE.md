# CLAUDE.md — Ebbinghaus-Memo 项目协作指南

> 本文件是给 AI Agent（Claude / 其他助手）的项目级持续指令。每次对话开始时自动加载，请严格遵守。

## 1. 项目概述

**Ebbinghaus-Memo** 是一款基于艾宾浩斯遗忘曲线的多语言背单词 Web 应用。
- 用户注册账号后，系统自动塞入 4 个英语种子词
- 添加新词时，由 AI 自动生成中文释义、例句、助记
- 采用 6 阶段 SRS（间隔重复）算法：`[1, 2, 4, 7, 15, 30]` 天
- 支持多语言词库（English / Japanese / Spanish / French / Portuguese）
- 支持时间旅行（虚拟时间快进），用于触发复习演示
- 支持云端 Firestore 备份与 Supabase 持久化

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite 6 + TailwindCSS 4 + lucide-react + motion + recharts |
| 后端 | Express 4 + tsx（直接运行 TypeScript）|
| 数据库 | 本地 `data/db.json`（默认）/ Supabase Postgres（生产）|
| AI | Google Gemini（主）+ GLM Anthropic 兼容端点（兜底）|
| 云同步（可选）| Firebase Firestore + Google Sign-In |
| 部署 | Vercel（`vercel.json` 已配置）|

## 3. 项目结构

```
.
├── server.ts              # Express 后端入口（API 路由 + Vite 中间件）
├── serverDb.ts            # 数据库适配层（Supabase / 本地 JSON 双实现）
├── api/index.ts           # Vercel Serverless 入口
├── data/db.json           # 本地 JSON 数据库（默认）
├── supabase-schema.sql    # Supabase 建表 SQL
├── src/
│   ├── App.tsx            # 前端主应用（路由 + 状态 + API 调用）
│   ├── main.tsx           # React 入口
│   ├── types.ts           # 前端类型定义（User / Word / Stats）
│   ├── components/
│   │   ├── Auth.tsx       # 登录/注册
│   │   ├── Dashboard.tsx  # 首页仪表盘（统计 + 时间旅行）
│   │   ├── WordList.tsx   # 词库管理（增删改查 + 批量导入）
│   │   ├── ReviewSession.tsx  # 复习会话
│   │   ├── Profile.tsx    # 个人资料 + 勋章墙
│   │   └── Navbar.tsx     # 顶部导航
│   └── lib/
│       ├── firebase.ts        # Firebase 客户端
│       ├── firestoreSync.ts   # Firestore 云同步
│       └── translations.ts    # 多语言文案
├── .env.local             # 本地环境变量（**不提交**，已在 .gitignore）
├── .env.example           # 环境变量示例（提交）
└── package.json
```

## 4. 常用命令

```bash
# 安装依赖（项目原用 bun，本地用 npm 也兼容）
npm install

# 启动开发服务器（Express + Vite 中间件，端口 3003）
npm run dev

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
- `VITE_FIREBASE_*` — 前端 Firebase 配置（可选，启用 Google 登录与 Firestore 同步）

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
- ❌ 不加测试框架（项目目前无测试）
- ❌ 不加 eslint/prettier 配置（除非明确要求）
- ❌ 不加多余的环境变量校验中间件

## 8. 当前已知问题

详见 [spec.md](file:///spec.md) §6「已知问题与限制」。改动相关模块时要注意不要引入冲突。

## 9. 持续维护

本文件随项目演进**持续更新**，关键触发点：
- 新增模块/组件 → 更新 §3 项目结构
- 新增环境变量 → 更新 §5
- 修改端口/启动命令 → 更新 §4
- 修改协作约定 → 更新 §6 / §7
