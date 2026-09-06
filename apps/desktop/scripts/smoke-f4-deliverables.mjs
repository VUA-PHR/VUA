// F4 交付验收冒烟聚合(F4-8:隔离泄漏冒烟并入交付冒烟):
// 按序执行既有三条隔离/下载红线冒烟,聚合其退出码与证据位置——
// 1. remote-permissions(本地窗口隔离红线,M1 先例);
// 2. remote-content(隔离 WebContentsView 基座红线);
// 3. download-port(下载端口六事件规范化 + 策略拒绝)。
// 本脚本只聚合,不重写任何断言;证据仍由各冒烟自行写入
// (_local_m1 / _local_m4,.gitignore 排除),聚合摘要写入
// _local_m4/v<版本>/f4-deliverables-smoke.json。
// 前置:先完成 pnpm build(dist 产物就位;由 smoke:f4-deliverables 命令串联)。
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(desktopRoot, "..", "..");
const desktopPackage = JSON.parse(
  readFileSync(path.resolve(desktopRoot, "package.json"), "utf8"),
);
const productVersion = desktopPackage.version;
const evidenceDirectory = path.join(repositoryRoot, "_local_m4", `v${productVersion}`);
const aggregatePath = path.join(evidenceDirectory, "f4-deliverables-smoke.json");

const distMarker = path.join(desktopRoot, "dist", "electron", "main.js");
if (!existsSync(distMarker)) {
  console.error("smoke:f4-deliverables 缺少构建产物;先运行 pnpm build(命令已串联则不应出现)");
  process.exit(1);
}

const steps = [
  { name: "remote-permissions", script: "scripts/smoke-remote-permissions.mjs" },
  { name: "remote-content", script: "scripts/smoke-remote-content.mjs" },
  { name: "download-port", script: "scripts/smoke-download-port.mjs" },
];

const results = [];
let failed = false;
for (const step of steps) {
  const startedAt = new Date().toISOString();
  let exitCode = 0;
  try {
    execSync(`pnpm exec electron ${step.script}`, {
      cwd: desktopRoot,
      stdio: "inherit",
      env: { ...process.env, ELECTRON_ENABLE_LOGGING: "0" },
    });
  } catch (error) {
    exitCode = error?.status ?? 1;
  }
  const passed = exitCode === 0;
  failed = failed || !passed;
  results.push({ step: step.name, command: `pnpm exec electron ${step.script}`, startedAt, finishedAt: new Date().toISOString(), exitCode, passed });
  console.log(`[f4-deliverables] ${step.name}: ${passed ? "passed" : `FAILED(exit ${exitCode})`}`);
}

const aggregate = {
  schemaVersion: 1,
  productVersion,
  status: failed ? "failed" : "passed",
  executedAt: new Date().toISOString(),
  steps: results,
  note: "聚合冒烟:各步骤断言与证据由各冒烟脚本自行产出(_local_m1/_local_m4);本文件只记录执行摘要。",
};
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(aggregatePath, `${JSON.stringify(aggregate, null, 2)}\n`, "utf8");
console.log(`Evidence: ${aggregatePath}`);
if (failed) process.exit(1);
