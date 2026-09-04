import { app, BrowserWindow, ipcMain, session, shell } from "electron";
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

function registerIpc(provider: OrchestratorProviderV01): void {
  ipcMain.handle("vua:gateway:invoke", (event, request: unknown) => routeDesktopGatewayInvoke(
    {
      provider,
      productVersion: app.getVersion(),
      platform: process.platform as "win32" | "darwin" | "linux",
      rendererUrl,
    },
    senderFrameUrl(event),
    request,
  ));

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
  const provider = createDesktopOrchestratorProvider();
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
