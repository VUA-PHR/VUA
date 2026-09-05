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

function remoteOriginOf(url: string): { protocol: string; host: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return { protocol: parsed.protocol, host: parsed.hostname.toLowerCase() };
  } catch {
    return null;
  }
}

/** 远程来源允许判定:https/http + 主机相等或子域(allowed 条目的点后缀语义) */
export function isAllowedRemoteOrigin(url: string, allowedOrigins: readonly string[]): boolean {
  const target = remoteOriginOf(url);
  if (target === null) return false;
  return allowedOrigins.some((allowed) => {
    const origin = remoteOriginOf(allowed);
    if (origin === null) return false;
    if (origin.protocol !== target.protocol) return false;
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

/** 远程分区 Session 面:权限请求全拒绝;下载默认拒绝(F4-3 下载端口
 *  接管后由端口替换本钩子),两次拒绝都以违规事件透明上报 */
export function installRemoteContentSessionPolicy(
  targetSession: Session,
  options: Pick<RemoteContentPolicyOptions, "onViolation">,
): void {
  installPermissionDenyPolicy(targetSession, (permission, requestingUrl) => {
    options.onViolation?.(requestingUrl, "permission_denied");
  });
  targetSession.on("will-download", (event, item) => {
    event.preventDefault();
    options.onViolation?.(item.getURL(), "download_denied");
  });
}
