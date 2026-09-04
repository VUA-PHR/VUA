import { app, BrowserWindow, dialog, ipcMain, session, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { ApplicationEventV01 } from "@vua/contracts";
import type { OrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { routeDesktopGatewayInvoke } from "./gateway-router.js";
import { createDesktopOrchestratorProvider } from "./provider-bootstrap.js";
import {
  installLocalContentNavigationPolicy,
  installPermissionDenyPolicy,
  isAllowedLocalSender,
  localWindowWebPreferences,
} from "./security.js";

const rendererUrl = process.env.VUA_RENDERER_URL;
let mainWindow: BrowserWindow | null = null;
let provider: OrchestratorProviderV01 | null = null;
let shutdownStarted = false;

/** Kernel 侧素材来源映射(refId → 真实路径):Renderer 只见不透明 refId;
 *  生产命令 live 接线后,由 Kernel 在 Gateway → 应用契约翻译时解析回路径 */
const materialSources = new Map<string, { path: string; displayName: string }>();
let materialSourceSequence = 0;

function assertLocalSender(senderUrl: string): void {
  if (!isAllowedLocalSender(senderUrl, rendererUrl)) throw new Error("untrusted renderer origin");
}

function senderFrameUrl(event: Electron.IpcMainInvokeEvent): string {
  return event.senderFrame?.url ?? "";
}

/** Provider 类型化事件 → 全部本地来源窗口(多窗口同步的 Kernel 侧) */
function broadcastGatewayEvent(rendererUrl: string | undefined, event: ApplicationEventV01): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (isAllowedLocalSender(window.webContents.getURL(), rendererUrl)) {
      window.webContents.send("vua:gateway:event", event);
    }
  }
}

/**
 * 受监督 Provider 端点解析(M2):
 * - 可执行文件:VUA_PROVIDER_EXECUTABLE 覆盖,否则取仓库构建产物
 *   (dist/electron 相对仓库根上溯四级);文件缺失即启动失败——
 *   诚实失败优于静默回落 Mock;
 * - 任务库:用户数据目录,跨重启持久(重启恢复验收的权威来源)。
 */
function resolveProviderEndpoint(): { executablePath: string; databasePath: string } {
  const platformSuffix = process.platform === "win32" ? ".exe" : "";
  const executablePath = process.env.VUA_PROVIDER_EXECUTABLE
    ?? path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "target",
      "release",
      `vua-orchestrator-provider${platformSuffix}`,
    );
  if (!fs.existsSync(executablePath)) {
    throw new Error(
      `Provider executable is missing: ${executablePath} (build it with: cargo build --release -p vua-orchestrator --bin vua-orchestrator-provider)`,
    );
  }
  const databasePath = path.join(app.getPath("userData"), "orchestrator", "provider.db");
  return { executablePath, databasePath };
}

function registerIpc(provider: OrchestratorProviderV01): void {
  ipcMain.handle("vua:gateway:invoke", (event, request: unknown) => routeDesktopGatewayInvoke(
    {
      provider,
      productVersion: app.getVersion(),
      platform: process.platform as "win32" | "darwin" | "linux",
      rendererUrl,
      resolveMaterialSource: (refId) => {
        const source = materialSources.get(refId);
        return source === undefined
          ? undefined
          : { sourceFolder: source.path, intake: "direct_unity_package" };
      },
    },
    senderFrameUrl(event),
    request,
  ));

  // 素材来源对话框(生产用例契约草案"双素材入口"):按 intake 限定可选形态,
  // 选取结果落 Kernel 映射,回发 { refId, displayName };取消返回 null
  ipcMain.handle("vua:dialog:pick-material-source", async (event, intake: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (intake !== "direct_unity_package" && intake !== "local_reusable_vpm") {
      throw new Error("invalid material intake");
    }
    const options =
      intake === "direct_unity_package"
        ? {
            title: "Unity package",
            filters: [{ name: "Unity package", extensions: ["unitypackage"] }],
            properties: ["openFile"] as ("openFile" | "openDirectory")[],
          }
        : {
            title: "Local VPM package",
            filters: [] as { name: string; extensions: string[] }[],
            properties: ["openDirectory"] as ("openFile" | "openDirectory")[],
          };
    const result =
      mainWindow === null
        ? await dialog.showOpenDialog(options)
        : await dialog.showOpenDialog(mainWindow, options);
    if (result.canceled || result.filePaths.length !== 1) return null;
    const pickedPath = result.filePaths[0]!;
    materialSourceSequence += 1;
    const refId = `mat-${materialSourceSequence}-${crypto.randomUUID()}`;
    const displayName = path.basename(pickedPath);
    materialSources.set(refId, { path: pickedPath, displayName });
    return { refId, displayName };
  });

  ipcMain.handle("vua:window:minimize", (event) => {
    assertLocalSender(senderFrameUrl(event));
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.handle("vua:window:toggle-maximize", (event) => {
    assertLocalSender(senderFrameUrl(event));
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.isMaximized() ? window.unmaximize() : window.maximize();
  });
  ipcMain.handle("vua:window:close", (event) => {
    assertLocalSender(senderFrameUrl(event));
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}

async function createWindow(): Promise<void> {
  const preload = path.join(__dirname, "preload.js");
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    show: false,
    backgroundColor: "#0b0a12",
    webPreferences: localWindowWebPreferences(preload),
  });

  installLocalContentNavigationPolicy(mainWindow.webContents, rendererUrl, (url) => shell.openExternal(url));
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  if (rendererUrl) await mainWindow.loadURL(rendererUrl);
  else await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(async () => {
  provider = createDesktopOrchestratorProvider(resolveProviderEndpoint());
  await provider.start();
  provider.subscribe((event) => broadcastGatewayEvent(rendererUrl, event));
  installPermissionDenyPolicy(session.defaultSession);
  registerIpc(provider);
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/**
 * 进程关闭协议(M2 交付):退出前先 prepareShutdown——关闭新调用入口并等待
 * 在途修改任务到安全边界;超时出现阻塞任务时,当前阶段尚无用户询问 UI,
 * 以 Kernel 生成的用户决定 ID 强制退出(F3 任务中心接入询问流),遗留任务
 * 由 SQLite 权威状态标记 inspect_required,下次启动如实呈现。
 */
app.on("before-quit", (event) => {
  if (provider === null || shutdownStarted || provider.status().state === "stopped") return;
  event.preventDefault();
  shutdownStarted = true;
  void (async () => {
    try {
      const result = await provider!.prepareShutdown({ timeoutMs: 3_000 });
      if (result.outcome === "needs_user_choice") {
        await provider!.continueShutdown({
          decision: "force",
          userDecisionId: crypto.randomUUID(),
        });
      }
    } catch {
      /* Provider 已不可达:进程树遏制保证子进程随后终止 */
    } finally {
      app.quit();
    }
  })();
});
