import { spawn } from "node:child_process";

const useShell = process.platform === "win32";
const vite = spawn("pnpm", ["exec", "vite"], { stdio: "inherit", shell: useShell });

// #29 裁决(集成 2026-09-15 深夜,缺陷成立=dev 工具链护栏缺口):Windows 下
// spawn(pnpm, {shell:true}) 的实际进程树是 cmd.exe → pnpm → vite/electron,
// 子进程对象只指向 cmd/pnpm 包装层,kill() 杀掉包装层后孙进程(vite/electron)
// 孤儿化——残留 vite 持 5173 即此机制产物(2026-09-13 19:00 起残留两日的实例)。
// 退出路径改用 taskkill /T /F 树杀:整树(含孙进程)一并终止,非常规退出
// (终端直闭/进程强杀跳过 finally 的情况除外)不再产生孤儿。已退出或从未
// 拉起的进程直接跳过;taskkill 自身是独立进程,本脚本退出不影响其执行。
function killTree(child) {
  if (!child || child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  if (useShell) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    child.kill();
  }
}

async function waitForRenderer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:5173");
      if (response.ok) return;
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("renderer dev server did not start");
}

let electron;
try {
  const compile = spawn("pnpm", ["exec", "tsc", "-p", "tsconfig.electron.json"], {
    stdio: "inherit",
    shell: useShell,
  });
  const code = await new Promise((resolve) => compile.once("exit", resolve));
  if (code !== 0) throw new Error("Electron TypeScript compilation failed");
  await waitForRenderer();
  electron = spawn("pnpm", ["exec", "electron", "."], {
    stdio: "inherit",
    shell: useShell,
    env: { ...process.env, VUA_RENDERER_URL: "http://127.0.0.1:5173" },
  });
  await new Promise((resolve) => electron.once("exit", resolve));
} finally {
  killTree(electron);
  killTree(vite);
}
