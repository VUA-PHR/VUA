import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  ApplicationEventV01,
  DesktopGatewayRequestV1,
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

const api: VuaDesktopApiV1 = Object.freeze({
  gateway: Object.freeze({
    version: DESKTOP_GATEWAY_VERSION,
    invoke: (request: DesktopGatewayRequestV1) => ipcRenderer.invoke("vua:gateway:invoke", request),
  }),
  dialog: Object.freeze({
    pickMaterialSource: (intake: "direct_unity_package" | "local_reusable_vpm") =>
      ipcRenderer.invoke("vua:dialog:pick-material-source", intake),
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
});

contextBridge.exposeInMainWorld("vua", api);
