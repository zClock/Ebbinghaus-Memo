export interface User {
  id: string;
  email: string;
  name: string;
  dailyGoal: number;
  level: string;
  createdAt: string;
}

export interface Word {
  id: string;
  userId?: string;
  spelling: string;
  phonetic?: string;
  definition: string;
  example?: string;
  exampleTranslation?: string;
  mnemonic?: string;
  audioUrl?: string;
  createdAt: string; // ISO date string
  
  // Ebbinghaus state parameters
  reviewStage: number; // 0 to 6. 6 represents complete mastery / fully learned
  consecutiveCorrect: number; // consecutive correct on first try
  lastResetAt: string; // ISO date string of the last review or reset
  nextReviewAt: string; // ISO date string when the word is due next
}

export interface ReviewHistory {
  id: string;
  wordId: string;
  stage: number;
  reviewedAt: string; // ISO date string
  isCorrect: boolean;
}

export interface ReviewResult {
  wordId: string;
  firstTryCorrect: boolean;
}

export interface WordStats {
  totalWords: number;
  dueTodayCount: number;
  masteredCount: number; // stage >= 5 or consecutiveCorrect >= 3
  stageDistribution: number[]; // size 7 (0-6)
}

// ===== 学习计划（周计划）相关类型 =====

/**
 * 任务类型 ID（向后兼容历史硬编码 4 种内置类型）
 * - 内置：shortTask / reading / sports / language
 * - 自定义：由用户在「任务类型管理」中生成（如 type-1700000000000）
 */
export type TaskType = string;

/** 单条学习任务 */
export interface LearningTask {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  completed: boolean;
  /** 关联词库单词 ID 列表，支持一键拉起复习会话 */
  linkedWordIds?: string[];
}

/** 单日计划（周计划中的一天） */
export interface DayPlan {
  /**
   * 星期编号
   * - 0：Inbox 备忘灵感池
   * - 1~7：周一到周日
   */
  dayOfWeek: number;
  isRestDay: boolean;
  tasks: LearningTask[];
  /** 当日是否整体打卡完成 */
  completed: boolean;
}

/** 周计划 */
export interface LearningPlan {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "active" | "archived";
  /** 长度固定为 8：索引 0 是 Inbox，1-7 是周一到周日 */
  days: DayPlan[];
}
