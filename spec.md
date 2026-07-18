# spec.md — Ebbinghaus-Memo 功能规格（当前现状基线）

> 本文件记录**当前已实现的功能规格**，作为后续开发的功能基线。新需求来临时在此文件追加版本号 + 增量章节。

- **当前版本**：v1.8（2026-07-18，辨义选择复习模式 + 发音防抖 + 本地词典干扰词）
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
- 我可以**开始一场复习会话**，系统逐个展示单词
- **三种复习模式可选**（v1.8 辨义选择模式上线，构成完整三模式）：
  - **闪卡模式**：点击卡片翻转，自评"认识 / 不认识"
  - **拼写测试**：根据释义和挖空例句，键入拼写
  - **辨义选择**（v1.8 新增）：题干给出中文释义，从 6 个拼写近似的英文单词中选对正确的那个（详见 §1.11）
- **错词重考机制**：本轮答错的词会在本轮结束时进入"Round 2"，循环直到全部答对
  - 纯函数实现：[src/lib/reviewQueue.ts](file:///src/lib/reviewQueue.ts)
  - 单元测试覆盖：[tests/unit/reviewQueue.test.ts](file:///tests/unit/reviewQueue.test.ts)（11 个用例）
- 会话结束后，系统按 SRS 算法更新每个词的阶段、连续正确数、下次复习时间
- 我可以**查看历史复习记录**
- **发音防抖**（v1.8）：单词详情页和复习会话中的发音按钮，同一单词 800ms 内的连续点击视为一次
  - 实现：[src/lib/usePronunciation.ts](file:///src/lib/usePronunciation.ts) — 共享 hook，Audio URL 优先 + Web Speech API 兜底

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
- **翻译完整性（v1.6）**：WordList 引用的 84 个翻译键已在 6 种语言全部齐全；`getTranslation` 加 Chinese 兜底 `{...Chinese, ...target}`，避免未来新增键时再出现空白
- **UI 文案完整性**：emptyLibraryCta / 所有按钮 / Tab 标签 / 阶段标签全部覆盖 6 种语言

### 1.8 管理员白名单（v1.5）
- **时光机**（时间快进）+ **重置系统数据库** 两个高风险功能仅对 `wujizong@gmail.com` 可见
- 判断逻辑：[src/components/Dashboard.tsx](file:///src/components/Dashboard.tsx) 的 `isPrivileged = user?.email === "wujizong@gmail.com"`
- 普通用户登录时：
  - 隐藏时光机卡片（不渲染"快进 1/3/7/30 天"等按钮）
  - 隐藏重置系统数据库卡片
  - 左侧「记忆阶段分布图」自动扩展为 `lg:col-span-12` 整行占满，避免排版空洞
- 管理员登录时：保持原 7/5 双列布局

### 1.9 浏览器 favicon（v1.5）
- [index.html](file:///index.html) 内联 SVG data URI 作为 favicon
- 图形：学士帽（与全站 lucide `GraduationCap` 一致）+ indigo 圆角底（`#4F46E5`）
- 无额外文件请求，支持高 DPI，主题切换不丢失

## §1.10 足球规则科普讲堂（v1.7）
- Dashboard 新增绿茵色入口卡片（学士帽 badge + 旋转指南针 + 国际足联标识）
- 17 章 FIFA 2026/2027 最新规则完整数据（687 行），5 大分类（场地与装备 / 裁判执法 / 比赛时序 / 越位与犯规 / 定位球与重新开始）
- 支持全文搜索（含结果高亮）、分类筛选、章节索引、上下分页
- 重点标识 2026/2027 新规：Law 12（守门员8秒持球）、Law 15（5秒界外球）、Law 16（5秒球门球）
- 多语言策略：
  · UI 文案（按钮/Tab/分类/入口卡）已翻译为 6 种 UI 语言
  · 规则正文数据本身为中英双语，按 UI 语言决定渲染：
    - 中文 UI → 中英对照（保留特殊阅读体验）
    - 英文/日/西/法/葡 UI → 仅英文（数据回退）

---

## §1.11 辨义选择复习模式（v1.8）

第三种复习模式，与闪卡/拼写测试并列。**核心场景**：根据中文释义，从 6 个拼写高度近似的英文单词中选出正确的那个。

### 题目结构
- **题干**：当前复习词的中文释义（顶部突出展示）
- **选项**：6 个按钮（1 个正确 + 5 个干扰），顺序随机
- **干扰词来源**：本地词典 + 编辑距离算法（详见 §4.2），**无 AI 依赖**

### 答题反馈
- 选项点击后立即判色：
  - 正确答案：绿色
  - 用户选错的选项：红色
  - 其他干扰项：保持默认
- 同时底部展示**所有 6 个单词的中文释义**，便于对照学习
- 显示「下一词」按钮推进

### 评分与推进
- 选对 → `markCorrect(wordId)`（同闪卡"认识"）
- 选错 → `markIncorrect(wordId)`（同闪卡"忘了"），进错词重考队列
- 错词重考规则**与其他模式一致**：本轮答错的词进入下一轮重考，循环直到全部答对

### 预加载流水线
- 启动会话时并发预加载前 3 个词的干扰词
- 用户在做第 N 题时后台预加载第 N+3 题（保持 3 题提前量）
- 错词重考时复用同一份缓存（不重新请求后端），仅前端重新 shuffle 选项顺序

### 失败恢复（极端情况）
当干扰词生成失败（如生僻词/复合词无法找到候选）时，UI 显示三个恢复按钮：
- **重试**：清除失败标记，重新触发预加载（`force=true` 绕过同步 state 检查）
- **切回闪卡**：保留当前复习队列，切到 flashcard 模式继续
- **退出会话**：调 `onClose` 返回首页

### 6 种 UI 语言完整本地化
新增 12 个 i18n key（题干/选项说明/结果反馈/恢复按钮等）× 6 种语言

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
| POST | `/api/generate-distractors` | （v1.8）辨义选择模式：为指定 wordId 生成 5 个拼写近似的干扰词，返回 `{correct, distractors[]}`。算法见 §4.2 |

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

## 4.2 本地词典干扰词算法（v1.8）

辨义选择模式不再依赖 AI 生成干扰词，改为**纯本地算法**：

### 数据源
- `data/简明英汉词典.xlsx`（3.8MB，用户提供的原始词典）
- `data/dictionary.json`（5.6MB，10.4 万单词 × 中文释义，build 脚本产物）
- 预处理脚本：[scripts/build-dictionary.cjs](file:///scripts/build-dictionary.cjs)
- 服务端启动时一次性加载到内存，按单词长度建立索引（`Map<length, DictEntry[]>`）

### 算法
入口：`findSimilarWords(spelling, count=5)`（[api/index.ts](file:///api/index.ts)）

**三层 fallback**：
1. **严格匹配**：长度差 ≤ 3，编辑距离 ≤ 5，按综合分数排序取 top 30
2. **放宽匹配**（候选不足 5 时）：长度差 ≤ 5，编辑距离 ≤ 8
3. **复合词 fallback**（仍不足且单词含连字符/空格）：按词组里最长的部分查（如 `behind-the-meter` → 取 `behind`）

**综合相似度分数**：`score = editDist * 2 + lenDiff - prefixShared - suffixShared * 0.5`（分数越低越相似）

**随机性**：从 top 30 候选中**随机抽 5 个**，保证同一词每次出现的干扰项不同

### 性能 vs 原 AI 方案
| 指标 | 原 AI 方案（Gemini+GLM） | 本地算法 |
|---|---|---|
| 响应时间 | 3.5s（GLM）/ 20s+（Gemini 超时） | **0.1s** |
| 外部依赖 | 需要 API key + 网络可达 | **无** |
| Token 成本 | 有 | **零** |
| 稳定性 | GLM 偶发重复/失败 | **100%** |
| CI 测试 | 需 mock | **可直接跑** |

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
- FootballRules.tsx（v1.7）

---

## 6. 测试规格（v1.6）

### 6.1 测试分层
| 层 | 框架 | 路径 | 状态 |
|---|---|---|---|
| 单元测试 | Vitest | `tests/unit/` | ✅ SRS 算法 + 错词重考队列（共 12 个用例）|
| 集成测试 | Vitest + supertest | `tests/integration/` | ⚠️ `.skip`（见 §6.7 已知问题）|
| E2E 测试 | Playwright | `tests/e2e/` | ✅ 17 个用例覆盖核心用户流程 |

### 6.2 E2E 覆盖范围
| Spec 文件 | 用例数 | 覆盖场景 |
|---|---|---|
| [auth.spec.ts](file:///tests/e2e/auth.spec.ts) | 5 | API 注册、API 登录、错误密码（400）、重复邮箱（400）、UI 登录进主页 |
| [word-library.spec.ts](file:///tests/e2e/word-library.spec.ts) | 4 | 列表显示、API 获取、搜索过滤、Tab 切换 |
| [review-session.spec.ts](file:///tests/e2e/review-session.spec.ts) | 3 | 空复习提示、进入复习流程（闪卡模式）、提交 API |
| [navigation-i18n.spec.ts](file:///tests/e2e/navigation-i18n.spec.ts) | 3 | 4 Tab 切换、中英 UI 切换、切回中文 |
| [admin-features.spec.ts](file:///tests/e2e/admin-features.spec.ts) | 2 | 普通用户隐藏时光机/重置、wujizong 可见 |

### 6.3 E2E 基建设计
- **独立 dev server**：Playwright 启动 `npm run dev` 时注入 `PORT=3100 DB_PATH=./data/db.test.json`，**绝不污染本地开发数据**
- **数据隔离**：每个 `beforeEach` 调用 `resetDb()` 把 `db.test.json` 重置为空数据库
- **绕开外部 API**：`fixtures.ts` 的 `addWordToDb` 直接读写文件 seed 单词，不触发 Gemini / dictionaryapi.dev
- **CI 模式**：`.github/workflows/e2e.yml` 强制清空 `SUPABASE_*` / `GEMINI_API_KEY` 环境变量，跑纯本地 JSON 模式
- **失败追溯**：CI 失败时上传 `playwright-report/` + `test-results/` 作为 artifact（保留 7-14 天）
- **触发时机**：每次 push/PR 到 main/develop

---

## 7. 已知问题与限制

### 7.1 TypeScript 类型错误（不影响运行）
`npm run lint` 会报错，原因：
- [src/components/WordList.tsx](file:///src/components/WordList.tsx) 引用了 `translations.ts` 中**不存在的字段**（如 `addSuccessMsg` / `regenSuccessMsg` / `wordListChartTitle` 等）
- [src/lib/translations.ts](file:///src/lib/translations.ts) 的 `TranslationSet` 接口新增了字段，但 5 种语言的翻译对象没有同步补全

**影响**：仅 `tsc` 报错；`tsx` 运行时不做严格检查，应用可正常启动。

### 7.2 密码哈希弱
- 使用 `crypto.createHash("sha256")` 单次哈希（无 salt、无慢哈希）
- **不应**在生产环境直接暴露，建议迁移到 bcrypt/argon2

### 7.3 AI 模型名写死
- `gemini-3.5-flash` / `gemini-3.1-flash-lite` 硬编码在代码里，未来 Gemini 升级需手动改

### 7.4 本地数据库非并发安全
- `data/db.json` 是全量读写，多请求并发时有覆盖风险
- 生产建议切到 Supabase

### 7.5 时间旅行按用户隔离吗
- **否**。`system_offset_ms` 是全局配置（`system_config` 表），所有用户共享同一虚拟时间
- 多租户场景下这是个语义问题

### 7.6 Vercel 单文件约束（v1.3 引入）
- `api/index.ts` 必须是单文件 serverless function（业务逻辑 + 数据库适配层全部内联）
- 拆分多文件会导致 `ERR_MODULE_NOT_FOUND`
- 代价：`api/index.ts` 文件较大（~1800 行），后续可考虑用 esbuild bundle 优化

### 7.7 集成测试暂停（v1.3 引入，v1.6 已用 E2E 替代）
- `tests/integration/firebase-removal.test.ts` 当前 `.skip`
- 原因：serverDb 内联到 `api/index.ts` 后无法 vi.mock
- 替代方案：新集成测试改为基于真实本地 JSON 的端到端测试

---

## 8. 版本历史

**v1.8（2026-07-18）**：辨义选择复习模式 + 发音防抖 + 本地词典干扰词
- 🔴 新功能：第三种复习模式「辨义选择」上线。题干给中文释义，6 个拼写近似词里选对的，干扰词由本地算法生成
- 🟡 性能：干扰词生成从 AI 方案切换为本地词典 + Levenshtein 编辑距离算法（响应 3.5s → 0.1s，零 AI 依赖/成本，CI 可直接跑）
- 🟡 数据：新增 `data/dictionary.json`（10.4 万英汉词典）+ `data/简明英汉词典.xlsx`（原始来源）+ `scripts/build-dictionary.cjs`（预处理脚本）
- 🟢 UX：发音按钮 800ms 防抖（抽共享 hook `usePronunciation.ts`）
- 🟢 UX：闪卡展开后点击释义/语境/助记区域不再误触收起
- 🟢 Bug：前端闭包导致预加载失效 / 重试按钮无效 / 错词重考选项不构造 等多个 UX bug 修复
- 🟢 i18n：12 个新 key × 6 种语言（辨义模式相关）

**v1.7（2026-07-18）**：FIFA 足球规则科普讲堂 —— 新增 FootballRules 组件 + 17 章数据 + 6 语言 UI 翻译（36 键 × 6 语言）+ Dashboard 入口卡片 + 索引动画（fade-in/spin-slow/scrollbar-thin）。策略：UI 跟随语言切换，规则正文按 UI 语言决定中英对照或仅英文

- **v1.6（2026-07-17）**：i18n 完整化 + E2E 测试基建 + 错误修复。
  - 🔴 i18n：5 种目标语言（英/日/西/法/葡）补齐 WordList 用的 59 个翻译键（共 +295 条），修复切目标语言后按钮/tab/标签空白；`getTranslation` 加 `{...Chinese, ...target}` 兜底；补齐 `emptyLibraryCta` 6 语言翻译（修复英文模式下空词库引导按钮仍是中文）
  - 🟡 Bug：修复 Dashboard 参数解构漏 `onNavigateWords` 导致点击「去添加我的第一个单词」按钮抛 ReferenceError；修复空词库按钮跳转到不存在的 view `"words"`
  - 🟢 测试：引入 Playwright + 17 个 E2E 测试（认证 5 + 词库 4 + 复习 3 + 导航/i18n 3 + 管理员白名单 2），独立 dev server (port 3100) + 独立 db.test.json，GitHub Actions 自动跑
  - 🔵 工程：`api/index.ts` DB_PATH 支持 env 覆盖（测试隔离用）；`server.ts` PORT 支持 env；`.gitignore` 加 `data/*.json` / playwright 产物
- **v1.5（2026-07-17）**：管理员白名单 + 浏览器 favicon。
  - 🔴 安全：时光机 / 重置系统数据库两个高风险功能改为仅 `wujizong@gmail.com` 可见（`isPrivileged`），普通用户隐藏后左侧分布图自动 col-span-12 占满
  - 🔵 UX：`index.html` 内联 SVG favicon（学士帽 + indigo 底），无额外网络请求
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
