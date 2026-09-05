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

/* ---- 远程内容策略(F4 隔离浏览;所有权边界见 docs/architecture/desktop_ZH):
 * Main 持有 Session/WebContentsView,远程页面按来源允许清单导航,权限默认
 * 全拒绝,下载默认拒绝(F4-3 下载端口接管后替换),违规透明上报不静默。 ---- */

export type RemoteContentViolationReason =
  | "origin_not_allowed"
  | "download_denied"
  | "popup_denied"
  | "permission_denied";

export type RemoteContentViolationObserver = (url: string, reason: RemoteContentViolationReason) => void;

function remoteOriginOf(url: string): { protocol: string; host: string; port: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    // 端口属于 origin 语义:显式端口与协议默认端口(https 443 / http 80)
    // 归一,避免 127.0.0.1:A 与 127.0.0.1:B 互相同源
    const defaultPort = parsed.protocol === "https:" ? "443" : "80";
    return {
      protocol: parsed.protocol,
      host: parsed.hostname.toLowerCase(),
      port: parsed.port === "" ? defaultPort : parsed.port,
    };
  } catch {
    return null;
  }
}

/** 远程来源允许判定:https/http + 协议、主机(点后缀子域语义)与端口一致 */
export function isAllowedRemoteOrigin(url: string, allowedOrigins: readonly string[]): boolean {
  const target = remoteOriginOf(url);
  if (target === null) return false;
  return allowedOrigins.some((allowed) => {
    const origin = remoteOriginOf(allowed);
    if (origin === null) return false;
    if (origin.protocol !== target.protocol) return false;
    if (origin.port !== target.port) return false;
    return target.host === origin.host || target.host.endsWith(`.${origin.host}`);
  });
}

export interface RemoteContentPolicyOptions {
  readonly allowedOrigins: readonly string[];
  readonly openExternal: ExternalUrlOpener;
  readonly onViolation?: RemoteContentViolationObserver;
}

/** 单个远程视图的导航面:允许清单外导航阻止并上报;新窗口一律拒绝,
 *  http(s) 弹窗目标交系统浏览器(登录/购买交还官方工具的既有纪律) */
export function installRemoteContentNavigationPolicy(
  webContents: WebContents,
  options: RemoteContentPolicyOptions,
): void {
  webContents.setWindowOpenHandler(({ url }) => {
    options.onViolation?.(url, "popup_denied");
    if (url.startsWith("https://") || url.startsWith("http://")) void options.openExternal(url);
    return { action: "deny" };
  });
  webContents.on("will-navigate", (event, url) => {
    if (!isAllowedRemoteOrigin(url, options.allowedOrigins)) {
      event.preventDefault();
      options.onViolation?.(url, "origin_not_allowed");
    }
  });
}

/** 远程分区 Session 面:权限请求全拒绝;下载默认拒绝——`willDownload`
 *  接缝存在时委托给下载端口(F4-3 接管,策略拒绝由端口 preventDefault),
 *  不存在则保持安全默认并上报 */
export function installRemoteContentSessionPolicy(
  targetSession: Session,
  options: Pick<RemoteContentPolicyOptions, "onViolation"> & {
    readonly willDownload?: (
      event: { readonly preventDefault: () => void },
      item: import("electron").DownloadItem,
      webContents: import("electron").WebContents,
    ) => void;
  },
): void {
  installPermissionDenyPolicy(targetSession, (permission, requestingUrl) => {
    options.onViolation?.(requestingUrl, "permission_denied");
  });
  if (options.willDownload) {
    const willDownload = options.willDownload;
    targetSession.on("will-download", (event, item, webContents) => {
      willDownload(event, item, webContents);
    });
  } else {
    targetSession.on("will-download", (event, item) => {
      event.preventDefault();
      options.onViolation?.(item.getURL(), "download_denied");
    });
  }
}
