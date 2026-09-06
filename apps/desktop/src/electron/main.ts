import { app, BrowserWindow, dialog, ipcMain, session, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { ApplicationEventV01, DownloadEventV01, DownloadIngestReceiptV03, RemoteContentEventV1 } from "@vua/contracts";
import { APPLICATION_CONTRACT_VERSION } from "@vua/contracts";
import type { OrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { routeDesktopGatewayInvoke } from "./gateway-router.js";
import { DownloadPort } from "./download-port.js";
import { RemoteContentManager } from "./remote-content.js";
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
let remoteContent: RemoteContentManager | null = null;
let downloadPort: DownloadPort | null = null;
let providerHandshake: Awaited<ReturnType<OrchestratorProviderV01["start"]>> | null = null;
const lastAppliedIntentSeq = new Map<string, number>();
let shutdownStarted = false;

/** Kernel 侧素材来源映射(refId → 真实路径):Renderer 只见不透明 refId;
 *  生产命令 live 接线后,由 Kernel 在 Gateway → 应用契约翻译时补全四元组 */
const materialSources = new Map<string, { path: string; displayName: string }>();
let materialSourceSequence = 0;

/**
 * 生产上下文(amf-production v0.2,M3 纵向):projectRoot/artifactOutputRoot/
 * projectId 是 VUA 管辖配置的确定性路径(合成 Avatar 纵向,位于用户数据目录,
 * 渲染层不可见);sourceFolder 是用户显式选取的素材路径。四元组随
 * startInspection 一次性转交 AMF,此后任何请求面不再出现路径。
 */
function resolveProductionContext(refId: string): {
  sourceFolder: string;
  projectRoot: string;
  artifactOutputRoot: string;
  projectId: string;
} | undefined {
  const source = materialSources.get(refId);
  if (source === undefined) return undefined;
  const productionRoot = path.join(app.getPath("userData"), "production");
  return {
    sourceFolder: source.path,
    projectRoot: path.join(productionRoot, "synthetic-avatar-project"),
    artifactOutputRoot: path.join(productionRoot, "artifacts"),
    projectId: "vua-m3-synthetic-avatar",
  };
}

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

/** 远程内容事件 → 全部本地来源窗口(隔离基座 F4-2;违规透明上报) */
function broadcastRemoteContentEvent(rendererUrl: string | undefined, event: RemoteContentEventV1): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (isAllowedLocalSender(window.webContents.getURL(), rendererUrl)) {
      window.webContents.send("vua:remote-content:event", event);
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
      `Provider executable is missing: ${executablePath} (build it with: cargo build --release -p vua-provider-host --bin vua-orchestrator-provider)`,
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
      resolveMaterialSource: resolveProductionContext,
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

  // 远程内容窄面(F4-2 隔离基座):Renderer 只发语义动作;来源允许清单在
  // Main 侧裁决,视图内违规以事件透明上报。种子允许清单只含目录浏览域,
  // 真实值随 catalog 契约冻结(F4-1②)调整
  ipcMain.handle("vua:remote-content:open", (event, request: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    const url = (request as { url?: unknown } | null)?.url;
    if (typeof url !== "string") throw new Error("invalid remote content request");
    return remoteContent!.open(url);
  });
  ipcMain.handle("vua:remote-content:navigate", (event, viewId: unknown, url: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof viewId !== "string" || typeof url !== "string") throw new Error("invalid remote content request");
    return remoteContent!.navigate(viewId, url);
  });
  ipcMain.handle("vua:remote-content:close", (event, viewId: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof viewId !== "string") throw new Error("invalid remote content request");
    remoteContent!.close(viewId);
  });
  ipcMain.handle("vua:remote-content:set-visible", (event, viewId: unknown, visible: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof viewId !== "string" || typeof visible !== "boolean") throw new Error("invalid remote content request");
    return remoteContent!.setVisible(viewId, visible);
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

  // 下载端口(F4-3/F4-4):will-download 接管 + 冻结词表事件规范化。事件汇
  // 按传输定案批量投递 download.ingest(at-least-once:回执裁剪缓冲 + BDL
  // 去重;握手未声明下载域时诚实降级写诊断通道)。暂存根跟随用户数据目录
  // 布局,由注入决定,端口不自选策略
  const buffer: DownloadEventV01[] = [];
  let flushTimer: NodeJS.Timeout | null = null;
  const flushIngest = async (): Promise<void> => {
    if (buffer.length === 0 || provider === null) return;
    const batch = buffer.splice(0, buffer.length);
    try {
      const response = await provider.invoke({
        contractVersion: APPLICATION_CONTRACT_VERSION,
        requestId: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        commandId: crypto.randomUUID(),
        kind: "command",
        method: "download.ingest",
        params: { schemaVersion: "0.1", events: batch },
      });
      if (!response.ok) throw new Error(response.error.code);
      const receipt = response.value as unknown as DownloadIngestReceiptV03;
      for (const rejected of receipt.rejected) {
        // 单条非法事件死信(不毒化整批);诊断通道留痕
        process.stderr.write(`${JSON.stringify({ channel: "download-events", deadLetter: rejected })}\n`);
      }
    } catch (error) {
      // 投递失败:整批回灌,等待下次冲刷(at-least-once)
      buffer.unshift(...batch);
      process.stderr.write(`${JSON.stringify({ channel: "download-events", ingestRetry: String(error) })}\n`);
    }
  };
  const scheduleFlush = (): void => {
    if (flushTimer !== null || buffer.length === 0) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushIngest();
    }, 1_000);
  };
  const downloadSink = {
    emit: (event: DownloadEventV01): void => {
      if (providerHandshake?.downloadIngest === true) {
        buffer.push(event);
        if (buffer.length > 1_000) buffer.splice(0, buffer.length - 1_000);
        if (buffer.length >= 20) {
          if (flushTimer !== null) {
            clearTimeout(flushTimer);
            flushTimer = null;
          }
          void flushIngest();
        } else {
          scheduleFlush();
        }
      } else {
        process.stderr.write(`${JSON.stringify({ channel: "download-events", ...event })}\n`);
      }
    },
  };
  downloadPort = new DownloadPort({
    stagingRoot: path.join(app.getPath("userData"), "downloads-staging"),
    partitionSession: session.fromPartition("persist:vua-remote"),
    allowedOrigins: ["https://booth.pm"],
    sink: downloadSink,
  });

  // 远程内容管理器(F4-2):独立 partition Session;目录浏览域为种子允许清单,
  // 真实值随 catalog 契约冻结(F4-1②)调整;违规事件广播到本地来源窗口
  remoteContent = new RemoteContentManager({
    partition: "persist:vua-remote",
    allowedOrigins: ["https://booth.pm"],
    openExternal: (url) => void shell.openExternal(url),
    broadcast: (event) => broadcastRemoteContentEvent(rendererUrl, event),
    willDownload: (event, item, webContents) => downloadPort?.handleWillDownload(event, item, webContents),
  });
  remoteContent.setHostWindow(mainWindow);
  mainWindow.on("resize", () => remoteContent?.refreshBounds());
  mainWindow.on("closed", () => {
    remoteContent?.dispose();
    remoteContent = null;
    mainWindow = null;
  });

  if (rendererUrl) await mainWindow.loadURL(rendererUrl);
  else await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(async () => {
  provider = createDesktopOrchestratorProvider(resolveProviderEndpoint());
  providerHandshake = await provider.start();
  provider.subscribe((event) => {
    if (event.kind === "download.intent") {
      // 端口意图:intentSeq 去重后串行解释;Main 内部消费,不广播渲染层
      const { downloadId, intent, intentSeq } = event.payload;
      const last = lastAppliedIntentSeq.get(downloadId) ?? -1;
      if (intentSeq <= last) return;
      lastAppliedIntentSeq.set(downloadId, intentSeq);
      // 意图直通:applyIntent 按冻结裁定解释 resume/retry/abandon
      downloadPort?.applyIntent(downloadId, intent);
      return;
    }
    broadcastGatewayEvent(rendererUrl, event);
  });
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
