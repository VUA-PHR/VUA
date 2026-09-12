/**
 * Overlay 表面端口(architecture:桌面置顶覆盖层与 VR Dashboard 共用同一展示状态)。
 * 契约边界:前端只读快照 + 三个语义动作(open_on_desktop/dismiss/request_cancel_task),
 * 事实来源在应用层(overlay.getSnapshot 冻结读面);取消是请求语义——应用层
 * 裁决后任务在安全边界结束,前端不假设即时生效。
 *
 * 017 表面批 1 消费接线:live 实现(overlay-port-live.ts,经 Desktop Gateway
 * 按需轮询)为生产装配;DEV 演示端口的装配见 overlay-port-instance.ts
 * (import.meta.env.DEV 折叠 + 动态 import,mock 不出 DEV)。
 */
import type {
  OverlayAction,
  OverlayActionPayload,
  OverlayDispatchResult,
  OverlaySnapshot,
} from "./overlay-contract.ts";

export type {
  OverlayAction,
  OverlayActionPayload,
  OverlayDispatchResult,
  OverlaySnapshot,
  OverlayStatusTone,
} from "./overlay-contract.ts";

export type Unsubscribe = () => void;

export interface OverlaySurfacePort {
  /** 只读快照:渲染前拉取;订阅推送到达前不得把本地缓存当事实来源。
   *  传输失败 reject(表面呈现失败+重试);unavailable 缺席以快照两态
   *  表达(不伪装成空数据)。 */
  snapshot(): Promise<OverlaySnapshot>;
  /** 订阅快照刷新(事件事实通知驱动重取;显影才有订阅者,不常驻轮询) */
  subscribe(callback: (snapshot: OverlaySnapshot) => void): Unsubscribe;
  /** 提交语义动作;应用层裁决 ok / rejected(rejected 回最新快照) */
  dispatch(action: OverlayAction, payload?: OverlayActionPayload): Promise<OverlayDispatchResult>;
}
