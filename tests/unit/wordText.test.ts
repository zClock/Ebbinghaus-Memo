/**
 * 单元测试：短语支持（v1.10）的词条文本纯函数
 */

import { describe, it, expect } from "vitest";
import {
  isPhrase,
  normalizeForSpellingCompare,
  maskSpelling,
  parseWords,
} from "../../src/lib/wordText";

describe("isPhrase（含空格即短语）", () => {
  it("单词 → false", () => {
    expect(isPhrase("apple")).toBe(false);
  });

  it("短语 → true", () => {
    expect(isPhrase("give up")).toBe(true);
    expect(isPhrase("room for improvement")).toBe(true);
  });

  it("首尾空白不误判（trim 后判定）", () => {
    expect(isPhrase("  spaced out  ")).toBe(true);
    expect(isPhrase("   apple   ")).toBe(false);
  });

  it("连字符复合词不算短语", () => {
    expect(isPhrase("state-of-the-art")).toBe(false);
  });

  it("日语词无空格 → false", () => {
    expect(isPhrase("食べる")).toBe(false);
  });

  it("全角空格（U+3000）也算短语", () => {
    expect(isPhrase("単語　テスト")).toBe(true);
  });
});

describe("normalizeForSpellingCompare（拼写宽松比对归一化）", () => {
  it("忽略大小写、首尾空白与内部多余空格", () => {
    expect(normalizeForSpellingCompare("  Room   For Improvement "))
      .toBe(normalizeForSpellingCompare("room for improvement"));
  });

  it("剥尾部标点、保留内部撇号", () => {
    expect(normalizeForSpellingCompare("Don't!")).toBe("don't");
  });

  it("剥 CJK 首尾标点", () => {
    expect(normalizeForSpellingCompare("「word」。")).toBe("word");
  });

  it("负例：漏打空格不算对", () => {
    expect(normalizeForSpellingCompare("roomfor"))
      .not.toBe(normalizeForSpellingCompare("room for"));
  });
});

describe("maskSpelling（保留词边界的掩码）", () => {
  it("单词行为与旧实现完全一致（回归锚点）", () => {
    expect(maskSpelling("apple")).toBe("a____");
  });

  it("短语保留空格且每个词保留首字母", () => {
    expect(maskSpelling("give up")).toBe("g___ u_");
    expect(maskSpelling("room for improvement")).toBe("r___ f__ i__________");
  });

  it("返回长度与输入严格相等（例句挖空替换依赖此约束）", () => {
    for (const s of ["apple", "give up", "room for improvement", "state-of-the-art", "単語　テスト"]) {
      expect(maskSpelling(s).length).toBe(s.length);
    }
  });

  it("边界：空串与单字符", () => {
    expect(maskSpelling("")).toBe("");
    expect(maskSpelling("a")).toBe("a");
  });
});

describe("parseWords（批量导入解析：空格不再是分隔符）", () => {
  it("逗号/分号分隔的单词条目仍正常", () => {
    expect(parseWords("apple,banana;cherry")).toEqual(["apple", "banana", "cherry"]);
  });

  it("核心：换行分隔的短语保持完整、不被空格拆散", () => {
    expect(parseWords("give up\npiece of cake")).toEqual(["give up", "piece of cake"]);
  });

  it("同一行内逗号分隔的短语与单词混合", () => {
    expect(parseWords("give up, apple")).toEqual(["give up", "apple"]);
  });

  it("内部撇号保留（don't 不被剥成 dont）", () => {
    expect(parseWords("don't, it's")).toEqual(["don't", "it's"]);
  });

  it("首尾标点/引号剥除", () => {
    expect(parseWords("word.")).toEqual(["word"]);
    expect(parseWords("'quoted'")).toEqual(["quoted"]);
  });

  it("条目内部连续空格归一", () => {
    expect(parseWords("multiple   spaces")).toEqual(["multiple spaces"]);
  });

  it("连字符复合词原样保留", () => {
    expect(parseWords("State-of-the-Art")).toEqual(["State-of-the-Art"]);
  });

  it("全角逗号/分号同样作为分隔符", () => {
    expect(parseWords("苹果，香蕉；give up")).toEqual(["苹果", "香蕉", "give up"]);
  });

  it("空输入 → 空数组", () => {
    expect(parseWords("")).toEqual([]);
    expect(parseWords("  \n\n  ")).toEqual([]);
  });
});
