/**
 * Overlay 双表面表现模型(切片五 F7a,设计规范 v0.6.1 §8.8):
 * 快照 + 输入形态 → 视图 props 的纯函数;无 IO、无文案字面量(文案 key 由
 * 本模型给出,字符串在 i18n 四表,枚举键与 TS 联合一一对应,测试约束)。
 *
 * 色彩纪律(§8.8 + §7.3 延伸,Overlay 不用红绿灯):
 * - accent(辖区色,Overlay 属 VUA 紫)= 进行中;
 * - amber(琥珀)= 等待用户确认/处理;
 * - error(红)= 仅阻断/失败;
 * - neutral = 无活动/已结束(取消是用户主动结束,非阻断)。
 *
 * 形态差异(桌面=键鼠,VR=激光点按):
 * - open_on_desktop 只在 VR 表面出现(桌面窗口自身即落点,同教程表面纪律);
 * - request_cancel_task 桌面常驻(不可用时禁用并给出原因键),
 *   VR 仅在有任务时出现(更少的元素、更大的目标);
 * - 环境摘要桌面 ≤4 行、VR ≤3 行(§8.8:不用长列表),超出以计数折叠;
 * - 主操作每表面至多一个:桌面 = dismiss,VR = open_on_desktop(桌面回退始终可见)。
 */
import type { WorkflowStage } from "../../gateway/index.ts";
import type {
  OverlayAction,
  OverlayEnvironmentItemV1,
  OverlaySnapshot,
  OverlayStatusTone,
} from "./overlay-contract.ts";

export type OverlayInputMode = "desktop" | "vr";

export type OverlayVisualTone = "neutral" | "accent" | "amber" | "error";

/** 动作禁用原因(§5:禁用关键动作必须给出可发现原因);
 *  键与 strings.overlay.disabledReasons 一一对应 */
export type OverlayDisabledReason = "notAllowed" | "noTask" | "notCancellable";

export const overlayDisabledReasons: readonly OverlayDisabledReason[] = [
  "notAllowed",
  "noTask",
  "notCancellable",
];

export type OverlayActionAvailability =
  | { readonly enabled: true }
  | { readonly enabled: false; readonly reason: OverlayDisabledReason };

export interface OverlayActionView {
  readonly action: OverlayAction;
  readonly visible: boolean;
  readonly availability: OverlayActionAvailability;
  readonly primary: boolean;
}

export interface OverlayTaskView {
  readonly title: string;
  /** 阶段词表键(strings.workflowStage[stage]);原样透传冻结词表,不自造枚举 */
  readonly stage: WorkflowStage;
  /** null = 没有真实总量:表面只显示阶段,不注水进度 */
  readonly progress: { readonly done: number; readonly total: number } | null;
}

export type OverlayViewState = "inactive" | "ready";

export interface OverlayViewModel {
  readonly state: OverlayViewState;
  readonly tone: OverlayVisualTone;
  readonly statusTone: OverlayStatusTone;
  readonly statusTitle: string;
  readonly statusDetail: string | null;
  readonly task: OverlayTaskView | null;
  readonly environment: readonly OverlayEnvironmentItemV1[];
  /** 超出本形态行数上限而被折叠的环境行数(0 = 无折叠) */
  readonly hiddenEnvironmentCount: number;
  readonly actions: readonly OverlayActionView[];
  readonly textScale: number;
  readonly reducedMotion: boolean;
}

const DESKTOP_ENVIRONMENT_LIMIT = 4;
const VR_ENVIRONMENT_LIMIT = 3;

/** status.tone → 视觉基调(switch 穷尽,新增基调不映射即编译错误) */
export function toneForStatus(tone: OverlayStatusTone): OverlayVisualTone {
  switch (tone) {
    case "inactive":
      return "neutral";
    case "active":
      return "accent";
    case "waiting":
      return "amber";
    case "blocked":
      return "error";
  }
}

export function overlayViewModel(
  snapshot: OverlaySnapshot,
  mode: OverlayInputMode,
): OverlayViewModel {
  const { task, allowedActions } = snapshot;
  const allowed = (action: OverlayAction) => allowedActions.includes(action);

  const cancelAvailability: OverlayActionAvailability = !allowed("request_cancel_task")
    ? { enabled: false, reason: "notAllowed" }
    : task === null
      ? { enabled: false, reason: "noTask" }
      : task.cancellable
        ? { enabled: true }
        : { enabled: false, reason: "notCancellable" };

  const openOnDesktopAvailability: OverlayActionAvailability = allowed("open_on_desktop")
    ? { enabled: true }
    : { enabled: false, reason: "notAllowed" };

  const dismissAvailability: OverlayActionAvailability = allowed("dismiss")
    ? { enabled: true }
    : { enabled: false, reason: "notAllowed" };

  const openOnDesktopVisible = mode === "vr";
  const cancelVisible = mode === "desktop" || task !== null;

  // 主操作:VR 的桌面回退优先;不可用时退到 dismiss;桌面恒为 dismiss
  const primary: OverlayAction | null =
    mode === "vr"
      ? openOnDesktopAvailability.enabled
        ? "open_on_desktop"
        : dismissAvailability.enabled
          ? "dismiss"
          : null
      : dismissAvailability.enabled
        ? "dismiss"
        : null;

  const actions: readonly OverlayActionView[] = [
    {
      action: "open_on_desktop",
      visible: openOnDesktopVisible,
      availability: openOnDesktopAvailability,
      primary: primary === "open_on_desktop",
    },
    {
      action: "request_cancel_task",
      visible: cancelVisible,
      availability: cancelAvailability,
      // 主操作恒为 dismiss(desktop)/ open_on_desktop(vr),取消不成为主操作
      primary: false,
    },
    {
      action: "dismiss",
      visible: true,
      availability: dismissAvailability,
      primary: primary === "dismiss",
    },
  ];

  const environmentLimit = mode === "vr" ? VR_ENVIRONMENT_LIMIT : DESKTOP_ENVIRONMENT_LIMIT;

  return {
    // inactive = 无任务、无可用动作、无环境摘要(与未接入占位/dismiss 后同形);
    // 取消后的会话仍带 dismiss/open_on_desktop 动作与环境摘要,不算 inactive
    state:
      task === null && allowedActions.length === 0 && snapshot.environment.length === 0
        ? "inactive"
        : "ready",
    tone: toneForStatus(snapshot.status.tone),
    statusTone: snapshot.status.tone,
    statusTitle: snapshot.status.title,
    statusDetail: snapshot.status.detail ?? null,
    task: task === null ? null : { title: task.title, stage: task.stage, progress: task.progress },
    environment: snapshot.environment.slice(0, environmentLimit),
    hiddenEnvironmentCount: Math.max(0, snapshot.environment.length - environmentLimit),
    actions,
    textScale: snapshot.presentation.textScale,
    reducedMotion: snapshot.presentation.reducedMotion,
  };
}
