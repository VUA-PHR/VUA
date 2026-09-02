import { spawn } from "node:child_process";

const useShell = process.platform === "win32";
const vite = spawn("pnpm", ["exec", "vite"], { stdio: "inherit", shell: useShell });

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
  if (electron && !electron.killed) electron.kill();
  if (!vite.killed) vite.kill();
}
