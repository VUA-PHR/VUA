/**
 * forest 零泄漏机械门(proposal 019 红线,019 批 D 交付面·AC-12 前置):
 * 森林绿 Figma 源码在仓库外,任何适配不得复制入 git;树内新 UI 代码仅限
 * gitignore 已登记的 `apps/desktop/src/ui-variants/forest/`(本地路径,
 * 永不提交)。本门把「推送 origin 前 3 轮 Reviewer 审阅必须含 forest 零
 * 泄漏核查」中的机械部分固化为常驻检查:
 *  1) git ls-files 断言 ui-variants/ 下零已跟踪文件(任何 force-add 即红);
 *  2) git check-ignore 断言 gitignore 登记有效(目录路径确被忽略,登记被
 *     删即红)。
 * 内容级零泄漏审阅(样式指纹/固定作品)仍属推送门 r2 人工程序,本门不替代;
 * 静态 import 引用安全由 typecheck/build 自身强制(干净检出缺模块即红)。
 * 纯 git 查询,无构建,随时可跑;干净检出(目录不存在)恒绿。
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const desktopRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = execFileSync("git", ["-C", desktopRoot, "rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const forestPath = "apps/desktop/src/ui-variants/forest";

let violations = 0;

// 1) 零已跟踪文件
const tracked = execFileSync("git", ["-C", repoRoot, "ls-files", "--", forestPath], {
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0);
if (tracked.length > 0) {
  violations += tracked.length;
  for (const file of tracked) console.error(`[tracked] ${file}`);
}

// 2) gitignore 登记有效(check-ignore -q:exit 0 = 被忽略,exit 1 = 未被
// 忽略;目录尾斜杠形态对不存在的目录同样可判——实测 exit 0;非零退出经
// execFileSync 抛出,捕获即登记缺失/失效)
let ignored = true;
try {
  execFileSync("git", ["-C", repoRoot, "check-ignore", "-q", "--", `${forestPath}/`], {
    stdio: "ignore",
  });
} catch {
  ignored = false;
}
if (!ignored) {
  violations += 1;
  console.error(`[gitignore] ${forestPath}/ 未被忽略(.gitignore 登记缺失或失效)`);
}

if (violations > 0) {
  console.error(
    `\ncheck-forest-leak: ${violations} 处违规——forest 源码不得进入 git(019 红线);` +
      `树内适配仅限 ${forestPath}/(gitignored 本地路径)`,
  );
  process.exit(1);
}
console.log("check-forest-leak: 通过(零已跟踪文件＋gitignore 登记有效)");
