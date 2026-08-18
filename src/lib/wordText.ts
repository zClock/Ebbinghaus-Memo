/**
 * 词条文本（spelling）的纯函数工具：短语支持（v1.10）。
 *
 * "短语" 的定义：spelling 含空格（含全角空格 U+3000）即视为短语，不加 type 字段。
 * 抽出来是为了单元测试 —— 这些逻辑分散在 WordList.tsx / ReviewSession.tsx 内难以直接测。
 *
 * 注意：全角空格 U+3000 归一为内部空格、不作为批量导入分隔符
 * （日语词典有 230 个含空格的语法句型条目依赖此行为）。
 */

/**
 * 判断词条是否为短语（含空格即短语；连字符复合词不算）。
 */
export function isPhrase(spelling: string): boolean {
  return /\s/.test(spelling.trim());
}

/**
 * 拼写测试的宽松比对归一化：
 * 去首尾空白 → 转小写 → 内部连续空格归一为一个 → 剥首尾标点/符号（Unicode 属性类，覆盖 CJK 标点）。
 * 内部的撇号（don't）与连字符（state-of-the-art）保留。
 */
export function normalizeForSpellingCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "");
}

/**
 * 拼写模式的掩码提示：按空格分词，每词保留首字符、其余替换为 "_"，空格原样保留。
 * "room for improvement" → "r___ f__ i___________"（用户能看到词数与词边界）。
 *
 * ⚠️ 必须保证返回长度与输入相等 —— ReviewSession 例句挖空的替换循环按原文长度步进，
 * 掩码变长/变短会导致替换错位。
 */
export function maskSpelling(spelling: string): string {
  let result = "";
  // 词首（字符串开头或空格后的第一个字符）保留，其余非空格字符替换为 "_"
  let atWordStart = true;
  for (const ch of spelling) {
    if (/\s/.test(ch)) {
      result += ch;
      atWordStart = true;
    } else {
      result += atWordStart ? ch : "_";
      atWordStart = false;
    }
  }
  return result;
}

/**
 * 批量导入文本解析（从 WordList.tsx 抽出）：
 *   - 只按换行 / 半角逗号分号 / 全角逗号分号分割 —— 空格不再是分隔符，短语保持完整
 *   - 每段 trim → 内部连续空格归一 → 剥首尾非字母数字字符（内部撇号/连字符不在首尾，天然保留）
 *   - 不 lowercase、不去重（后端职责）
 */
export function parseWords(text: string): string[] {
  return text
    .split(/[\n,;，；]+/)
    .map(w =>
      w
        .trim()
        .replace(/\s+/g, " ")
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    )
    .filter(w => w.length > 0);
}
