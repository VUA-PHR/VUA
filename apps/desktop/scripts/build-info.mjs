// 构建信息注入(Phase A1):vite define 的唯一事实源。
// version 取 apps/desktop/package.json(与 app-meta.ts 同源发布流程核对);
// commit/dirty 取构建时 git 事实——无 .git 环境(源码包)如实回退 unknown。
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(desktopRoot, "package.json"), "utf8"));

function git(args) {
  try {
    return execFileSync("git", args, { cwd: desktopRoot, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const commit = git(["rev-parse", "--short", "HEAD"]) || "unknown";
// 未跟踪文件不算脏(_local_* 系本地草稿),只认受跟踪文件的改动
const dirty = git(["status", "--porcelain", "--untracked-files=no"]) !== "";

export const buildInfo = {
  version: pkg.version,
  commit,
  dirty,
  builtAt: new Date().toISOString(),
};
