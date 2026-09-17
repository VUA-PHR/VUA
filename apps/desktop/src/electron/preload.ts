import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  ApplicationEventV01,
  DesktopGatewayRequestV1,
  EditorSettingsV1,
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
    // U10 手选编辑器路径(021 收敛点 4:双态浏览;取消返回 null)
    pickEditorExecutable: () => ipcRenderer.invoke("vua:dialog:pick-editor-path", "executable"),
    pickEditorDirectory: () => ipcRenderer.invoke("vua:dialog:pick-editor-path", "directory"),
  }),
  // 壳编辑器设置(U10 门③留痕:手选值物理持久化归桌面机器级 settings,
  // 核心经 VUA_UNITY_EDITOR 注入消费)
  editorSettings: Object.freeze({
    read: () => ipcRenderer.invoke("vua:editor-settings:read"),
    save: (settings: EditorSettingsV1) => ipcRenderer.invoke("vua:editor-settings:save", settings),
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
    // Overlay 置顶窗开关(proposal 017 实现面备注):同一 preload 契约面对
    // 主窗口与 overlay 窗口共用,零新增连接语义
    toggleOverlay: () => ipcRenderer.invoke("vua:overlay:toggle"),
  }),
  // 远程内容窄面(F4-2):只发语义动作;远程页面本身无 preload、无本面
  remoteContent: Object.freeze({
    open: (request: { readonly url: string }) => ipcRenderer.invoke("vua:remote-content:open", request),
    navigate: (viewId: string, url: string) => ipcRenderer.invoke("vua:remote-content:navigate", viewId, url),
    goBack: (viewId: string) => ipcRenderer.invoke("vua:remote-content:go-back", viewId),
    goForward: (viewId: string) => ipcRenderer.invoke("vua:remote-content:go-forward", viewId),
    reload: (viewId: string) => ipcRenderer.invoke("vua:remote-content:reload", viewId),
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
  // 壳能力自报(proposal 015 §11 方案 a):能力拥有者静态声明;呈现两态由
  // 渲染层据此驱动(端到端可用才翻转呈现,desktop 架构 1.1.0)。
  // BOARD #36 缺陷④呈现修(2026-09-18):remoteBrowser 恒 false = 壳层能力
  // 设计现状(F4 起,非回归)——自报 true 会让素材导入页云端段呈现可用的
  // 「VUA 内嵌浏览」面板而能力实际未开放;不可用的选项不提供,翻转回
  // false 后面板按两态纪律诚实降级。能力面开放属功能决策,届时按「端到端
  // 可用」证据翻转本标志,渲染层零改动
  capabilities: Object.freeze({
    remoteBrowser: false,
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
