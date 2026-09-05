import { WebContentsView, session, type BrowserWindow, type Rectangle, type Session } from "electron";
import type { RemoteContentEventV1, RemoteContentViewStateV1 } from "@vua/contracts";
import {
  installRemoteContentNavigationPolicy,
  installRemoteContentSessionPolicy,
  isAllowedRemoteOrigin,
  type ExternalUrlOpener,
  type RemoteContentViolationObserver,
} from "./security.js";

/**
 * 远程内容管理器(F4 隔离基座):Main 持有的 `WebContentsView` 生命周期与
 * 隔离边界(docs/architecture/desktop_ZH:独立 partition Session 保存独立远程
 * 存储;远程页面无 preload、无 Node、能力面只含标准 Web API)。
 *
 * - Renderer 只经窄面发语义动作(open/navigate/close/setVisible),任何
 *   Electron 对象、Cookie、下载令牌都不过 IPC;
 * - 允许清单外的导航与打开动作在 Main 拒绝(打开动作以错误 reject,视图内
 *   用户点击以 blocked 事件透明上报);
 * - 下载默认拒绝(F4-3 下载端口接管后替换 session 钩子);
 * - 视图占满宿主窗口内容区是骨架行为:标题栏让位与画中画式布局由表现层
 *   切片(F4-5)经 setBounds 区域化,本模块只提供窗口尺寸跟随。
 */

export interface RemoteContentManagerOptions {
  /** 独立 Session partition(persist: 前缀保存独立远程存储) */
  readonly partition: string;
  readonly allowedOrigins: readonly string[];
  readonly openExternal: ExternalUrlOpener;
  readonly broadcast: (event: RemoteContentEventV1) => void;
}

interface ManagedView {
  readonly view: WebContentsView;
  readonly viewId: string;
  visible: boolean;
}

export class RemoteContentManager {
  readonly #options: RemoteContentManagerOptions;
  readonly #session: Session;
  readonly #views = new Map<string, ManagedView>();
  #hostWindow: BrowserWindow | null = null;
  #sequence = 0;
  #disposed = false;

  constructor(options: RemoteContentManagerOptions) {
    this.#options = options;
    this.#session = session.fromPartition(options.partition);
    const onViolation: RemoteContentViolationObserver = (url, reason) => {
      this.#broadcast({ kind: "blocked", viewId: "", url, reason });
    };
    installRemoteContentSessionPolicy(this.#session, { onViolation });
  }

  setHostWindow(window: BrowserWindow | null): void {
    this.#hostWindow = window;
  }

  open(url: string): RemoteContentViewStateV1 {
    this.#assertUsable();
    if (!isAllowedRemoteOrigin(url, this.#options.allowedOrigins)) {
      throw new Error("origin_not_allowed");
    }
    this.#sequence += 1;
    const viewId = `rc-${this.#sequence}-${crypto.randomUUID()}`;
    const view = new WebContentsView({
      webPreferences: {
        // 无 preload:远程内容能力面只含标准 Web API(隔离红线)
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        partition: this.#options.partition,
      },
    });
    const managed: ManagedView = { view, viewId, visible: true };
    this.#views.set(viewId, managed);
    const onViolation: RemoteContentViolationObserver = (violationUrl, reason) => {
      this.#broadcast({ kind: "blocked", viewId, url: violationUrl, reason });
    };
    installRemoteContentNavigationPolicy(view.webContents, {
      allowedOrigins: this.#options.allowedOrigins,
      openExternal: this.#options.openExternal,
      onViolation,
    });
    view.webContents.on("did-navigate", () => this.#broadcastNavigated(managed));
    view.webContents.on("did-navigate-in-page", () => this.#broadcastNavigated(managed));
    view.webContents.on("render-process-gone", () => {
      this.#broadcast({ kind: "view-closed", viewId });
      this.#destroyView(viewId);
    });
    this.#attach(managed);
    this.#broadcast({ kind: "view-opened", viewId, url });
    void view.webContents.loadURL(url);
    return this.#stateOf(managed);
  }

  navigate(viewId: string, url: string): RemoteContentViewStateV1 {
    this.#assertUsable();
    const managed = this.#requireView(viewId);
    if (!isAllowedRemoteOrigin(url, this.#options.allowedOrigins)) {
      throw new Error("origin_not_allowed");
    }
    void managed.view.webContents.loadURL(url);
    return this.#stateOf(managed);
  }

  close(viewId: string): void {
    this.#requireView(viewId);
    this.#broadcast({ kind: "view-closed", viewId });
    this.#destroyView(viewId);
  }

  setVisible(viewId: string, visible: boolean): RemoteContentViewStateV1 {
    const managed = this.#requireView(viewId);
    managed.visible = visible;
    managed.view.setVisible(visible);
    if (visible) this.#applyBounds(managed);
    return this.#stateOf(managed);
  }

  /** 宿主窗口尺寸变化时重排可见视图(骨架行为:占满内容区) */
  refreshBounds(): void {
    for (const managed of this.#views.values()) {
      if (managed.visible) this.#applyBounds(managed);
    }
  }

  closeAll(): void {
    for (const viewId of [...this.#views.keys()]) {
      this.#broadcast({ kind: "view-closed", viewId });
      this.#destroyView(viewId);
    }
  }

  #attach(managed: ManagedView): void {
    const window = this.#requireHost();
    window.contentView.addChildView(managed.view);
    this.#applyBounds(managed);
  }

  #applyBounds(managed: ManagedView): void {
    const window = this.#requireHost();
    const bounds: Rectangle = window.getContentBounds();
    managed.view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
  }

  #requireHost(): BrowserWindow {
    if (this.#hostWindow === null) throw new Error("remote content host window is not attached");
    return this.#hostWindow;
  }

  #requireView(viewId: string): ManagedView {
    const managed = this.#views.get(viewId);
    if (managed === undefined) throw new Error("unknown_remote_view");
    return managed;
  }

  #destroyView(viewId: string): void {
    const managed = this.#views.get(viewId);
    if (managed === undefined) return;
    this.#views.delete(viewId);
    this.#hostWindow?.contentView.removeChildView(managed.view);
    managed.view.webContents.close();
  }

  #broadcastNavigated(managed: ManagedView): void {
    const contents = managed.view.webContents;
    this.#broadcast({
      kind: "navigated",
      viewId: managed.viewId,
      url: contents.getURL(),
      canGoBack: contents.navigationHistory.canGoBack(),
      canGoForward: contents.navigationHistory.canGoForward(),
    });
  }

  #stateOf(managed: ManagedView): RemoteContentViewStateV1 {
    const contents = managed.view.webContents;
    return {
      viewId: managed.viewId,
      url: contents.getURL(),
      visible: managed.visible,
      canGoBack: contents.navigationHistory.canGoBack(),
      canGoForward: contents.navigationHistory.canGoForward(),
    };
  }

  #broadcast(event: RemoteContentEventV1): void {
    // session 级违规(下载/权限)发生在 viewId 归属前:携带空 viewId 上报,
    // 渲染层按全局违规提示呈现;视图级违规恒有具体 viewId
    if (this.#disposed) return;
    this.#options.broadcast(event);
  }

  #assertUsable(): void {
    if (this.#disposed) throw new Error("remote content manager is disposed");
  }

  dispose(): void {
    this.#disposed = true;
    this.closeAll();
    this.setHostWindow(null);
  }
}
