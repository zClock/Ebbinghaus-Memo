// 一次性脚本：把 data/简明英汉词典.xlsx 转成 data/dictionary.json
// 用法：node scripts/build-dictionary.js
// 输出格式：[{w: "word", d: "definition"}, ...]（按字母序，纯 ASCII 小写归一化）

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "data", "简明英汉词典.xlsx");
const DST = path.join(__dirname, "..", "data", "dictionary.json");

console.log("Reading xlsx:", SRC);
const wb = XLSX.readFile(SRC);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log(`Total rows: ${rows.length}`);

const dict = [];
const seen = new Set();
for (const row of rows) {
  if (!Array.isArray(row) || row.length < 2) continue;
  const word = String(row[0] || "").trim().toLowerCase();
  const definition = String(row[1] || "").trim();
  if (!word || !definition) continue;
  // 跳过含空格/连字符的多词短语（只保留单词）
  if (/\s/.test(word)) continue;
  if (seen.has(word)) continue;
  seen.add(word);
  dict.push({ w: word, d: definition });
}

// 按字母序排序（便于后续二分查找/范围查询）
dict.sort((a, b) => a.w < b.w ? -1 : a.w > b.w ? 1 : 0);

console.log(`Unique single words: ${dict.length}`);
console.log("Sample:", JSON.stringify(dict.slice(0, 3)));
console.log("Writing:", DST);
fs.writeFileSync(DST, JSON.stringify(dict), "utf8");
const sizeKB = Math.round(fs.statSync(DST).size / 1024);
console.log(`Done. File size: ${sizeKB} KB`);
