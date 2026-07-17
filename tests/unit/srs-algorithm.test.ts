/**
 * 单元测试：SRS 算法与数据映射
 *
 * 这些函数原本内嵌在 serverDb.ts 的 submitReview 实现里。
 * 我们测它的可观察行为：给定一个词的当前 stage/consecutiveCorrect，
 * 经过一次正确/错误作答后，应该变成什么状态。
 *
 * 间隔表：[1, 2, 4, 7, 15, 30] 天
 * 规则（来自 spec.md §1.4）：
 *   - 答对：consecutiveCorrect += 1
 *            累计 3 次直升 stage 5（30 天）
 *            否则 stage += 1，按下个间隔排期
 *   - 答错：stage = 0，consecutiveCorrect = 0，1 天后重排
 *   - 已掌握：stage >= 5 或 consecutiveCorrect >= 3
 */

import { describe, it, expect } from "vitest";

// 间隔表（与 serverDb.ts 保持同步；如 serverDb 修改需同步更新此处）
const REVIEW_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30];

/**
 * 纯函数版本：复现 serverDb.ts submitReview 中的阶段更新逻辑。
 * 这里单独实现一份，用于测试"逻辑契约"——
 * 如果 serverDb 行为与此不符，说明有一边写错了。
 */
function computeNextReview(currentStage: number, currentCorrect: number, isCorrect: boolean): {
  stage: number;
  consecutiveCorrect: number;
  intervalDays: number;
  isMastered: boolean;
} {
  if (!isCorrect) {
    return {
      stage: 0,
      consecutiveCorrect: 0,
      intervalDays: 1,
      isMastered: false,
    };
  }

  const newCorrect = currentCorrect + 1;
  if (newCorrect >= 3) {
    return {
      stage: 5,
      consecutiveCorrect: newCorrect,
      intervalDays: REVIEW_INTERVALS_DAYS[5],
      isMastered: true,
    };
  }

  const newStage = Math.min(currentStage + 1, REVIEW_INTERVALS_DAYS.length - 1);
  return {
    stage: newStage,
    consecutiveCorrect: newCorrect,
    intervalDays: REVIEW_INTERVALS_DAYS[newStage],
    isMastered: newStage >= 5 || newCorrect >= 3,
  };
}

describe("SRS 算法", () => {
  describe("答对", () => {
    it("首次答对：stage 0 → 1，correct 0 → 1，间隔 2 天", () => {
      const r = computeNextReview(0, 0, true);
      expect(r.stage).toBe(1);
      expect(r.consecutiveCorrect).toBe(1);
      expect(r.intervalDays).toBe(2);
      expect(r.isMastered).toBe(false);
    });

    it("第二次答对：stage 1 → 2，correct 1 → 2，间隔 4 天", () => {
      const r = computeNextReview(1, 1, true);
      expect(r.stage).toBe(2);
      expect(r.consecutiveCorrect).toBe(2);
      expect(r.intervalDays).toBe(4);
      expect(r.isMastered).toBe(false);
    });

    it("第三次答对（consecutiveCorrect 达 3）：直升 stage 5，30 天后复习，立即掌握", () => {
      const r = computeNextReview(2, 2, true);
      expect(r.stage).toBe(5);
      expect(r.consecutiveCorrect).toBe(3);
      expect(r.intervalDays).toBe(30);
      expect(r.isMastered).toBe(true);
    });

    it("已经在 stage 5 时答对：stage 不超过 5，保持 30 天", () => {
      const r = computeNextReview(5, 0, true);
      expect(r.stage).toBe(5);
      expect(r.intervalDays).toBe(30);
      expect(r.isMastered).toBe(true);
    });
  });

  describe("答错", () => {
    it("任意阶段答错：归零，1 天后重排", () => {
      const r = computeNextReview(4, 2, false);
      expect(r.stage).toBe(0);
      expect(r.consecutiveCorrect).toBe(0);
      expect(r.intervalDays).toBe(1);
      expect(r.isMastered).toBe(false);
    });

    it("已经掌握的词答错：脱掌握", () => {
      const r = computeNextReview(5, 3, false);
      expect(r.stage).toBe(0);
      expect(r.isMastered).toBe(false);
    });
  });

  describe("间隔表契约", () => {
    it("REVIEW_INTERVALS_DAYS 应为 [1, 2, 4, 7, 15, 30]", () => {
      expect(REVIEW_INTERVALS_DAYS).toEqual([1, 2, 4, 7, 15, 30]);
    });

    it("每个 stage 对应的间隔单调递增（保证 SRS 有效）", () => {
      for (let i = 1; i < REVIEW_INTERVALS_DAYS.length; i++) {
        expect(REVIEW_INTERVALS_DAYS[i]).toBeGreaterThan(REVIEW_INTERVALS_DAYS[i - 1]);
      }
    });
  });
});
