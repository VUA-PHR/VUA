/**
 * Overlay 表面端口(architecture:桌面置顶覆盖层与 VR Dashboard 共用同一展示状态)。
 * 契约边界:前端只读快照 + 三个语义动作(open_on_desktop/dismiss/request_cancel_task),
 * 任务与环境状态的事实来源在应用层;取消是请求语义——应用层裁决后任务在安全边界
 * 结束,前端不假设即时生效。
 *
 * Electron 迁移(本切片):live 实现(经 Desktop Gateway)随 Overlay 接线切片接入;
 * 当前提供 inactive 占位——快照恒为安全空态,dispatch 一律 rejected,诚实呈现
 * "Overlay 服务未接入",不伪造会话。DEV 演示端口的装配见 overlay-port-instance.ts。
 */
import type {
  OverlayAction,
  OverlayDispatchResult,
  OverlaySnapshot,
} from "./overlay-contract.ts";

export type {
  OverlayAction,
  OverlayDispatchResult,
  OverlayEnvironmentState,
  OverlaySnapshot,
  OverlayStatusTone,
} from "./overlay-contract.ts";

export type Unsubscribe = () => void;

export interface OverlaySurfacePort {
  /** 只读快照:渲染前拉取;订阅推送到达前不得把本地缓存当事实来源 */
  snapshot(): Promise<OverlaySnapshot>;
  /** 订阅快照广播(revision 缺口或动作被拒时以全量快照重新同步) */
  subscribe(callback: (snapshot: OverlaySnapshot) => void): Unsubscribe;
  /** 提交语义动作;应用层裁决 ok / stale(回最新快照) / rejected */
  dispatch(action: OverlayAction): Promise<OverlayDispatchResult>;
}

const inactiveSnapshot: OverlaySnapshot = {
  schemaVersion: 1,
  revision: 0,
  presentation: {
    locale: "zh-CN",
    textScale: 1,
    reducedMotion: false,
  },
  status: { tone: "inactive", title: "" },
  task: null,
  environment: [],
  allowedActions: [],
};

/** 未接入占位实现:永远 inactive,dispatch 一律 rejected(浏览器预览/未接入路径) */
export function createInactiveOverlayPort(): OverlaySurfacePort {
  return {
    snapshot: () => Promise.resolve(inactiveSnapshot),
    subscribe: () => () => {},
    dispatch: () =>
      Promise.resolve({
        kind: "rejected",
        reason: "action_not_allowed",
        snapshot: inactiveSnapshot,
      }),
  };
}
