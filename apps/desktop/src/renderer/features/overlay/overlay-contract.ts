/**
 * Overlay 表面契约的渲染层本地镜像(v1,切片五/F7a)。
 *
 * 语义来源:docs/architecture/integrations-and-overlays_ZH.md §Overlay——桌面与
 * VR Overlay 共享同一展示状态,经窄化 Surface Port 获取版本化快照并只回语义
 * 动作;docs/design/design-standard-v0.6.1_ZH.md §8.8——Overlay 只展示稳定快照
 * 和语义动作。正式版本化契约随 Kernel/VR helper 接线切片进入 packages/contracts;
 * 此前本镜像是唯一事实来源,接入时必须以此对齐,不得另造第二套词表。
 */

import type { WorkflowStage } from "../../gateway/index.ts";

/** 三个语义动作:Overlay 表面(桌面置顶窗 / VR Dashboard)只发送这些 */
export type OverlayAction = "open_on_desktop" | "dismiss" | "request_cancel_task";

/** 状态基调(展示语义;视觉映射由表现模型负责,契约不带颜色词):
 * - inactive:无活动(未接入/空会话),表面呈现诚实空态;
 * - active:有进行中工作;
 * - waiting:等待用户确认/处理;
 * - blocked:阻断或失败(唯一允许红色语义的基调)。 */
export type OverlayStatusTone = "inactive" | "active" | "waiting" | "blocked";

export const overlayStatusTones: readonly OverlayStatusTone[] = [
  "inactive",
  "active",
  "waiting",
  "blocked",
];

/** 环境摘要项的运行状态词表(与 strings.overlay.environmentStates 一一对应) */
export type OverlayEnvironmentState = "ready" | "running" | "missing";

export const overlayEnvironmentStates: readonly OverlayEnvironmentState[] = [
  "ready",
  "running",
  "missing",
];

/** 环境摘要行(只读):id 是不透明标识,展示名与环境状态文案在字符串表 */
export interface OverlayEnvironmentItemV1 {
  readonly id: string;
  readonly state: OverlayEnvironmentState;
}

/** 当前任务卡;progress 为 null 表示没有真实总量——表面只显示阶段,不注水 */
export interface OverlayTaskV1 {
  readonly title: string;
  readonly stage: WorkflowStage;
  readonly progress: { readonly done: number; readonly total: number } | null;
  /** request_cancel_task 的前置条件之一(另需动作在 allowedActions 中) */
  readonly cancellable: boolean;
}

export interface OverlayStatusV1 {
  readonly tone: OverlayStatusTone;
  /** 数据负载文案(随快照下发,非界面字符串) */
  readonly title: string;
  readonly detail?: string;
}

export interface OverlayPresentationV1 {
  readonly locale: string;
  readonly textScale: number;
  readonly reducedMotion: boolean;
}

export interface OverlaySnapshotV1 {
  readonly schemaVersion: 1;
  /** 单调递增;动作携带 expectedRevision 的裁决语义同教程端口(stale 回最新快照) */
  readonly revision: number;
  readonly presentation: OverlayPresentationV1;
  readonly status: OverlayStatusV1;
  readonly task: OverlayTaskV1 | null;
  /** 环境摘要(只读,≤ 数行;长列表属桌面主窗,不进 Overlay) */
  readonly environment: readonly OverlayEnvironmentItemV1[];
  /** 服务端按状态下发的合法动作集合 */
  readonly allowedActions: readonly OverlayAction[];
}

export type OverlayDispatchResultV1 =
  | { readonly kind: "ok"; readonly snapshot: OverlaySnapshotV1 }
  | { readonly kind: "stale"; readonly snapshot: OverlaySnapshotV1 }
  | {
      readonly kind: "rejected";
      readonly reason: "unknown_action" | "action_not_allowed";
      readonly snapshot: OverlaySnapshotV1;
    };

/** 端口侧惯用短名(与 V1 类型一一对应;同 tutorial-contract 惯例) */
export type OverlaySnapshot = OverlaySnapshotV1;
export type OverlayDispatchResult = OverlayDispatchResultV1;
