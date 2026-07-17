/**
 * 单元测试：复习会话错词重考队列语义
 */

import { describe, it, expect } from "vitest";
import { markIncorrect, markCorrect, nextRoundAfterRoundEnd, QueueWord } from "../../src/lib/reviewQueue";

const w = (id: string, spelling?: string): QueueWord => ({ id, spelling: spelling ?? id });

describe("错词重考队列语义", () => {
  describe("markIncorrect（答错）", () => {
    it("空队列 → 加入", () => {
      const result = markIncorrect([], w("a", "apple"));
      expect(result.map(x => x.id)).toEqual(["a"]);
    });

    it("已存在的词不重复加入（修复的核心 bug）", () => {
      const queue = [w("a"), w("b")];
      const result = markIncorrect(queue, w("a"));
      expect(result.map(x => x.id)).toEqual(["a", "b"]);
      expect(result.length).toBe(2);
    });

    it("新词追加到末尾，保持原顺序", () => {
      const queue = [w("a"), w("b")];
      const result = markIncorrect(queue, w("c"));
      expect(result.map(x => x.id)).toEqual(["a", "b", "c"]);
    });

    it("同一词连续答错两次，队列只出现一次", () => {
      let queue: QueueWord[] = [];
      queue = markIncorrect(queue, w("x"));
      queue = markIncorrect(queue, w("x"));
      queue = markIncorrect(queue, w("x"));
      expect(queue.length).toBe(1);
    });
  });

  describe("markCorrect（答对时清理）", () => {
    it("从队列中移除指定词", () => {
      const queue = [w("a"), w("b"), w("c")];
      const result = markCorrect(queue, "b");
      expect(result.map(x => x.id)).toEqual(["a", "c"]);
    });

    it("词不在队列中时为空操作", () => {
      const queue = [w("a"), w("b")];
      const result = markCorrect(queue, "z");
      expect(result.map(x => x.id)).toEqual(["a", "b"]);
    });

    it("上一轮答错、本轮答对 → 词从重考队列移除", () => {
      // 第一轮：x 答错
      let queue: QueueWord[] = [];
      queue = markIncorrect(queue, w("x", "apple"));
      // 第二轮重考前：[x]
      expect(queue.map(q => q.id)).toEqual(["x"]);
      // 第二轮：x 答对 → 移除
      queue = markCorrect(queue, "x");
      expect(queue.length).toBe(0);
    });
  });

  describe("nextRoundAfterRoundEnd（轮次切换）", () => {
    it("错词队列非空 → 开始新一轮，轮次+1，下一轮队列=错词队列", () => {
      const incorrectQueue = [w("a"), w("c")];
      const result = nextRoundAfterRoundEnd(incorrectQueue, 1);
      expect(result.finished).toBe(false);
      if (!result.finished) {
        expect(result.nextRound).toBe(2);
        expect(result.nextActiveQueue.map(x => x.id)).toEqual(["a", "c"]);
      }
    });

    it("错词队列为空 → 会话结束", () => {
      const result = nextRoundAfterRoundEnd([], 3);
      expect(result.finished).toBe(true);
    });
  });

  describe("端到端：无限重考至全对（需求契约）", () => {
    it("3 个词，第1轮全错 → 第2轮再答对 2 个 → 第3轮只重考剩下的 1 个 → 答对 → 结束", () => {
      let incorrect: QueueWord[] = [];
      const words = [w("a"), w("b"), w("c")];

      // 第 1 轮：三个全错
      for (const word of words) incorrect = markIncorrect(incorrect, word);
      let r1 = nextRoundAfterRoundEnd(incorrect, 1);
      expect(r1.finished).toBe(false);
      expect(!r1.finished && r1.nextActiveQueue.length).toBe(3);
      // 进入第 2 轮前清空 incorrect（与组件 setIncorrectQueue([]) 一致）
      incorrect = [];

      // 第 2 轮：用第 2 轮的 activeQueue（即 a,b,c）作答
      const round2Queue = !r1.finished ? r1.nextActiveQueue : [];
      for (const word of round2Queue) {
        if (word.id === "a" || word.id === "b") {
          // a, b 答对 —— 由于本词在本轮已不再标错，无需调用 markCorrect
        } else {
          // c 仍错
          incorrect = markIncorrect(incorrect, word);
        }
      }
      let r2 = nextRoundAfterRoundEnd(incorrect, 2);
      expect(r2.finished).toBe(false);
      expect(!r2.finished && r2.nextActiveQueue.map(x => x.id)).toEqual(["c"]);
      incorrect = [];

      // 第 3 轮：c 答对
      // 不再加入 incorrect
      let r3 = nextRoundAfterRoundEnd(incorrect, 3);
      expect(r3.finished).toBe(true);
    });

    it("重复答错同一词不会导致队列膨胀（核心 bug 回归测试）", () => {
      let incorrect: QueueWord[] = [];
      // 模拟组件 bug 场景：5 次答错同一个词
      for (let i = 0; i < 5; i++) {
        incorrect = markIncorrect(incorrect, w("hard_word"));
      }
      expect(incorrect.length).toBe(1); // 修复后：只会出现 1 次
    });
  });
});
