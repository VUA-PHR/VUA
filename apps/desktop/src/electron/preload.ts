import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import {
  DESKTOP_GATEWAY_VERSION,
  type ApplicationEventV01,
  type DesktopGatewayRequestV1,
  type VuaDesktopApiV1,
} from "@vua/contracts";

/** contextBridge 会克隆回调:持有原监听器到包装器的映射,保证退订精确移除 */
const eventListeners = new WeakMap<
  (event: ApplicationEventV01) => void,
  (event: IpcRendererEvent, payload: ApplicationEventV01) => void
>();

const api: VuaDesktopApiV1 = Object.freeze({
  gateway: Object.freeze({
    version: DESKTOP_GATEWAY_VERSION,
    invoke: (request: DesktopGatewayRequestV1) => ipcRenderer.invoke("vua:gateway:invoke", request),
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
});

contextBridge.exposeInMainWorld("vua", api);
