import { contextBridge, ipcRenderer } from "electron";
import {
  DESKTOP_GATEWAY_VERSION,
  type DesktopGatewayRequestV1,
  type VuaDesktopApiV1,
} from "@vua/contracts";

const api: VuaDesktopApiV1 = Object.freeze({
  gateway: Object.freeze({
    version: DESKTOP_GATEWAY_VERSION,
    invoke: (request: DesktopGatewayRequestV1) => ipcRenderer.invoke("vua:gateway:invoke", request),
  }),
  window: Object.freeze({
    minimize: () => ipcRenderer.invoke("vua:window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("vua:window:toggle-maximize"),
    close: () => ipcRenderer.invoke("vua:window:close"),
  }),
});

contextBridge.exposeInMainWorld("vua", api);
