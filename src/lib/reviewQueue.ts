/**
 * 复习会话中"错词重考队列"的纯函数。
 *
 * 这里的语义被 ReviewSession.tsx 中的 setIncorrectQueue 调用所使用，
 * 抽出来是为了单元测试 —— 在组件内是闭包 setState，难以直接测。
 *
 * 规则：
 *   - 答错 → 加入重考队列（去重，保持原顺序）
 *   - 答对 → 从重考队列移除（上一轮答错、本轮答对的场景）
 */

export interface QueueWord {
  id: string;
  spelling: string;
  [k: string]: unknown;
}

/**
 * 将一个词加入错词队列；若已存在则不重复加入（按 id 去重，保持原顺序）。
 */
export function markIncorrect<T extends QueueWord>(queue: T[], word: T): T[] {
  if (queue.some(w => w.id === word.id)) return queue;
  return [...queue, word];
}

/**
 * 将一个词从错词队列移除（按 id）。用于答对时清理可能的旧标记。
 */
export function markCorrect<T extends QueueWord>(queue: T[], wordId: string): T[] {
  return queue.filter(w => w.id !== wordId);
}

/**
 * 一轮结束后，决定下一轮的队列与是否结束。
 *   - 若错词队列非空：以错词队列作为下一轮 activeQueue，轮次 +1
 *   - 否则：会话结束
 */
export function nextRoundAfterRoundEnd<T extends QueueWord>(
  incorrectQueue: T[],
  currentRound: number,
): { finished: true; nextActiveQueue: T[]; nextRound: number } | {
  finished: false;
  nextActiveQueue: T[];
  nextRound: number;
} {
  if (incorrectQueue.length > 0) {
    return { finished: false, nextActiveQueue: [...incorrectQueue], nextRound: currentRound + 1 };
  }
  return { finished: true, nextActiveQueue: [], nextRound: currentRound };
}
