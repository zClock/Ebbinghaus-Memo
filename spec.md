# spec.md — Ebbinghaus-Memo 功能规格（当前现状基线）

> 本文件记录**当前已实现的功能规格**，作为后续开发的功能基线。新需求来临时在此文件追加版本号 + 增量章节。

- **当前版本**：v1.0（基线，2026-07-17）
- **维护策略**：只记录"已实现"，未实现的内容写到 [plan.md](file:///plan.md)

---

## 1. 用户故事（已实现）

### 1.1 账号体系
- 作为学习者，我可以用邮箱+密码**注册**账号
- 作为学习者，我可以用邮箱+密码**登录**
- 作为学习者，我可以用 Google 账号**联合登录**（依赖 Firebase）
- 我可以**退出登录**（同时让服务端 session 失效）
- 我可以**修改昵称 / 备考水平 / 每日目标**
- 我可以**修改密码**（需校验旧密码）

### 1.2 词库管理
- 作为新注册用户，系统**自动塞入 4 个英语种子词**（curiosity / resilience / ephemeral / persistent）
- 我可以**单个添加**新单词，AI 自动生成中文释义、音标、例句、例句翻译、助记
- 我可以**批量导入**单词（每批最多 30 个，去重、过滤空值）
- 我可以**手动编辑**单词的释义、音标、例句、例句翻译、助记
- 我可以**删除**单词（级联删除其复习历史）
- 我可以**AI 重新生成**某个单词的全部字段
- 我可以**按语言过滤**词库（English / Japanese / Spanish / French / Portuguese）

### 1.3 复习会话
- 我可以**查看今日待复习清单**（按 `nextReviewAt <= 虚拟时间` 过滤）
- 我可以**开始一场复习会话**，系统逐个展示单词，我选择"认识 / 不认识"
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
- 我可以**整体重置词库**到种子状态（仅当前用户）
- 当配置了 Firebase 时，登录后会**后台同步** Firestore 云端备份到本地，或把本地数据**快照上传**到 Firestore

### 1.6 勋章系统
- 连续复习勋章：1 / 3 / 7 / 15 / 30 天（基于历史最高连续天数 `maxStreak`）
- 词库规模勋章：5 / 20 / 50 / 100 词（基于 `totalWords`）
- 完全掌握勋章：3 / 10 / 30 词（基于 `masteredCount`）
- 每个勋章显示进度条与点亮状态

### 1.7 多语言 UI
- 支持 UI 语言：中文 / English / Japanese / Spanish / French / Portuguese
- 切换"目标语言 UI"开关可在学习语言界面之间切换

---

## 2. API 规格

所有 API 前缀 `/api`。除注册/登录/firebase-login 外，均需 `Authorization: Bearer <token>`。

### 2.1 认证（无需 token）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 邮箱注册，自动塞 4 个种子词 |
| POST | `/api/auth/login` | 邮箱密码登录 |
| POST | `/api/auth/firebase-login` | Firebase 联合登录 |
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
| POST | `/api/words/:id/regenerate` | AI 重新生成 |

### 2.4 复习与统计
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/system/stats?language=` | 总词数/待复习/已掌握/阶段分布/streak |
| POST | `/api/review/submit` | 提交复习结果批量更新 |
| POST | `/api/system/time-travel` | 时间快进 N 天 |
| POST | `/api/system/reset` | `fullReset:true` 重置词库 / `fullReset:false` 重置时间 |
| POST | `/api/sync/pull` | 从 Firestore 拉取数据覆盖本地 |

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

入口：`generateAiWordDetails(spelling, targetLanguage)`（[server.ts](file:///server.ts)）

### Provider 优先级
1. **Gemini**（主）— 依次尝试 `gemini-3.5-flash` → `gemini-3.1-flash-lite`
2. **GLM**（兜底）— Anthropic `/v1/messages` 格式，模型由 `GLM_MODEL` 控制
3. 全部失败抛 `Error("Both Gemini and GLM failed")` 或 `Error("No AI provider available")`

### Prompt 要求
返回 JSON：`{phonetic, definition, example, exampleTranslation, mnemonic}`，definition/exampleTranslation/mnemonic 必须为中文。

### 字典 API 增强（仅 English）
- 新词创建前先调用 `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` 获取音标和音频
- GLM/字典失败时有占位文本兜底，不会让前端报错

---

## 5. UI 组件清单

| 组件 | 路径 | 职责 |
|---|---|---|
| `App` | [src/App.tsx](file:///src/App.tsx) | 路由 + 鉴权 + 全局状态 + Firestore 后台同步 |
| `Auth` | [src/components/Auth.tsx](file:///src/components/Auth.tsx) | 登录/注册/Google 登录入口 |
| `Navbar` | [src/components/Navbar.tsx](file:///src/components/Navbar.tsx) | 顶部导航 + 语言切换 + 时钟重置按钮 |
| `Dashboard` | [src/components/Dashboard.tsx](file:///src/components/Dashboard.tsx) | 统计卡片 + 阶段分布图 + 时间旅行 |
| `WordList` | [src/components/WordList.tsx](file:///src/components/WordList.tsx) | 词库 CRUD + 批量导入 + 单个 AI 重生 |
| `ReviewSession` | [src/components/ReviewSession.tsx](file:///src/components/ReviewSession.tsx) | 复习会话流程 |
| `Profile` | [src/components/Profile.tsx](file:///src/components/Profile.tsx) | 资料 + 改密码 + 勋章墙 |

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

---

## 7. 版本历史

- **v1.0（2026-07-17）**：基线版本。完成上述全部"已实现"功能，外加本地化配置（端口 3003、.env.local 加载、Gemini+GLM 双 provider 兜底）。
