# spec.md — Ebbinghaus-Memo 功能规格（当前现状基线）

> 本文件记录**当前已实现的功能规格**，作为后续开发的功能基线。新需求来临时在此文件追加版本号 + 增量章节。

- **当前版本**：v1.4（2026-07-17，多语言支持修复 + Vercel 部署修复 + 错词重考）
- **维护策略**：只记录"已实现"，未实现的内容写到 [plan.md](file:///plan.md)

---

## 1. 用户故事（已实现）

### 1.1 账号体系
- 作为学习者，我可以用邮箱+密码**注册**账号
- 作为学习者，我可以用邮箱+密码**登录**
- 我可以**退出登录**（同时让服务端 session 失效）
- 我可以**修改昵称 / 每日目标**（level 字段已在 UI 中移除，仅数据库保留）
- 我可以**修改密码**（需校验旧密码）

### 1.2 词库管理
- 作为新注册用户，**词库为空**（不再自动塞入种子词，由用户自行添加）
- 空词库时 Dashboard 显示「去添加我的第一个单词」引导按钮
- 我可以**单个添加**新单词，AI 自动生成中文释义、音标、例句、例句翻译、助记
- 添加重复单词时返回中文提示 `单词 "xxx" 已经存在于您的个人词库中。`
- 我可以**批量导入**单词（每批最多 30 个，去重、过滤空值）
- 批量导入时显示**进度条**（逐个调用 `/api/words/create`，实时显示 `N/M` + 百分比 + 当前单词）
- 我可以**手动编辑**单词的释义、音标、例句、例句翻译、助记
- 我可以**删除**单词（级联删除其复习历史）
- 我可以**AI 重新生成**某个单词的全部字段
- 我可以**按语言过滤**词库（English / Japanese / Spanish / French / Portuguese）
- 分页底部正确显示「第 N / M 页 (共 X 个)」

### 1.3 复习会话
- 我可以**查看今日待复习清单**（按 `nextReviewAt <= 虚拟时间` 过滤）
- 我可以**开始一场复习会话**，系统逐个展示单词，我选择"认识 / 不认识"
- **错词重考机制**：本轮答错的词会在本轮结束时进入"Round 2"，循环直到全部答对
  - 纯函数实现：[src/lib/reviewQueue.ts](file:///src/lib/reviewQueue.ts)
  - 单元测试覆盖：[tests/unit/reviewQueue.test.ts](file:///tests/unit/reviewQueue.test.ts)（11 个用例）
- 会话结束后，系统按 SRS 算法更新每个词的阶段、连续正确数、下次复习时间
- 我可以**查看历史复习记录**

### 1.4 SRS 算法（间隔重复）
- 6 阶段间隔（天）：`[1, 2, 4, 7, 15, 30]`
- **答对**：`consecutiveCorrect += 1`；累计 3 次直升阶段 5（30 天后复习）；否则阶段 +1，按下个间隔排期
- **答错**：阶段归 0，连续正确归 0，1 天后重排
- `reviewStage >= 5` 或 `consecutiveCorrect >= 3` 视为**已掌握**

### 1.5 数据与同步
- 我可以**时间旅行**（虚拟时间快进 N 天），用于演示/调试
- 我可以**重置时间**到真实时间
- 我可以**按语言重置词库**（仅清空指定语言的词和历史，不再塞英语种子词；全量重置需 `language` 缺省）

### 1.6 勋章系统
- 连续复习勋章：1 / 3 / 7 / 15 / 30 天（基于历史最高连续天数 `maxStreak`）
- 词库规模勋章：5 / 20 / 50 / 100 词（基于 `totalWords`）
- 完全掌握勋章：3 / 10 / 30 词（基于 `masteredCount`）
- 每个勋章显示进度条与点亮状态

### 1.7 多语言 UI 与多语言词库
- 支持 UI 语言：中文 / English / Japanese / Spanish / French / Portuguese
- 切换"目标语言 UI"开关可在学习语言界面之间切换
- **多语言词库支持**：
  - 每种目标语言（English/Japanese/Spanish/French/Portuguese）独立存储
  - AI 生成释义时 schema description 根据 `targetLanguage` 动态生成（不再硬编码 English）
  - ReviewSession 例句挖空使用 Unicode-safe 字符串替换（支持日语/中文等非 `\b` 边界语言）
  - WordList 阶段标签显示真实 SRS 间隔 `[1, 2, 4, 7, 15, 30]` 天（6 种 UI 语言全覆盖）

---

## 2. API 规格

所有 API 前缀 `/api`。除注册/登录外，均需 `Authorization: Bearer <token>`。

### 2.1 认证（无需 token）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 邮箱注册，**不再塞种子词**，词库初始为空 |
| POST | `/api/auth/login` | 邮箱密码登录 |
| POST | `/api/auth/logout` | 注销 session |

### 2.2 用户与资料
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/me?language=` | 获取当前用户（合并该语言的 dailyGoal/level）|
| PUT | `/api/auth/profile` | 更新昵称/level/dailyGoal（按语言粒度）|
| PUT | `/api/auth/change-password` | 改密码 |

### 2.3 单词与历史
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/words?language=` | 列出全部词（可按语言过滤）|
| GET | `/api/words/due?language=` | 列出今日待复习 |
| GET | `/api/histories?language=` | 列出复习历史 |
| POST | `/api/words/create` | 新建单词（AI 增强）|
| POST | `/api/words/import-batch` | 批量导入（上限 30 个）|
| PATCH | `/api/words/:id` | 编辑单词字段 |
| DELETE | `/api/words/:id` | 删除单词 |
| POST | `/api/words/:id/regenerate` | AI 重新生成（使用 `word.language`，不再默认 English）|

### 2.4 复习与统计
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/system/stats?language=` | 总词数/待复习/已掌握/阶段分布/streak |
| POST | `/api/review/submit` | 提交复习结果批量更新 |
| POST | `/api/system/time-travel` | 时间快进 N 天 |
| POST | `/api/system/reset` | `fullReset:true` 按语言清空词库（不塞种子词，可传 `language`）/ `fullReset:false` 重置时间 |

---

## 3. 数据模型

### 3.1 数据库表（Supabase）
完整建表 SQL 见 [supabase-schema.sql](file:///supabase-schema.sql)：
- `users(id, email, password_hash, name, daily_goal, level, created_at)`
- `sessions(token, user_id, expires_at)`
- `words(id, user_id, spelling, phonetic, definition, example, example_translation, mnemonic, audio_url, created_at, review_stage, consecutive_correct, last_reset_at, next_review_at, language)`
- `histories(id, user_id, word_id, word_spelling, stage, reviewed_at, is_correct)`
- `user_language_settings(user_id, language, daily_goal, level)` — 复合主键
- `system_config(key, value)` — 存放 `system_offset_ms` 等全局配置

### 3.2 本地 JSON（`data/db.json`）
字段为 camelCase，结构：
```json
{
  "words": [...],        // 含 userId
  "histories": [...],    // 含 userId, wordId
  "systemOffsetMs": 0,
  "users": [...],
  "sessions": [...],
  "languageSettings": [...]
}
```

### 3.3 字段命名约定
- **前端 / 本地 JSON**：camelCase（如 `nextReviewAt`）
- **Supabase Postgres**：snake_case（如 `next_review_at`）
- 转换函数：`toDbXxx` / `fromDbXxx`（见 [serverDb.ts](file:///serverDb.ts) §数据映射）

---

## 4. AI 调用规格

入口：`generateAiWordDetails(spelling, targetLanguage)`（[api/index.ts](file:///api/index.ts)）

### Provider 优先级
1. **Gemini**（主）— 依次尝试 `gemini-3.5-flash` → `gemini-3.1-flash-lite`
2. **GLM**（兜底）— Anthropic `/v1/messages` 格式，模型由 `GLM_MODEL` 控制
3. 全部失败抛 `Error("Both Gemini and GLM failed")` 或 `Error("No AI provider available")`

### Prompt 要求
返回 JSON：`{phonetic, definition, example, exampleTranslation, mnemonic}`，definition/exampleTranslation/mnemonic 必须为中文。
- ⚠️ responseSchema 的 description 根据 `targetLanguage` **动态生成**（不再硬编码 "English"）
- regenerate 接口必须传 `word.language`，否则 AI 会把非英语词按英语处理

### 字典 API 增强（仅 English）
- 新词创建前先调用 `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` 获取音标和音频
- GLM/字典失败时有占位文本兜底，不会让前端报错
- 非英语词依赖浏览器 TTS 作为音频 fallback（浏览器支持参差）

---

## 5. UI 组件清单

| 组件 | 路径 | 职责 |
|---|---|---|
| `App` | [src/App.tsx](file:///src/App.tsx) | 路由 + 鉴权 + 全局状态 + 后端 API 调用 |
| `Auth` | [src/components/Auth.tsx](file:///src/components/Auth.tsx) | 登录/注册（登录成功立即跳转，不再 setTimeout） |
| `Navbar` | [src/components/Navbar.tsx](file:///src/components/Navbar.tsx) | 顶部导航 + 语言切换 + 时钟重置按钮 |
| `Dashboard` | [src/components/Dashboard.tsx](file:///src/components/Dashboard.tsx) | 统计卡片 + 阶段分布图 + 时间旅行 + 空词库引导 |
| `WordList` | [src/components/WordList.tsx](file:///src/components/WordList.tsx) | 词库 CRUD + 批量导入 + 导入进度条 + 正确分页文案 |
| `ReviewSession` | [src/components/ReviewSession.tsx](file:///src/components/ReviewSession.tsx) | 复习会话 + 错词重考 + Unicode-safe 例句挖空 |
| `Profile` | [src/components/Profile.tsx](file:///src/components/Profile.tsx) | 资料 + 改密码 + 勋章墙（level 入口已移除）|

---

## 6. 已知问题与限制

### 6.1 TypeScript 类型错误（不影响运行）
`npm run lint` 会报错，原因：
- [src/components/WordList.tsx](file:///src/components/WordList.tsx) 引用了 `translations.ts` 中**不存在的字段**（如 `addSuccessMsg` / `regenSuccessMsg` / `wordListChartTitle` 等）
- [src/lib/translations.ts](file:///src/lib/translations.ts) 的 `TranslationSet` 接口新增了字段，但 5 种语言的翻译对象没有同步补全

**影响**：仅 `tsc` 报错；`tsx` 运行时不做严格检查，应用可正常启动。

### 6.2 密码哈希弱
- 使用 `crypto.createHash("sha256")` 单次哈希（无 salt、无慢哈希）
- **不应**在生产环境直接暴露，建议迁移到 bcrypt/argon2

### 6.3 AI 模型名写死
- `gemini-3.5-flash` / `gemini-3.1-flash-lite` 硬编码在代码里，未来 Gemini 升级需手动改

### 6.4 本地数据库非并发安全
- `data/db.json` 是全量读写，多请求并发时有覆盖风险
- 生产建议切到 Supabase

### 6.5 时间旅行按用户隔离吗
- **否**。`system_offset_ms` 是全局配置（`system_config` 表），所有用户共享同一虚拟时间
- 多租户场景下这是个语义问题

### 6.6 Vercel 单文件约束（v1.3 引入）
- `api/index.ts` 必须是单文件 serverless function（业务逻辑 + 数据库适配层全部内联）
- 拆分多文件会导致 `ERR_MODULE_NOT_FOUND`
- 代价：`api/index.ts` 文件较大（~1800 行），后续可考虑用 esbuild bundle 优化

### 6.7 集成测试暂停（v1.3 引入）
- `tests/integration/firebase-removal.test.ts` 当前 `.skip`
- 原因：serverDb 内联到 `api/index.ts` 后无法 vi.mock
- 替代方案：新集成测试改为基于真实本地 JSON 的端到端测试

---

## 7. 版本历史

- **v1.4（2026-07-17）**：多语言支持修复（10 项）。
  - 🔴 严重：regenerate 传 language / AI prompt schema 动态化 / system/reset 按语言重置（不再塞英语种子词）/ ReviewSession Unicode-safe 例句挖空
  - 🟡 中等：WordList 阶段标签修正为真实 SRS 间隔 [1,2,4,7,15,30] 天（6 种 UI 语言 + 2 种 UI 模式全覆盖）
  - 🔵 润色：中文 longDesc "当之无愧 of" → "当之无愧的" / 日语 changePwdTitle "パスワード of 変更" → "パスワードの変更" / 葡语 longDesc 拼写错误 introduadas → introduzidas / CLAUDE.md §1 同步
  - 同日修复：i18n 翻译模板 `{count}` 与代码 `replace({hours}/{days})` 不匹配（6 种语言 inHours/inDays）/ Auth 登录成功后 setTimeout 导致 HMR 闭包失效停留在登录页 / 添加单词吞掉后端错误（重复词无提示）
- **v1.3（2026-07-17）**：Vercel 部署修复 + 批量导入进度条 + 注册流程优化。
  - Vercel `@vercel/node` runtime 只编译入口文件 → `api/index.ts` 改为单文件 serverless function（内联全部业务逻辑和数据库适配层）
  - 批量导入改为逐个调用 `/api/words/create`，显示进度条（百分比 + 当前单词）
  - 注册不再自动塞 4 个英语种子词，Dashboard 空词库时显示引导按钮
  - 注册表单去掉 level 下拉，dailyGoal 输入修复（0 → 040 bug）
  - 登录去掉 setTimeout，避免 HMR 闭包失效
  - WordList 分页文案补齐 `{current}` `{count}` replace
  - 错词重考机制（纯函数 `reviewQueue.ts` + 11 个单元测试）
- **v1.2（2026-07-17）**：错词重考机制（纯函数 `reviewQueue.ts` + 11 个单元测试），修复 setState 异步导致的卡结束页 bug
- **v1.1（2026-07-17）**：移除 Firebase 相关功能（决策不再使用）。删除 `src/lib/firebase.ts`、`src/lib/firestoreSync.ts`；移除 `/api/auth/firebase-login`、`/api/sync/pull` 两个后端路由；清理 App.tsx 中的 Firestore 后台同步逻辑；清理 Auth.tsx 中的 Google 登录入口与按钮；从 package.json 删除 `firebase` 依赖；从 .env.example 删除 `VITE_FIREBASE_*`。
- **v1.0（2026-07-17）**：基线版本。完成上述全部"已实现"功能，外加本地化配置（端口 3003、.env.local 加载、Gemini+GLM 双 provider 兜底）。
