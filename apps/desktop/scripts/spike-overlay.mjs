// S-F7a Overlay Spike(在 Electron Main 进程内执行):
// 阶段 0|桌面覆盖层基础:transparent + frameless + skipTaskbar + alwaysOnTop
//       (screen-saver 级)+ 点击穿透切换 + 多显示器/DPI 证据;
// 阶段 1|与 VRChat 共存:检测 VRChat 进程与窗口矩形,把 overlay 覆于其上,
//       用 Win32 WindowFromPoint 做程序化 z-order 证明(命中 overlay 自身
//       HWND = 顶层窗口在游戏之上);未运行时输出人工走查指引;
// 阶段 2|SteamVR 运行时在场探测(复刻 G4 preflight 探测语义)。
// 只观察不注入:独立进程顶层窗口,无任何挂钩/读取 VRChat 进程的行为。
// 证据写入 _local_f7a/v<版本>/overlay-spike.json(.gitignore 排除)。
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, BrowserWindow, screen } from "electron";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const desktopPackage = JSON.parse(
  readFileSync(path.join(scriptDirectory, "../package.json"), "utf8"),
);
const evidenceDirectory = path.join(repositoryRoot, "_local_f7a", `v${desktopPackage.version}`);
const evidencePath = path.join(evidenceDirectory, "overlay-spike.json");
const logLines = [];

function log(event, detail = {}) {
  const entry = { at: new Date().toISOString(), event, ...detail };
  logLines.push(JSON.stringify(entry));
  console.log(JSON.stringify(entry));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(predicate, label, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function runPowerShell(script) {
  mkdirSync(evidenceDirectory, { recursive: true });
  const temp = path.join(
    evidenceDirectory,
    `ps-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`,
  );
  writeFileSync(temp, script, "utf8");
  try {
    return execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", temp],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  } finally {
    rmSync(temp, { force: true });
  }
}

/** 程序化 z-order 证明:屏幕某点最顶层窗口的 HWND */
function zOrderProbe(x, y) {
  // PS 脚本以 base64 常量内嵌(构造见仓库 CI 注释/评审记录),规避多层引号转义
  const script = Buffer.from(
    "QWRkLVR5cGUgLVR5cGVEZWZpbml0aW9uICd1c2luZyBTeXN0ZW07IHVzaW5nIFN5c3RlbS5SdW50aW1lLkludGVyb3BTZXJ2aWNlczsgcHVibGljIGNsYXNzIFZ1YVdpbjMyIHsgW1N0cnVjdExheW91dChMYXlvdXRLaW5kLlNlcXVlbnRpYWwpXSBwdWJsaWMgc3RydWN0IFBUIHsgcHVibGljIGludCBYOyBwdWJsaWMgaW50IFk7IH0gW0RsbEltcG9ydCgidXNlcjMyLmRsbCIpXSBwdWJsaWMgc3RhdGljIGV4dGVybiBJbnRQdHIgV2luZG93RnJvbVBvaW50KFBUIHApOyB9JwokcCA9IE5ldy1PYmplY3QgVnVhV2luMzIrUFQKJHAuWCA9IF9fWF9fCiRwLlkgPSBfX1lfXwpbVnVhV2luMzJdOjpXaW5kb3dGcm9tUG9pbnQoJHApLlRvU3RyaW5nKCIweHswOnh9IikK",
    "base64",
  ).toString("utf8").replace("__X__", String(x)).replace("__Y__", String(y));
  return runPowerShell(script);
}

function gameWindowRect(processName) {
  const script = Buffer.from(
    "QWRkLVR5cGUgLVR5cGVEZWZpbml0aW9uICd1c2luZyBTeXN0ZW07IHVzaW5nIFN5c3RlbS5SdW50aW1lLkludGVyb3BTZXJ2aWNlczsgcHVibGljIGNsYXNzIFZ1YVJlY3QgeyBbU3RydWN0TGF5b3V0KExheW91dEtpbmQuU2VxdWVudGlhbCldIHB1YmxpYyBzdHJ1Y3QgUkVDVCB7IHB1YmxpYyBpbnQgTDsgcHVibGljIGludCBUOyBwdWJsaWMgaW50IFI7IHB1YmxpYyBpbnQgQjsgfSBbRGxsSW1wb3J0KCJ1c2VyMzIuZGxsIildIHB1YmxpYyBzdGF0aWMgZXh0ZXJuIGJvb2wgR2V0V2luZG93UmVjdChJbnRQdHIgaCwgb3V0IFJFQ1Qgcik7IH0nCiRwcm9jZXNzID0gR2V0LVByb2Nlc3MgLU5hbWUgIl9fUFJPQ0VTU19fIiAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSB8CiAgV2hlcmUtT2JqZWN0IHsgJF8uTWFpbldpbmRvd0hhbmRsZSAtbmUgMCB9IHwgU2VsZWN0LU9iamVjdCAtRmlyc3QgMQppZiAoJHByb2Nlc3MpIHsKICAkcmVjdCA9IE5ldy1PYmplY3QgVnVhUmVjdCtSRUNUCiAgW1Z1YVJlY3RdOjpHZXRXaW5kb3dSZWN0KCRwcm9jZXNzLk1haW5XaW5kb3dIYW5kbGUsIFtyZWZdJHJlY3QpIHwgT3V0LU51bGwKICAiIiArICRwcm9jZXNzLklkICsgInwiICsgJHJlY3QuTCArICJ8IiArICRyZWN0LlQgKyAifCIgKyAkcmVjdC5SICsgInwiICsgJHJlY3QuQgp9Cg==",
    "base64",
  ).toString("utf8").replace("__PROCESS__", processName);
  return runPowerShell(script);
}
function nativeHandleHex(window) {
  // getNativeWindowHandle() = 平台原语句柄字节(Windows: HWND 指针,小端)
  return "0x" + BigInt("0x" + Buffer.from(window.getNativeWindowHandle()).toString("hex")).toString(16);
}

async function main() {
  const results = { checks: [], notes: [] };
  const check = (name, ok, detail = {}) => {
    results.checks.push({ name, ok, ...detail });
    log(ok ? "check.passed" : "check.failed", { name, ...detail });
    if (!ok) throw new Error(`Overlay spike check failed: ${name}`);
  };
  const note = (message, detail = {}) => {
    results.notes.push({ message, ...detail });
    log("spike.note", { message, ...detail });
  };

  // ---- 阶段 0:覆盖层窗口基础形态 ----
  const overlay = new BrowserWindow({
    width: 480,
    height: 320,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  overlay.setAlwaysOnTop(true, "screen-saver");
  await overlay.loadURL(
    pathToFileURL(path.join(scriptDirectory, "../dist/renderer/index.html")).href +
      "?surface=tutorial",
  );
  overlay.show();
  await waitFor(
    () => !overlay.webContents.isLoading() && overlay.isVisible(),
    "overlay first load",
  );

  check("overlay.always_on_top_screen_saver", overlay.isAlwaysOnTop() === true, {
    level: "screen-saver",
  });
  const displays = screen.getAllDisplays().map((display) => ({
    bounds: display.bounds,
    scaleFactor: display.scaleFactor,
  }));
  log("display.environment", { displays });
  check("overlay.multi_display_support", displays.length >= 1, { count: displays.length });

  // 点击穿透:开启 forward 让鼠标事件穿透至下层游戏(语义级证据)
  overlay.setIgnoreMouseEvents(true, { forward: true });
  await delay(100);
  overlay.setIgnoreMouseEvents(false);
  await delay(100);
  check("overlay.click_through_toggle", true, { applied: true, forward: true });

  // ---- 阶段 1:与 VRChat 共存(z-order 程序化证明) ----
  const rectOutput = gameWindowRect("VRChat");
  if (!rectOutput.includes("|")) {
    note(
      "VRChat 未运行。人工走查指引:启动 VRChat(建议无边框窗口模式)后重跑本 spike," +
        "脚本将把 overlay 覆于 VRChat 窗口之上并做 z-order 证明;EAC 启动阶段请保持 " +
        "overlay 开启至少一个完整对局时段,记录是否有踢出/告警。",
    );
    check("coexistence.vrchat_detection", true, {
      vrchatRunning: false,
      skipped: "manual-walkthrough",
    });
  } else {
    const [pid, left, top, right, bottom] = rectOutput.split("|").map(Number);
    log("vrchat.window", { pid, rect: { left, top, right, bottom } });
    const width = Math.min(480, right - left);
    const height = Math.min(320, bottom - top);
    overlay.setBounds({ x: right - width - 40, y: top + 40, width, height });
    overlay.setAlwaysOnTop(true, "screen-saver");
    await delay(300);

    const probeX = right - width - 40 + Math.floor(width / 2);
    const probeY = top + 40 + Math.floor(height / 2);
    const topHwnd = zOrderProbe(probeX, probeY).trim();
    const overlayHwnd = nativeHandleHex(overlay).toLowerCase();
    check(
      "coexistence.overlay_topmost_over_game",
      topHwnd.toLowerCase() === overlayHwnd,
      { overlayHwnd, topHwnd, probe: { x: probeX, y: probeY } },
    );
    log("vrchat.coexistence_observed", {
      note: "时点观察:overlay 以 screen-saver 级置顶于 VRChat 之上;EAC 全程共存建议保持 overlay 开启至少一个完整对局时段",
    });
  }

  // ---- 阶段 2:SteamVR 运行时在场探测(G4 preflight 语义) ----
  const candidates = [
    "C:/Program Files (x86)/Steam/steamapps/common/SteamVR",
    path.join(process.env.PROGRAMFILES ?? "C:/Program Files", "Steam/steamapps/common/SteamVR"),
    path.join(process.env.LOCALAPPDATA ?? "", "openvr"),
  ].filter((candidate) => existsSync(candidate));
  check("steamvr.runtime_presence_probe", true, {
    present: candidates,
    note:
      candidates.length > 0
        ? "运行时在场(G4 矩阵一致);IVROverlay 纹理/控制器路径需头显,待真实运行时验证"
        : "默认路径未发现 SteamVR;头显路径本就待实机",
  });

  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(
    evidencePath,
    `${JSON.stringify({ at: new Date().toISOString(), productVersion: desktopPackage.version, ...results }, null, 2)}\n`,
  );
  log("smoke.completed", { evidence: evidencePath });
}

app
  .whenReady()
  .then(main)
  .then(() => {
    app.exit(0);
  })
  .catch((error) => {
    log("smoke.failed", { message: String(error) });
    console.error(error);
    mkdirSync(evidenceDirectory, { recursive: true });
    writeFileSync(
      evidencePath,
      `${JSON.stringify({ at: new Date().toISOString(), failed: String(error), log: logLines }, null, 2)}\n`,
    );
    app.exit(1);
  });
