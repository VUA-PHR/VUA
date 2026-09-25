// 顶栏占用查看器 DOM 冒烟(第 182 批反向审查批,对象 cae84388):真实
// Chromium DOM,合成 system 宿主,零生产/远程服务;不宣称端到端。
// 监听泄漏钉:页面内 add/remove 调用计数对「引用失配型泄漏」失明(两版本
// 调用次数都对称),故经 CDP DOMDebugger.getEventListeners 取窗口 blur
// 监听真实注册数,断言开合循环前后零残留(修复前每轮开合泄漏 1 个必红)。
// 证据落临时目录 JSON。
import { app, BrowserWindow } from "electron";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import os from "node:os";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let server, window;
const checks = [];
function check(ok, name) {
  if (!ok) throw new Error(name);
  checks.push(name);
}
/** 窗口 blur 监听真实注册数(CDP 地面真值,页面内不可观测) */
async function countWindowBlurListeners() {
  const evaluated = await window.webContents.debugger.sendCommand("Runtime.evaluate", {
    expression: "window",
    returnByValue: false,
    objectGroup: "smoke",
  });
  const detail = await window.webContents.debugger.sendCommand("DOMDebugger.getEventListeners", {
    objectId: evaluated.result.objectId,
  });
  return detail.listeners.filter((listener) => listener.type === "blur").length;
}
async function main() {
  try {
    await app.whenReady();
    server = await createServer({ configFile: false, appType: "custom", root, plugins: [react()],
      server: { host: "127.0.0.1", port: 0, strictPort: false },
      optimizeDeps: { include: ["react", "react-dom/client", "@vua/contracts"] } });
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/__resource-monitor") return next();
      res.setHeader("Content-Type", "text/html");
      res.end(await server.transformIndexHtml(req.url, '<html><body><div id="root"></div><script type="module" src="/scripts/fixtures/resource-monitor-popover.tsx"></script></body></html>'));
    });
    await server.listen();
    window = new BrowserWindow({ show: false, width: 1280, height: 900,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
    window.webContents.on("console-message", (event) => { if (event.level === "error") console.error(event.message); });
    await window.loadURL(`http://127.0.0.1:${server.httpServer.address().port}/__resource-monitor`);
    await window.webContents.executeJavaScript('new Promise((resolve, reject) => { let attempts = 0; const timer = setInterval(() => { if(window.resourceMonitorSmoke) { clearInterval(timer); resolve(); } else if (++attempts > 200) { clearInterval(timer); reject(new Error("fixture load timeout")); } }, 50); })');
    const behaviorChecks = await window.webContents.executeJavaScript("window.resourceMonitorSmoke.base()");
    // 监听生命周期钉(CDP 地面真值):基线 → 三轮开合 → 断言零残留
    await window.webContents.debugger.attach("1.3");
    await window.webContents.debugger.sendCommand("Runtime.enable");
    const blurBeforeCycles = await countWindowBlurListeners();
    await window.webContents.executeJavaScript("window.resourceMonitorSmoke.lifecycleCycles()");
    const blurAfterCycles = await countWindowBlurListeners();
    check(
      blurAfterCycles === blurBeforeCycles,
      `开合循环后窗口 blur 监听零残留(CDP 实数:循环前 ${blurBeforeCycles},循环后 ${blurAfterCycles};` +
        "修复前 remove 传匿名新箭头按引用失配永不生效,每轮开合泄漏 1 个必红)",
    );
    const failureChecks = await window.webContents.executeJavaScript("window.resourceMonitorSmoke.failureFaces()");
    const allChecks = [...behaviorChecks, ...checks, ...failureChecks];
    const evidence = { date: new Date().toISOString(), browser: process.versions.chrome,
      scope: "Actual Chromium DOM, synthetic system host; no remote or production E2E claim",
      windowBlurListeners: { beforeCycles: blurBeforeCycles, afterCycles: blurAfterCycles },
      checks: allChecks, passed: allChecks.length };
    await writeFile(path.join(os.tmpdir(), "vua-resource-monitor-dom.json"), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
    window.destroy(); await server.close(); app.exit(0);
  } catch (error) {
    console.error(error); window?.destroy(); await server?.close(); app.exit(1);
  }
}
void main();
