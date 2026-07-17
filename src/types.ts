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
