import { app, BrowserWindow, dialog, ipcMain, session, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import type {
  ApplicationEventV01,
  DownloadEventV01,
  DownloadIngestReceiptV03,
  EditorSettingsV1,
  NavigationConfirmRequestV1,
  RemoteContentEventV1,
} from "@vua/contracts";
import { APPLICATION_CONTRACT_VERSION } from "@vua/contracts";
import type { OrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { routeDesktopGatewayInvoke } from "./gateway-router.js";
import { DownloadPort } from "./download-port.js";
import { RemoteContentManager } from "./remote-content.js";
import { createDesktopOrchestratorProvider } from "./provider-bootstrap.js";
import {
  isEditorSettingsV1,
  readEditorSettingsFromFile,
  writeEditorSettingsToFile,
} from "./editor-settings.js";
import {
  OVERLAY_SURFACE_PARAM,
  OVERLAY_WINDOW_HEIGHT,
  OVERLAY_WINDOW_LEVEL,
  OVERLAY_WINDOW_WIDTH,
  decideOverlayWindowAction,
  overlayVisibilityAfterDecision,
} from "./overlay-window.js";
import {
  installLocalContentNavigationPolicy,
  installPermissionDenyPolicy,
  isAllowedLocalSender,
  localWindowWebPreferences,
} from "./security.js";

const rendererUrl = process.env.VUA_RENDERER_URL;
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let provider: OrchestratorProviderV01 | null = null;
let remoteContent: RemoteContentManager | null = null;
let downloadPort: DownloadPort | null = null;
let providerHandshake: Awaited<ReturnType<OrchestratorProviderV01["start"]>> | null = null;
const lastAppliedIntentSeq = new Map<string, number>();
let shutdownStarted = false;

// #26 防弹兜底(用户实测退出弹「Uncaught Exception」原生框):意外异常改为
// 诊断通道 stderr 全文留痕,不弹系统错误框——失败仍如实呈现(留痕可查),
// 但退出路径不再被原生弹窗打断。放在模块顶层,窗口创建前即生效
process.on("uncaughtException", (error) => {
  process.stderr.write(
    `${JSON.stringify({ channel: "uncaught-exception", message: error?.stack ?? String(error) })}\n`,
  );
});

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
 * - 任务库:用户数据目录,跨重启持久(重启恢复验收的权威来源);
 * - Provider 运行时根(用户实测缺口修复 2026-09-12):数据根=用户数据目录
 *   本身(BDL/记录/temp/生产用例文档按 bin 约定落 bdl/records/temp/production
 *   子目录,与壳内 resolveProductionContext 的 production 布局同源);仓储根
 *   与生产作业项目根为确定性路径。缺失即仓储/下载/生产用例面诚实不可用,
 *   Provider 正常运行(渲染层呈现诚实空态),此处保证服务面在场。
 */
/** 壳编辑器设置落盘路径(U10 门③留痕,机器级 settings) */
function editorSettingsPath(): string {
  return path.join(app.getPath("userData"), "editor-settings.json");
}

function resolveProviderEndpoint(): {
  executablePath: string;
  databasePath: string;
  providerDataRoot: string;
  warehouseRoot: string;
  projectRoot: string;
  /** 门③已确认手选编辑器(null = 无手选):经 VUA_UNITY_EDITOR 注入消费;
   *  读取于 provider 启动时刻,确认留痕后的注入生效时机 = 下次进程启动,
   *  设置面如实标注(诚实纪律:不宣称即时生效) */
  unityEditorPath: string | null;
} {
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
  const userData = app.getPath("userData");
  const providerDataRoot = userData;
  const warehouseRoot = path.join(userData, "warehouse");
  const projectRoot = path.join(userData, "production", "synthetic-avatar-project");
  // U10 手选注入:门③确认留痕在位才注入(无手选 = null,零配置直用策略
  // 由核心组装面决策,壳只透传显式手选——021 核心表态 2)
  const editorSettings = readEditorSettingsFromFile(editorSettingsPath());
  const unityEditorPath = editorSettings.confirmedEditor?.path ?? null;
  // 目录创建防首次运行失败:Provider 侧 SQLite/文档存储期望根已存在
  // (mkdir recursive 对已存在目录是幂等 no-op)
  for (const dir of [warehouseRoot, projectRoot]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const databasePath = path.join(userData, "orchestrator", "provider.db");
  return { executablePath, databasePath, providerDataRoot, warehouseRoot, projectRoot, unityEditorPath };
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

  // 仓储导入文件夹多选(W18,bdl-commands v0.3 warehouse.import 的本地拾取面):
  // openDirectory + multiSelections;取消或空选返回 null,路径交给渲染层经
  // warehouse.import 提交(本进程不做任何文件操作)
  ipcMain.handle("vua:dialog:pick-warehouse-folders", async (event) => {
    assertLocalSender(senderFrameUrl(event));
    const result = await dialog.showOpenDialog({
      title: "Import material packages",
      properties: ["openDirectory", "multiSelections"] as ("openFile" | "openDirectory" | "multiSelections")[],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths;
  });

  // U10 手选编辑器路径(021 收敛点 4:单一「浏览」入口双态):exe 文件本身
  // 或目录(版本化根/Editor 目录);取消返回 null。路径原样交渲染层经
  // environment.verifyEditor 透传验证,本进程不做归一化
  ipcMain.handle("vua:dialog:pick-editor-path", async (event, mode: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (mode !== "executable" && mode !== "directory") {
      throw new Error("invalid editor path mode");
    }
    const options =
      mode === "executable"
        ? {
            title: "Unity editor executable",
            filters: [{ name: "Unity", extensions: ["exe"] }],
            properties: ["openFile"] as ("openFile" | "openDirectory")[],
          }
        : {
            title: "Unity editor directory",
            filters: [] as { name: string; extensions: string[] }[],
            properties: ["openDirectory"] as ("openFile" | "openDirectory")[],
          };
    const result =
      mainWindow === null
        ? await dialog.showOpenDialog(options)
        : await dialog.showOpenDialog(mainWindow, options);
    if (result.canceled || result.filePaths.length !== 1) return null;
    return result.filePaths[0]!;
  });

  // 壳编辑器设置读写(U10 门③留痕):读取按落盘事实;保存校验形状,词表外
  // 内容拒绝并回当前落盘值(不猜测、不修复)
  ipcMain.handle("vua:editor-settings:read", async (event) => {
    assertLocalSender(senderFrameUrl(event));
    return readEditorSettingsFromFile(editorSettingsPath());
  });
  ipcMain.handle("vua:editor-settings:save", async (event, settings: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    const current = readEditorSettingsFromFile(editorSettingsPath());
    if (!isEditorSettingsV1(settings)) return current;
    return writeEditorSettingsToFile(editorSettingsPath(), settings as EditorSettingsV1);
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

  // Overlay 置顶窗开关(proposal 017 实现面备注,正式入口形态):只受理本地
  // 来源窗口;动作与回执语义在 overlay-window.ts 决策面(纯函数可测)
  ipcMain.handle("vua:overlay:toggle", (event) => {
    assertLocalSender(senderFrameUrl(event));
    return toggleOverlayWindow();
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
  // 视图内导航历史(固定导航条动作面):身份守卫在管理器,本地来源守卫在此
  ipcMain.handle("vua:remote-content:go-back", (event, viewId: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof viewId !== "string") throw new Error("invalid remote content request");
    return remoteContent!.goBack(viewId);
  });
  ipcMain.handle("vua:remote-content:go-forward", (event, viewId: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof viewId !== "string") throw new Error("invalid remote content request");
    return remoteContent!.goForward(viewId);
  });
  ipcMain.handle("vua:remote-content:reload", (event, viewId: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof viewId !== "string") throw new Error("invalid remote content request");
    return remoteContent!.reload(viewId);
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

  // 导航确认作答(015 §12):只受理本地来源;未知 confirmId/重复作答忽略
  // (渲染层不能伪造未发出的确认);作答后 pending 移除,确认 Promise 落定
  ipcMain.handle("vua:nav-confirm:respond", (event, confirmId: unknown, approved: unknown) => {
    assertLocalSender(senderFrameUrl(event));
    if (typeof confirmId !== "string" || typeof approved !== "boolean") {
      throw new Error("invalid navigation confirm response");
    }
    const resolve = pendingNavConfirms.get(confirmId);
    if (resolve === undefined) return;
    pendingNavConfirms.delete(confirmId);
    resolve(approved);
  });
}

/**
 * U9(1)/U9(3) 导航确认层(015 §12,批 B-3:渲染层 i18n 确认流):确认在前
 * (A-1 逐次阻断式),确认卡显示完整目标 URL 与放行后果;每次确认,无任何
 * 免确认记忆(A-2)。用户不答=pending 保持=导航不执行(无超时,阻断式确认
 * 的诚实形态);respond 校验 confirmId(渲染层不能伪造未发出的确认,双
 * 作答只首次生效)。导航策略本体在 security.ts 分类与分流——本函数仅是
 * 确认 UI 载体(原生英文对话框已移除,四语化由渲染层确认卡承载)。
 */
const pendingNavConfirms = new Map<string, (approved: boolean) => void>();

function confirmNavigation(
  url: string,
  reason: "origin_not_allowed" | "external_protocol",
): Promise<boolean> {
  const confirmId = crypto.randomUUID();
  return new Promise<boolean>((resolve) => {
    pendingNavConfirms.set(confirmId, resolve);
    const request: NavigationConfirmRequestV1 = { confirmId, url, reason };
    for (const window of BrowserWindow.getAllWindows()) {
      if (isAllowedLocalSender(window.webContents.getURL(), rendererUrl)) {
        window.webContents.send("vua:nav-confirm:request", request);
      }
    }
  });
}

/**
 * Overlay 置顶窗(proposal 017 §4 桌面表态:同一 Electron 进程内的独立
 * BrowserWindow,与主窗口共用同一 VuaDesktopApiV1 preload 面;故障隔离由
 * Provider 独立进程＋渲染进程模型双层承载,不需要独立 Gateway 连接)。
 *
 * - 形态参数(F7a spike 结论):transparent + frameless + skipTaskbar +
 *   hasShadow:false,460×640,alwaysOnTop("screen-saver" 级);渲染面加载
 *   ?surface=overlay-desktop(main.tsx 表面路由既有分流,不初始化主壳);
 * - 显隐以 showInactive 执行:悬浮窗出现不夺焦点(VRChat 全屏时不打断);
 * - 事件面零新增:broadcastGatewayEvent/isAllowedLocalSender 对 ?surface=
 *   参数 URL 天然放行(前缀/路径匹配),overlay 窗口天然在广播清单内;
 * - 读面 wire 词表不预接(候选核心批 1,017 内联领取声明):渲染面生产
 *   路径恒为诚实 inactive 空态,本窗口层不含任何快照语义;
 * - 生命周期:显隐切换不销毁(hide 保状态);窗口自身关闭(closed)清引用,
 *   下次 toggle 重建;主窗口关闭(closed)销毁 overlay——主窗口关闭＝应用
 *   退出语义不变(window-all-closed 行为不被悬浮窗拖住)。
 */
function createOverlayWindow(): void {
  const preload = path.join(__dirname, "preload.js");
  const win = new BrowserWindow({
    width: OVERLAY_WINDOW_WIDTH,
    height: OVERLAY_WINDOW_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: localWindowWebPreferences(preload),
  });
  win.setAlwaysOnTop(true, OVERLAY_WINDOW_LEVEL);
  overlayWindow = win;
  win.once("ready-to-show", () => {
    if (!win.isDestroyed()) win.showInactive();
  });
  win.on("closed", () => {
    if (overlayWindow === win) overlayWindow = null;
  });
  if (rendererUrl) void win.loadURL(`${rendererUrl}?surface=${OVERLAY_SURFACE_PARAM}`);
  else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"), {
      search: `surface=${OVERLAY_SURFACE_PARAM}`,
    });
  }
}

function toggleOverlayWindow(): { readonly visible: boolean } {
  const exists = overlayWindow !== null && !overlayWindow.isDestroyed();
  const decision = decideOverlayWindowAction({
    exists,
    visible: exists && overlayWindow!.isVisible(),
  });
  if (decision === "create") createOverlayWindow();
  else if (decision === "show") overlayWindow!.showInactive();
  else overlayWindow!.hide();
  return { visible: overlayVisibilityAfterDecision(decision) };
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

  // U9 四分法(本地壳窗口):http/https 弹窗不再交系统浏览器——清单内直行/
  // 清单外确认后转当前内嵌视图(RemoteContentManager);外部协议手势+确认后
  // 交系统;伪协议无条件拒。浏览允许清单与下载域清单严格分开(U9 双轨)
  installLocalContentNavigationPolicy(mainWindow.webContents, {
    rendererUrl,
    allowedOrigins: ["https://booth.pm"],
    // 延迟读取模块变量:弹窗发生时 remoteContent 已随窗口创建
    navigateCurrentView: (url) => {
      remoteContent?.openAfterConfirmation(url);
    },
    openExternal: (url) => void shell.openExternal(url),
    confirmNavigation,
  });
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
  // 真实值随 catalog 契约冻结(F4-1②)调整;违规事件广播到本地来源窗口;
  // 确认层注入使 U9(1) 清单外「提示后放行」与 U9(3) 外部协议确认在视图内生效
  remoteContent = new RemoteContentManager({
    partition: "persist:vua-remote",
    allowedOrigins: ["https://booth.pm"],
    openExternal: (url) => void shell.openExternal(url),
    broadcast: (event) => broadcastRemoteContentEvent(rendererUrl, event),
    confirmNavigation,
    willDownload: (event, item, webContents) => downloadPort?.handleWillDownload(event, item, webContents),
  });
  remoteContent.setHostWindow(mainWindow);
  mainWindow.on("resize", () => remoteContent?.refreshBounds());
  // #26 用户实测退出崩溃修复:内嵌视图清理前移到 close(窗口仍存活,
  // contentView 可安全操作);closed 在窗口销毁之后触发,原在此处 dispose
  // 会经 #destroyView 访问已销毁 hostWindow 抛「Object has been destroyed」。
  // closed 只做引用清理与 overlay 销毁,不再触任何 remoteContent 原生面。
  // close 无取消路径(壳内关闭不经 beforeinput 拦截),dispose 幂等,重复
  // 触发安全
  mainWindow.on("close", () => {
    remoteContent?.dispose();
    remoteContent = null;
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    // 主窗口关闭＝应用退出语义:悬浮窗不拖住 window-all-closed(overlay
    // 窗口随主窗口生命周期销毁,closed 处理器自行清引用)
    overlayWindow?.destroy();
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
