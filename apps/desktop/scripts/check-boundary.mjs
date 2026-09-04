/**
 * Gateway 边界验收(G3):
 * src/gateway/ 之外的业务代码只允许经 barrel(src/gateway/index.ts)引用
 * Gateway——端口类型、装配函数与 hooks 统一入口,禁止散引内部文件,
 * 保证 live 实现未来可整体替换、页面零重写。
 *
 * 扫描规则:
 * - 范围:src 目录下全部 .ts / .tsx 文件;
 * - 排除:src/gateway/ 内部文件、.test.ts 测试文件(可直接引用实现做契约测试);
 * - 命中形如 ../gateway/<非 index.ts> 的 import 即非零退出。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("../src/renderer", import.meta.url));
const exts = new Set([".ts", ".tsx"]);
// import 路径中以 /gateway/ 结尾于非 index.ts 的文件,如 "../../gateway/fixture-gateway.ts"
const forbiddenPattern = /from\s+["'][./]*gateway\/(?!index\.ts["'])[^"']+["']/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "gateway") continue;
      yield* walk(full);
    } else {
      if (!exts.has(full.slice(full.lastIndexOf(".")))) continue;
      if (entry.endsWith(".test.ts")) continue;
      yield full;
    }
  }
}

// Electron 边界(renderer):业务代码禁止引入 Electron/Node 宿主能力与
// Tauri 遗留;宿主交互只允许经 preload 注入的 window.vua 窄面。
const hostPattern = /from\s+["'](electron|node:[\w]+|@tauri-apps\/[\w-]+)["']/;

let violations = 0;
for (const file of walk(srcDir)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (!file.endsWith(".test.ts") && hostPattern.test(line)) {
      violations += 1;
      console.error(`${relative(srcDir, file)}:${index + 1}  [host] ${line.trim()}`);
      return;
    }
    if (forbiddenPattern.test(line)) {
      violations += 1;
      console.error(`${relative(srcDir, file)}:${index + 1}  ${line.trim()}`);
    }
  });
}

if (violations > 0) {
  console.error(
    `\ncheck-boundary: ${violations} 处越界引用(Gateway 只允许经 barrel 引入;renderer 禁止 electron/node:/@tauri-apps)`,
  );
  process.exit(1);
}
console.log("check-boundary: OK — Gateway 引用全部经 barrel");
