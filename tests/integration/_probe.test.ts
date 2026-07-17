import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("probe", () => {
  it("logs cwd and db state", async () => {
    const cwd = process.cwd();
    const logPath = path.join(cwd, "tests/integration/_probe.log");
    const lines: string[] = [`CWD: ${cwd}`];
    lines.push(`DB exists: ${fs.existsSync(path.join(cwd, "data", "db.json"))}`);
    if (fs.existsSync(path.join(cwd, "data", "db.json"))) {
      const c = fs.readFileSync(path.join(cwd, "data", "db.json"), "utf8");
      lines.push(`DB first 200: ${c.slice(0, 200)}`);
    }
    fs.writeFileSync(logPath, lines.join("\n"));
    expect(true).toBe(true);
  });
});
