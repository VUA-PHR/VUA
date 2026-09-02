import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import path from "node:path";
import {
  DESKTOP_GATEWAY_MAX_REQUEST_BYTES,
  DESKTOP_GATEWAY_VERSION,
  isDesktopGatewayRequestV1,
  requestByteLength,
  type DesktopGatewayResponseV1,
} from "@vua/contracts";
import { isAllowedLocalSender, localWindowWebPreferences } from "./security.js";

const rendererUrl = process.env.VUA_RENDERER_URL;
let mainWindow: BrowserWindow | null = null;

function assertLocalSender(senderUrl: string): void {
  if (!isAllowedLocalSender(senderUrl, rendererUrl)) throw new Error("untrusted renderer origin");
}

function senderFrameUrl(event: Electron.IpcMainInvokeEvent): string {
  return event.senderFrame?.url ?? "";
}

function registerIpc(): void {
  ipcMain.handle("vua:gateway:invoke", (event, request: unknown): DesktopGatewayResponseV1 => {
    assertLocalSender(senderFrameUrl(event));
    const requestId =
      request !== null && typeof request === "object" && typeof (request as { requestId?: unknown }).requestId === "string"
        ? (request as { requestId: string }).requestId
        : "invalid";
    if (requestByteLength(request) > DESKTOP_GATEWAY_MAX_REQUEST_BYTES || !isDesktopGatewayRequestV1(request)) {
      return {
        schemaVersion: DESKTOP_GATEWAY_VERSION,
        requestId,
        ok: false,
        error: { code: "invalid_request", messageKey: "errors.gateway.invalidRequest" },
      };
    }
    return {
      schemaVersion: DESKTOP_GATEWAY_VERSION,
      requestId: request.requestId,
      ok: true,
      value: {
        schemaVersion: 1,
        productVersion: app.getVersion(),
        runtime: "electron",
        platform: process.platform as "win32" | "darwin" | "linux",
        capabilities: { gateway: true, tasks: false, remoteBrowser: false },
      },
    };
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedLocalSender(url, rendererUrl)) event.preventDefault();
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  if (rendererUrl) await mainWindow.loadURL(rendererUrl);
  else await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  registerIpc();
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
