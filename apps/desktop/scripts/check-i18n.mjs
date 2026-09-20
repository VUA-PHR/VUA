/**
 * i18n 预备验收(i18n 预备规则⑤):
 * 业务代码不得出现中文字面量——所有面向用户的字符串集中在
 * src/i18n/ 字符串表(en 为源语言),术语原形在 src/i18n/terms.ts。
 *
 * 扫描规则:
 * - 范围:src/renderer 目录下全部 .ts / .tsx / .css 文件;
 * - 排除:src/i18n/(字符串表与术语常量)、.test.ts 测试文件(可断言文案内容);
 * - 先剥离注释(注释不限语言),再检索汉字;命中即非零退出。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("../src/renderer", import.meta.url));
const exts = new Set([".ts", ".tsx", ".css"]);
const hanPattern = /[㐀-䶿一-鿿豈-﫿]/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "i18n") continue;
      yield* walk(full);
    } else {
      if (!exts.has(full.slice(full.lastIndexOf(".")))) continue;
      if (entry.endsWith(".test.ts")) continue;
      yield full;
    }
  }
}

/** 注释内容替换为等长空白,保留换行以维持行号 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));
}

let violations = 0;
for (const file of walk(srcDir)) {
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, index) => {
    if (hanPattern.test(line)) {
      violations += 1;
      console.error(`${relative(srcDir, file)}:${index + 1}  ${line.trim()}`);
    }
  });
}

if (violations > 0) {
  console.error(
    `\ncheck-i18n: ${violations} 处中文字面量违规(文案请迁入 src/i18n/ 字符串表,en 为源)`,
  );
  process.exit(1);
}
console.log("check-i18n: OK — renderer 汉字硬编码检查通过（不代表翻译语义或全部显示链路已验收）");
