import type { Session, WebContents, WebPreferences } from "electron";

export type ExternalUrlOpener = (url: string) => void | Promise<void>;
export type PermissionRequestObserver = (permission: string, requestingUrl: string) => void;

export function localWindowWebPreferences(preload?: string): WebPreferences {
  return {
    ...(preload ? { preload } : {}),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
  };
}

export function isAllowedLocalSender(url: string, rendererUrl?: string): boolean {
  if (rendererUrl) return url === rendererUrl || url.startsWith(`${rendererUrl}/`);
  try {
    const parsed = new URL(url);
    return parsed.protocol === "file:" && parsed.pathname.replaceAll("\\", "/").endsWith("/dist/renderer/index.html");
  } catch {
    return false;
  }
}

export function installPermissionDenyPolicy(
  targetSession: Session,
  observeRequest?: PermissionRequestObserver,
): void {
  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    observeRequest?.(permission, details.requestingUrl || webContents.getURL());
    callback(false);
  });
}

export function installLocalContentNavigationPolicy(
  webContents: WebContents,
  rendererUrl: string | undefined,
  openExternal: ExternalUrlOpener,
): void {
  webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) void openExternal(url);
    return { action: "deny" };
  });
  webContents.on("will-navigate", (event, url) => {
    if (!isAllowedLocalSender(url, rendererUrl)) event.preventDefault();
  });
}
