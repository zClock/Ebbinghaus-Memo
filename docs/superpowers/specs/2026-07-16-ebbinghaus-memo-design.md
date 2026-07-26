# 艾宾浩斯智能单词记忆应用 (Ebbinghaus Memo) 设计规格说明书

本设计文档旨在规范“Ebbinghaus Memo”全栈单词记忆 Web 应用的技术架构、数据库设计、核心记忆算法及前端交互逻辑。

---

## 1. 技术栈与架构设计

应用采用 **Next.js 单体全栈架构**，便于快速开发、私有化部署，并保留未来扩展为多用户系统的能力。

* **前端框架**：Next.js (React) + Tailwind CSS + TypeScript
* **后端 API**：Next.js 内置 API Routes (App Router / Route Handlers)
* **数据库**：SQLite（本地文件型数据库，适合单用户私有部署）
* **ORM 框架**：Prisma ORM
* **第三方接口**：免费字典 API (例如 `api.dictionaryapi.dev`)，用于自动获取音标、中文翻译、例句和发音音频。

---

## 2. 数据库设计 (Database Schema)

基于 Prisma ORM 规范定义的 SQLite 数据库表结构：

```prisma
// datasource 和 generator 配置
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

// 1. 用户表（兼容未来多用户扩展，目前默认使用单一账户）
model User {
  id        String   @id @default("default-user-id")
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  words     Word[]
}

// 2. 单词表
model Word {
  id                 String          @id @default(uuid())
  spelling           String          // 单词拼写，如 "apple"
  phonetic           String?         // 音标，如 "/ˈæpl/"
  definition         String          // 中文释义
  example            String?         // 例句
  audioUrl           String?         // 发音音频链接
  userId             String          @default("default-user-id")
  user               User            @relation(fields: [userId], references: [id])
  createdAt          DateTime        @default(now()) // 录入时间
  
  // 艾宾浩斯状态参数
  reviewStage        Int             @default(0)     // 当前处于第几阶段 (0-6)
  consecutiveCorrect Int             @default(0)     // 连续“首通一次性正确”的次数
  lastResetAt        DateTime        @default(now()) // 上一次重置或录入的基准时间
  nextReviewAt       DateTime        // 下一次理论复习日期
  
  histories          ReviewHistory[]
}

// 3. 复习历史记录表
model ReviewHistory {
  id         String   @id @default(uuid())
  wordId     String
  word       Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
  stage      Int      // 复习阶段 (0 到 5)
  reviewedAt DateTime @default(now())
  isCorrect  Boolean  // 在拼写模式下是否拼写正确 / 闪卡模式下是否“记住了”
}
```

---

## 3. 艾宾浩斯复习算法 (SRS Algorithm)

系统采用定制化的艾宾浩斯遗忘曲线复习间隔：
* 阶段 0 -> 阶段 1：**+1 天**
* 阶段 1 -> 阶段 2：**+2 天**
* 阶段 2 -> 阶段 3：**+4 天**
* 阶段 3 -> 阶段 4：**+7 天** （普通模式）
* 阶段 4 -> 阶段 5：**+15 天**（普通模式）
* 阶段 5 -> 阶段 6：**+30 天**（全回归复习阶段）

### 3.1 晋级与隐藏机制 (核心规则)
为了避免对熟练单词的过度复习，引入**“已掌握”快速通道**：
1. **晋级判定**：若单词在复习中**连续 3 次首通一次性正确**（即 `consecutiveCorrect >= 3`），状态立即变更为“已掌握”。
2. **跃迁动作**：系统自动将该词的阶段跳转到 `reviewStage = 5`（对应第 6 轮全回归），并将 `nextReviewAt` 设为 `lastResetAt + 30天`。
3. **隐藏效果**：由于跳转，第 4 轮 (+7 天) 和第 5 轮 (+15 天) 的复习列表中将**完全不出现**该单词。
4. **全回归复习**：直到第 30 天，该单词的 `nextReviewAt` 到期，重新回归到今日待复习列表中。

### 3.2 惩罚/重置机制
若任何阶段的单词在复习会话中**第一轮尝试失败**（没记住或拼写错误）：
* `reviewStage` 重置为 `0`
* `consecutiveCorrect` 重置为 `0`
* `lastResetAt` 更新为 `当天`
* `nextReviewAt` 更新为 `明天 (当天 + 1天)`

---

## 4. 前端交互与复习循环设计

复习界面采用 **“错词循环复习法”** 保证学习效果。

### 4.1 会话内队列机制 (前端内存管理)
* **输入数据**：今日待复习的单词列表 `dueWords`。
* **复习模式**：闪卡模式 (Flashcard) 或 拼写测试 (Spelling Test)。
* **内存变量**：
  * `activeQueue` (初始化为 `[...dueWords]`)
  * `incorrectQueue` (初始化为 `[]`)
  * `firstTryFailures` (初始化为 `new Set()`)

* **循环逻辑**：
  1. 依次处理 `activeQueue` 中的单词：
     - 若答对：顺利通过，进入下一个词。
     - 若答错：提示正确答案；将单词 ID 添加至 `firstTryFailures`；将单词加入 `incorrectQueue`。
  2. 当 `activeQueue` 清空，检查 `incorrectQueue`：
     - 若不为空，令 `activeQueue = [...incorrectQueue]`，并清空 `incorrectQueue`，开启新一轮循环复习。
     - 若为空，表示全部通过，复习会话结束。

### 4.2 数据提交
会话结束后，前端向后台发送一次性请求 `POST /api/review/submit`，格式如下：
```json
{
  "results": [
    { "wordId": "uuid-1", "firstTryCorrect": true },
    { "wordId": "uuid-2", "firstTryCorrect": false }
  ]
}
```

---

## 5. 后台 API 路由设计

* `POST /api/words/create`：录入新单词。
  * 参数：`{ "spelling": "banana" }`
  * 逻辑：后端调用免费字典 API 获取释义、音标、例句和发音音频，并保存至数据库。初始化阶段为 `0`，`nextReviewAt` 为明天。
* `GET /api/words/due`：获取今日待复习单词列表。
  * 逻辑：查询 `nextReviewAt <= 当前时间` 且 `reviewStage < 6` 的所有单词。
* `POST /api/review/submit`：提交复习结果并批量更新单词状态。
* `GET /api/words`：获取全部单词（用于单词库列表，展示阶段和“已掌握”标记）。
* `DELETE /api/words/[id]`：删除某个单词。
