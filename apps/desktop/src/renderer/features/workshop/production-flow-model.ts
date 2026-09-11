import type {
  BuildRecord,
  CapabilityReport,
  InspectionReport,
  MaterialRef,
  ProductionPlan,
  ProductionRunView,
  WorkflowRunState,
} from "../../gateway/index.ts";

/**
 * F3 生产纵向流程表现模型(production-use-case v0.1〔M3 冻结〕+ 设计规范 v0.6.1):
 * 端口数据 → 视图 props 的纯函数;无 IO、无文案字面量(文案 key 由本模型给出,
 * 字符串在 i18n 四表,键与联合类型一一对应,奇偶测试约束)。
 *
 * 色彩纪律(§7.3 / §8.5,车间不用红绿灯):
 * - accent(辖区橙)= 进行中与已完成;
 * - amber(琥珀)= 等待用户确认/处理(待确认计划、确认已过期);
 * - error(红)= 仅阻断(失败、可恢复失败);
 * - neutral = 取消(用户主动结束,非阻断)。
 */

/** 流程阶段(展示语义):由 runState + 数据齐备度推导,不改 11 态冻结词表。
 *  键与 strings.productionFlow.phase 一一对应 */
export type ProductionFlowPhase =
  | "inspecting"
  | "inspectionReady"
  | "planning"
  | "awaiting"
  | "executing"
  | "recovering"
  | "completed"
  | "cancelled"
  | "failed"
  | "failedRecoverable"
  | "expired";

export const productionFlowPhases: readonly ProductionFlowPhase[] = [
  "inspecting",
  "inspectionReady",
  "planning",
  "awaiting",
  "executing",
  "recovering",
  "completed",
  "cancelled",
  "failed",
  "failedRecoverable",
  "expired",
];

export type FlowTone = "accent" | "amber" | "error" | "neutral";

/** 动作禁用原因(§5:禁用关键动作必须给出可发现原因);
 *  键与 strings.productionFlow.disabledReasons 一一对应 */
export type FlowDisabledReason =
  | "runActive"
  | "flowPending"
  | "noInspection"
  | "notPlannable"
  | "noPlan"
  | "notAwaiting"
  | "notRecoverable";

export const flowDisabledReasons: readonly FlowDisabledReason[] = [
  "runActive",
  "flowPending",
  "noInspection",
  "notPlannable",
  "noPlan",
  "notAwaiting",
  "notRecoverable",
];

export type ActionAvailability =
  | { enabled: true }
  | { enabled: false; reason: FlowDisabledReason };

/** 当前阶段的主操作(§5:每屏至多一个主操作;进行中阶段无主操作) */
export type FlowPrimaryAction = "start" | "requestPlan" | "confirm" | "recover" | null;

export interface FlowCards {
  readonly inspection: boolean;
  readonly plan: boolean;
  readonly recover: boolean;
  readonly buildRecord: boolean;
}

export interface ProductionFlowReady {
  readonly kind: "run";
  readonly phase: ProductionFlowPhase;
  readonly tone: FlowTone;
  readonly runState: WorkflowRunState;
  readonly runId: string;
  readonly taskId: string;
  readonly source: MaterialRef;
  readonly inspection: InspectionReport | null;
  readonly plan: ProductionPlan | null;
  readonly buildRecord: BuildRecord | null;
  /** 检查/计划内容随任务进行尚未回传:对应卡片渲染 Skeleton(§6.3) */
  readonly inspectionLoading: boolean;
  readonly planLoading: boolean;
  readonly cards: FlowCards;
  readonly primaryAction: FlowPrimaryAction;
  readonly actions: {
    readonly startInspection: ActionAvailability;
    readonly requestPlan: ActionAvailability;
    readonly confirmPlan: ActionAvailability;
    readonly recover: ActionAvailability;
  };
}

/**
 * 流程模型三态:
 * - hidden:production capability 未知(加载中,Taskbar 先例)或非 ready,
 *   入口整条不出现(§2.6),而非禁用;
 * - empty:能力就绪但尚无生产运行(not-connected),呈现素材入口 + 诚实空态;
 * - run:有运行,卡片与动作按阶段给出。
 */
export type ProductionFlowModel =
  | { kind: "hidden" }
  | { kind: "empty" }
  | ProductionFlowReady;

type RunView = Extract<ProductionRunView, { kind: "run" }>;

/** runState → 展示阶段;取消是任务事实而非工作流状态(草案取消纪律),
 *  由 run.cancelled 优先表达,runState 保留取消发生的最后阶段 */
export function phaseOfRun(run: RunView): ProductionFlowPhase {
  if (run.cancelled) return "cancelled";
  switch (run.runState) {
    case "inspect":
      return run.inspection === null ? "inspecting" : "inspectionReady";
    case "plan":
      return "planning";
    case "await_confirmation":
      return "awaiting";
    case "snapshot":
    case "execute":
    case "validate":
      return "executing";
    case "recover":
      return "recovering";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "failed_recoverable":
      return "failedRecoverable";
    case "expired":
      return "expired";
  }
}

/** 阶段 → 色彩(纪律见文件头;switch 穷尽,新增阶段不映射即编译错误) */
export function toneForPhase(phase: ProductionFlowPhase): FlowTone {
  switch (phase) {
    case "awaiting":
    case "expired":
      return "amber";
    case "failed":
    case "failedRecoverable":
      return "error";
    case "cancelled":
      return "neutral";
    case "inspecting":
    case "inspectionReady":
    case "planning":
    case "executing":
    case "recovering":
    case "completed":
      return "accent";
  }
}

function cardsFor(run: RunView, phase: ProductionFlowPhase): FlowCards {
  return {
    inspection: run.inspection !== null || phase === "inspecting",
    plan: run.plan !== null || phase === "planning",
    recover: phase === "failedRecoverable" || phase === "expired" || phase === "recovering",
    buildRecord: run.buildRecord !== null,
  };
}

function actionsFor(run: RunView, phase: ProductionFlowPhase): ProductionFlowReady["actions"] {
  const startInspection: ActionAvailability =
    phase === "completed" || phase === "cancelled" || phase === "failed"
      ? { enabled: true }
      : phase === "inspectionReady" || phase === "failedRecoverable" || phase === "expired"
        ? // 当前流程尚未结案:先完成确认或恢复,不静默顶替(可发现原因)
          { enabled: false, reason: "flowPending" }
        : { enabled: false, reason: "runActive" };

  const requestPlan: ActionAvailability =
    run.inspection === null
      ? { enabled: false, reason: "noInspection" }
      : run.inspection.plannability === "not_plannable"
        ? { enabled: false, reason: "notPlannable" }
        : phase !== "inspectionReady"
          ? { enabled: false, reason: "flowPending" }
          : { enabled: true };

  const confirmPlan: ActionAvailability =
    run.plan === null
      ? { enabled: false, reason: "noPlan" }
      : phase !== "awaiting"
        ? { enabled: false, reason: "notAwaiting" }
        : { enabled: true };

  const recover: ActionAvailability =
    phase === "failedRecoverable" || phase === "expired"
      ? { enabled: true }
      : { enabled: false, reason: "notRecoverable" };

  return { startInspection, requestPlan, confirmPlan, recover };
}

/** 阶段 → 主操作(switch 穷尽) */
function primaryForPhase(phase: ProductionFlowPhase): FlowPrimaryAction {
  switch (phase) {
    case "inspectionReady":
      return "requestPlan";
    case "awaiting":
      return "confirm";
    case "failedRecoverable":
    case "expired":
      return "recover";
    case "completed":
    case "cancelled":
    case "failed":
      return "start";
    case "inspecting":
    case "planning":
    case "executing":
    case "recovering":
      return null;
  }
}

/** 端口数据 → 流程视图 props(纯函数) */
export function productionFlowModel(
  run: ProductionRunView,
  capability: CapabilityReport | null,
): ProductionFlowModel {
  if (capability === null || capability.state !== "ready") return { kind: "hidden" };
  if (run.kind === "not-connected") return { kind: "empty" };
  const phase = phaseOfRun(run);
  return {
    kind: "run",
    phase,
    tone: toneForPhase(phase),
    runState: run.runState,
    runId: run.runId,
    taskId: run.taskId,
    source: run.source,
    inspection: run.inspection,
    plan: run.plan,
    buildRecord: run.buildRecord,
    inspectionLoading: phase === "inspecting",
    planLoading: phase === "planning",
    cards: cardsFor(run, phase),
    primaryAction: primaryForPhase(phase),
    actions: actionsFor(run, phase),
  };
}
