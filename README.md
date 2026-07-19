# Ebbinghaus Memo

> 基于艾宾浩斯遗忘曲线的多语言背单词 Web 应用。
>
> Live: https://ebbinghaus-memo.vercel.app/

## 简介

- **6 阶段 SRS 间隔重复算法**：`[1, 2, 4, 7, 15, 30]` 天，连胜 3 次首通正确可直升阶段 5
- **三种复习模式**：闪卡模式 / 拼写测试 / **辨义选择**（本地词典生成拼写近似干扰词，无 AI 依赖）
- **多语言**：5 种目标语言词库（English / Japanese / Spanish / French / Portuguese）× 6 种 UI 界面语言
- **AI 自动生成**：添加新词时由 Gemini（主）/ GLM（兜底）自动生成中文释义、双语例句、艾宾浩斯助记
- **错词循环重考**：本轮答错的词在会话内立即重考，直到全部答对
- **勋章成就系统**：12 枚勋章覆盖"学习坚持 / 词库探索 / 终极掌握"三大维度
- **管理员白名单**：时光机（虚拟时间快进）、数据库重置仅管理员邮箱可见
- **FIFA 足球规则科普讲堂**：17 章 2026/2027 最新规则，中英双语对照，全文搜索 + 分类筛选
- **双数据库**：开发用本地 JSON，生产用 Supabase Postgres，行为一致

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite 6 + TailwindCSS 4 + lucide-react + motion + recharts |
| 后端 | Express 4 + tsx（直接运行 TypeScript）|
| 数据库 | 本地 `data/db.json`（默认）/ Supabase Postgres（生产）|
| AI | Google Gemini（主）+ GLM Anthropic 兼容端点（兜底）|
| 本地词典 | `data/dictionary.json`（10.4 万英汉）+ `data/dictionary-jp.json`（1.27 万中日）|
| 部署 | Vercel（`api/index.ts` 单文件 serverless function）|

## 本地启动

**前置依赖**：Node.js

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，至少填入 GEMINI_API_KEY

# 3. 启动开发服务器
npm run dev
```

**访问地址**：http://localhost:3003

> 💡 开发模式默认使用本地 JSON 文件作为数据库（`data/db.json`，已 gitignore）。
> 配置 Supabase 环境变量后可切换到云端，使用线上账号与词库。

## 环境变量

参见 [.env.example](.env.example)：

| 变量 | 必填 | 用途 |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini AI（用于新词释义/例句/助记生成）|
| `GLM_API_KEY` / `GLM_BASE_URL` / `GLM_MODEL` | 可选 | GLM 兜底（Gemini 不可用时自动切换）|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | 可选 | 切换到 Supabase 云端数据库 |
| `SUPABASE_SERVICE_ROLE_KEY` | 可选 | 后端管理操作（密码重置/批量维护）|
| `PORT` | 可选 | 覆盖默认端口 3003 |

## 常用命令

```bash
npm run dev              # 启动开发服务器（端口 3003）
npm test                 # 运行单元测试（Vitest）
npm run test:unit        # 仅运行单元测试
npm run test:e2e         # 运行 E2E 测试（Playwright，独立端口 3100）
npm run test:e2e:ui      # E2E 带 UI 调试模式
npm run lint             # 类型检查（tsc --noEmit）
npm run build            # 生产构建（产出 dist/）
npm run start            # 启动生产服务器
```

## 文档导航

- [CLAUDE.md](CLAUDE.md) — AI Agent 协作指南（项目结构、技术栈、协作规范、开发约定）
- [spec.md](spec.md) — 功能规格基线（已实现功能的完整记录）
- [plan.md](plan.md) — 优化与技术债务计划（待办项 + 已完成归档）
- [USER_MANUAL.md](USER_MANUAL.md) — 最终用户操作手册（账号、词库、复习、勋章系统等）

## 项目结构

详见 [CLAUDE.md §3](CLAUDE.md#3-项目结构)。

## 部署

- Vercel 自动部署：每次合并到 `main` 分支自动触发
- `api/index.ts` 是单文件 serverless function（Vercel runtime 约束，不可拆分）
- 生产环境变量在 Vercel 项目设置中配置

## 协作规范

遵循 Git Flow：

- 禁止直接提交到 `main` / `develop`
- 新功能：`feature/<描述>` ← `main`
- 提交消息：Angular 规范 `<type>(<scope>): <subject>`
- 合并到 `main` 前必须征求用户确认

详见 [CLAUDE.md §6](CLAUDE.md#6-git-协作规范)。
