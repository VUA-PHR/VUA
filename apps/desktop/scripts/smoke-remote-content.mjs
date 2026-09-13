// F4-2 隔离基座冒烟(在 Electron Main 进程内执行):
// RemoteContentManager 直接驱动真实 WebContentsView,验证隔离红线——
// 1. 远程页面无 preload/Node(window.vua、require、process 不可见);
// 2. 独立 partition Session;权限请求全拒绝且违规上报;
// 3. 允许清单外导航被阻止且违规上报;下载默认拒绝(F4-3 前的安全默认);
// 4. 弹窗不创建(U9 四分法):清单内转当前内嵌视图;伪协议一律拒并上报
//    popup_denied;清单外与外部协议走确认层(本 smoke 无注入=保守拒绝);
// 5. 生命周期事件(opened/navigated/closed)对渲染层窄面如实可见;
// 6. 退出路径(#26,2026-09-13):宿主窗口销毁后 dispose 不访问已销毁对象。
// 证据写入 _local_m4/v<版本>/remote-content-smoke.json(.gitignore 排除)。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import { RemoteContentManager } from "../dist/electron/remote-content.js";
import { localWindowWebPreferences } from "../dist/electron/security.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const desktopPackage = JSON.parse(readFileSync(path.resolve(scriptDirectory, "../package.json"), "utf8"));
const productVersion = desktopPackage.version;
const evidenceDirectory = path.join(repositoryRoot, "_local_m4", `v${productVersion}`);
const evidencePath = path.join(evidenceDirectory, "remote-content-smoke.json");
const rawLogPath = path.join(evidenceDirectory, "remote-content-smoke.log");
const logLines = [];

function log(event, detail = {}) {
  const entry = { at: new Date().toISOString(), event, ...detail };
  logLines.push(JSON.stringify(entry));
  console.log(JSON.stringify(entry));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitFor(predicate, label, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(25);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Smoke server did not bind a TCP port");
  return `http://127.0.0.1:${address.port}`;
}

function closeServer(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/file.zip") {
    response.writeHead(200, {
      "content-type": "application/zip",
      "content-disposition": 'attachment; filename="synthetic.zip"',
    });
    response.end("synthetic bytes — not a real archive");
    return;
  }
  if (url.pathname === "/page2") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page("remote smoke page 2", "<p>second page</p>"));
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(page("VUA remote content smoke", "<p>synthetic remote surface</p>"));
});

let hostWindow;
let evidence = {
  schemaVersion: 1,
  productVersion,
  status: "failed",
  evidencePath,
  rawLogPath,
};

async function run() {
  try {
    log("process.start", { electronVersion: process.versions.electron });
    await app.whenReady();
    const origin = await listen(server);
    log("server.ready", { origin });

    const openExternalCalls = [];
    const events = [];
    const manager = new RemoteContentManager({
      partition: `vua-remote-smoke-${process.pid}`,
      allowedOrigins: [origin],
      openExternal: (url) => {
        openExternalCalls.push(url);
        log("shell.handoff", { url });
      },
      broadcast: (event) => {
        events.push(event);
        log("remote-content.event", event);
      },
    });

    hostWindow = new BrowserWindow({ show: false, webPreferences: localWindowWebPreferences() });
    manager.setHostWindow(hostWindow);

    // API 打开:允许清单外来源以错误拒绝(不放行、不产生视图)
    assert.throws(() => manager.open("https://blocked.test/"), /origin_not_allowed/);
    log("open.disallowed.rejected");

    const state = manager.open(`${origin}/`);
    assert.match(state.viewId, /^rc-/);
    await waitFor(() => events.some((event) => event.kind === "navigated" && event.url === `${origin}/`), "first navigated");

    const view = hostWindow.contentView.children[0];
    assert.ok(view, "remote view attached to host window");

    // 隔离红线:远程页面世界无 preload 面、无 Node(require/process)
    const isolation = await view.webContents.executeJavaScript(
      `({ vua: typeof window.vua, require: typeof require, process: typeof process })`,
    );
    assert.equal(isolation.vua, "undefined");
    assert.equal(isolation.require, "undefined");
    assert.equal(isolation.process, "undefined");
    log("isolation.passed", isolation);

    // 允许清单外导航:被阻止、上报违规、页面保持原位
    await view.webContents.executeJavaScript(`location.href = "https://blocked.test/"; true`);
    await waitFor(
      () => events.some((event) => event.kind === "blocked" && event.reason === "origin_not_allowed"),
      "blocked navigation report",
    );
    await delay(100);
    assert.equal(view.webContents.getURL(), `${origin}/`);
    log("navigation.blocked.passed");

    // U9 语义对齐(存量脱节修正 2026-09-13,f282ecc 后 smoke 未同步):
    // 清单内弹窗不创建新窗口,目标转当前内嵌视图;伪协议弹窗无条件拒并
    // 上报 popup_denied(shell handoff 仅存在于外部协议+确认层注入形态,
    // 本 smoke 无确认层=保守拒绝,不产生 handoff)
    const viewsBeforePopup = hostWindow.contentView.children.length;
    await view.webContents.executeJavaScript(`window.open("${origin}/popup-target"); true`);
    await waitFor(() => events.some((event) => event.kind === "navigated" && event.url === `${origin}/popup-target`), "in-view popup navigation");
    assert.equal(hostWindow.contentView.children.length, viewsBeforePopup, "popup must not create a new native view");
    log("popup.in-view.passed");
    await view.webContents.executeJavaScript(`window.open("vua://blocked"); true`);
    await waitFor(() => events.some((event) => event.kind === "blocked" && event.reason === "popup_denied"), "popup denial");
    log("popup.denied.passed");

    // 下载:默认拒绝(F4-3 下载端口接管后替换)
    await view.webContents.executeJavaScript(
      `(() => { const a = document.createElement("a"); a.href = "/file.zip"; a.download = "synthetic.zip"; document.body.appendChild(a); a.click(); return true; })()`,
    );
    await waitFor(() => events.some((event) => event.kind === "blocked" && event.reason === "download_denied"), "download denial");
    log("download.denied.passed");

    // 权限:请求全拒绝并上报
    const notification = await view.webContents.executeJavaScript(`Notification.requestPermission()`);
    assert.equal(notification, "denied");
    await waitFor(() => events.some((event) => event.kind === "blocked" && event.reason === "permission_denied"), "permission denial");
    log("permission.denied.passed");

    // API 导航:允许来源成功推进;清单外来源拒绝
    const navigatedState = manager.navigate(state.viewId, `${origin}/page2`);
    assert.equal(navigatedState.viewId, state.viewId);
    await waitFor(() => events.some((event) => event.kind === "navigated" && event.url === `${origin}/page2`), "api navigated");
    assert.throws(() => manager.navigate(state.viewId, "https://blocked.test/"), /origin_not_allowed/);
    log("api.navigate.passed");

    // 可见性切换与关闭生命周期
    const hidden = manager.setVisible(state.viewId, false);
    assert.equal(hidden.visible, false);
    const shown = manager.setVisible(state.viewId, true);
    assert.equal(shown.visible, true);
    manager.close(state.viewId);
    await waitFor(() => events.some((event) => event.kind === "view-closed" && event.viewId === state.viewId), "view closed");
    assert.throws(() => manager.setVisible(state.viewId, true), /unknown_remote_view/);
    log("lifecycle.passed");

    // #26 退出路径回归(用户实测退出崩溃修复,2026-09-13):宿主窗口销毁
    // 之后的清理路径不得访问已销毁对象——旧实现 dispose() 经 #destroyView
    // 访问已销毁 hostWindow 抛「TypeError: Object has been destroyed」;
    // 修复后 #destroyView isDestroyed 双护栏跳过销毁面,dispose 幂等安全。
    // 真壳事件序:close(视图清理)→closed(引用清理);此处直接取「窗口已
    // 销毁才清理」的最坏时序做断言
    const exitView = manager.open(`${origin}/page2`);
    await waitFor(() => events.some((event) => event.kind === "navigated" && event.url === `${origin}/page2`), "exit view navigated");
    hostWindow.destroy();
    manager.dispose();
    log("exit-path.dispose-after-destroy.passed");
    assert.throws(() => manager.open(`${origin}/`), /disposed/);
    log("exit-path.disposed-rejects.passed");

    evidence = {
      schemaVersion: 1,
      productVersion,
      status: "passed",
      electronVersion: process.versions.electron,
      origin,
      isolation,
      eventKinds: [...new Set(events.map((event) => event.kind))],
      openExternalCalls,
      evidencePath,
      rawLogPath,
    };
  } catch (error) {
    evidence = {
      ...evidence,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
    };
    process.exitCode = 1;
    log("smoke.failed", { error: evidence.error });
  } finally {
    await closeServer(server);
    await mkdir(evidenceDirectory, { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    await writeFile(rawLogPath, `${logLines.join("\n")}\n`, "utf8");
    console.log(`Evidence: ${evidencePath}`);
    console.log(`Raw log: ${rawLogPath}`);
    if (hostWindow && !hostWindow.isDestroyed()) hostWindow.destroy();
    app.exit(process.exitCode ?? 0);
  }
}

void run();
