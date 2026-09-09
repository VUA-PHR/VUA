import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  ApplicationEventV01,
  DesktopGatewayRequestV1,
  NavigationConfirmRequestV1,
  RemoteContentEventV1,
  VuaDesktopApiV1,
} from "@vua/contracts";

// 沙箱 preload 只允许 require electron 白名单模块:@vua/contracts 在此仅做
// 类型导入(编译期擦除,不产生运行时 require)。DESKTOP_GATEWAY_VERSION 以
// 本地字面量对齐,漂移由 packages/contracts 的契约测试把守。
const DESKTOP_GATEWAY_VERSION = 1 as const;

/** contextBridge 会克隆回调:持有原监听器到包装器的映射,保证退订精确移除 */
const eventListeners = new WeakMap<
  (event: ApplicationEventV01) => void,
  (event: IpcRendererEvent, payload: ApplicationEventV01) => void
>();

const remoteContentListeners = new WeakMap<
  (event: RemoteContentEventV1) => void,
  (event: IpcRendererEvent, payload: RemoteContentEventV1) => void
>();

const navConfirmListeners = new WeakMap<
  (request: NavigationConfirmRequestV1) => void,
  (event: IpcRendererEvent, payload: NavigationConfirmRequestV1) => void
>();

const api: VuaDesktopApiV1 = Object.freeze({
  gateway: Object.freeze({
    version: DESKTOP_GATEWAY_VERSION,
    invoke: (request: DesktopGatewayRequestV1) => ipcRenderer.invoke("vua:gateway:invoke", request),
  }),
  dialog: Object.freeze({
    pickMaterialSource: (intake: "direct_unity_package" | "local_reusable_vpm") =>
      ipcRenderer.invoke("vua:dialog:pick-material-source", intake),
    pickWarehouseFolders: () => ipcRenderer.invoke("vua:dialog:pick-warehouse-folders"),
  }),
  events: Object.freeze({
    subscribe: (listener: (event: ApplicationEventV01) => void) => {
      const wrapped = (_event: IpcRendererEvent, payload: ApplicationEventV01) => listener(payload);
      eventListeners.set(listener, wrapped);
      ipcRenderer.on("vua:gateway:event", wrapped);
      return () => {
        const wrappedListener = eventListeners.get(listener);
        if (wrappedListener) ipcRenderer.removeListener("vua:gateway:event", wrappedListener);
        eventListeners.delete(listener);
      };
    },
  }),
  window: Object.freeze({
    minimize: () => ipcRenderer.invoke("vua:window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("vua:window:toggle-maximize"),
    close: () => ipcRenderer.invoke("vua:window:close"),
  }),
  // 远程内容窄面(F4-2):只发语义动作;远程页面本身无 preload、无本面
  remoteContent: Object.freeze({
    open: (request: { readonly url: string }) => ipcRenderer.invoke("vua:remote-content:open", request),
    navigate: (viewId: string, url: string) => ipcRenderer.invoke("vua:remote-content:navigate", viewId, url),
    close: (viewId: string) => ipcRenderer.invoke("vua:remote-content:close", viewId),
    setVisible: (viewId: string, visible: boolean) =>
      ipcRenderer.invoke("vua:remote-content:set-visible", viewId, visible),
    events: Object.freeze({
      subscribe: (listener: (event: RemoteContentEventV1) => void) => {
        const wrapped = (_event: IpcRendererEvent, payload: RemoteContentEventV1) => listener(payload);
        remoteContentListeners.set(listener, wrapped);
        ipcRenderer.on("vua:remote-content:event", wrapped);
        return () => {
          const wrappedListener = remoteContentListeners.get(listener);
          if (wrappedListener) ipcRenderer.removeListener("vua:remote-content:event", wrappedListener);
          remoteContentListeners.delete(listener);
        };
      },
    }),
  }),
  // 壳能力自报(proposal 015 §11 方案 a):能力拥有者静态声明;内嵌浏览
  // 基座(remote-content + U9 导航策略)随本壳交付,呈现两态由渲染层据此
  // 驱动(端到端可用才翻转呈现,desktop 架构 1.1.0)
  capabilities: Object.freeze({
    remoteBrowser: true,
  }),
  // 导航确认流(015 §12,批 B-3):Main 发确认请求,渲染层以 i18n 确认卡
  // 作答;确认在前/逐次无记忆,用户不答=不执行
  navigationConfirm: Object.freeze({
    respond: (confirmId: string, approved: boolean) =>
      ipcRenderer.invoke("vua:nav-confirm:respond", confirmId, approved),
    events: Object.freeze({
      subscribe: (listener: (request: NavigationConfirmRequestV1) => void) => {
        const wrapped = (_event: IpcRendererEvent, payload: NavigationConfirmRequestV1) =>
          listener(payload);
        navConfirmListeners.set(listener, wrapped);
        ipcRenderer.on("vua:nav-confirm:request", wrapped);
        return () => {
          const wrappedListener = navConfirmListeners.get(listener);
          if (wrappedListener) ipcRenderer.removeListener("vua:nav-confirm:request", wrappedListener);
          navConfirmListeners.delete(listener);
        };
      },
    }),
  }),
});

contextBridge.exposeInMainWorld("vua", api);
