import {
  isReleaseHandoffFactV02,
  RELEASE_HANDOFF_ERROR_CODES_V02,
  type ReleaseHandoffErrorCodeV02,
  type ReleaseHandoffFactV02,
} from "@vua/contracts";
import { format } from "../../i18n/format.ts";
import {
  isBuildRecordStatusV03,
  type BuildRecordStatusV03,
} from "./release-records-model.ts";
import type { HandoffTaskView } from "./release-handoff-port.ts";

/**
 * release.openForHandoff 呈现模型(023 消费切片;TS 面随族升 0.2):
 * - task.get 回执 → 交接任务视图的纯投影;只做字段存在性收窄与九态投影,
 *   不解释、不猜测、不重算(照 release-records-model 先例);
 * - 任务九态词表原样透传:running 视图携带原词,UI 文案对表 strings.taskStatus,
 *   词表外原样呈现(与 recordListStatusLabel 同纪律——诚实纪律 1);
 * - 交接事实经 contracts isReleaseHandoffFactV02 守卫(additionalProperties
 *   false 五键闭集,无上传状态字段;schemaVersion "0.2" 随族单源推进)——
 *   事实不可解释 = fact-unexplainable,如实呈现,绝不合成;
 * - 受理错误码对 contracts RELEASE_HANDOFF_ERROR_CODES_V02 闭集对表,
 *   闭集外原样透传,不猜测映射。
 */

/**
 * U19 交棒准入呈现投影(桌面呈现面;后端权威判断独立在路由准入序——本投影
 * 只决定 UI 呈现桶,绝不预断后端受理结果,直连调用照会被权威闸以类型化
 * 拒绝原词应答):
 * - allowed:交棒动作呈现(succeeded_with_warnings 的警告徽标照常在场,
 *   不因放行而遮蔽——裁决「放行保留警告呈现」);
 * - blocked:交棒动作不呈现,呈现禁用原因 + 诊断/恢复/重新生产入口链
 *   (failed/cancelled/rolled_back 三态,state 携原词供原因词面);
 * - blocked-recovered:recovered 权威态禁用(≠任务 inspect_required,两套
 *   状态不混用)——呈现「先完成检视及后续生产流程」+ 检视入口;
 * - unconfirmed:记录缺失或状态词表外 → 拒绝词面「记录无法确认」,
 *   不猜测状态(诚实纪律 1)。
 */
export type HandoffAdmissionView =
  | { readonly kind: "allowed"; readonly warnings: boolean }
  | { readonly kind: "blocked"; readonly state: "failed" | "cancelled" | "rolled_back" }
  | { readonly kind: "blocked-recovered" }
  | { readonly kind: "unconfirmed" };

/** 六态闭集期望表(Record 完备性:contracts 六态扩员即编译错,测试侧显式
 *  期望表同律防回摆) */
const ADMISSION_TABLE: Readonly<Record<BuildRecordStatusV03, HandoffAdmissionView>> = {
  succeeded: { kind: "allowed", warnings: false },
  succeeded_with_warnings: { kind: "allowed", warnings: true },
  failed: { kind: "blocked", state: "failed" },
  cancelled: { kind: "blocked", state: "cancelled" },
  rolled_back: { kind: "blocked", state: "rolled_back" },
  recovered: { kind: "blocked-recovered" },
};

/** 构建记录状态原词(或 null=记录无法确认)→ 交棒准入呈现视图;
 *  词表外状态一律 unconfirmed,不猜测(与 recordListStatusLabel 同律) */
export function handoffAdmission(status: string | null): HandoffAdmissionView {
  if (status === null) return { kind: "unconfirmed" };
  return isBuildRecordStatusV03(status) ? ADMISSION_TABLE[status] : { kind: "unconfirmed" };
}

/** intent-failed 词面表(组件层以 strings 喂入;模型层零 strings 依赖) */
export interface HandoffIntentErrorFaces {
  readonly failedUnknown: string;
  readonly failedWithCode: string;
  readonly codeInvalidParams: string;
  readonly codeBuildUnknown: string;
  readonly codeEditorUnresolved: string;
  /** {state}:准入闸拦截词面(state=记录状态原词插值) */
  readonly stateBlocked: string;
  /** 准入闸「记录无法确认」词面(无插值) */
  readonly stateUnknown: string;
}

/**
 * release.openForHandoff 受理拒绝 → 呈现词面(纯函数;调用方传词面表):
 * - 准入闸两码(contracts v0.2 闭集登记成员,词面已四表在位)先行对表——
 *   stateBlocked 需 params state 非空串才组词面,缺席退回原码词面(占位符
 *   不猜测,format 缺参保留占位符的纪律下宁退回原码不输出半句);
 * - 既有闭集三码照 023 词面映射;unavailable 在端口层已呈缺席,不到此处;
 * - 其余码(含 contracts 闭集外)原样透传,不猜测映射(诚实纪律)。
 */
export function handoffIntentErrorText(
  code: string | null,
  params: Readonly<Record<string, string | number | boolean>>,
  faces: HandoffIntentErrorFaces,
): string {
  if (code === null) return faces.failedUnknown;
  // 准入闸两码=contracts v0.2 六码闭集登记成员(字面照冻结 Schema 逐字)
  if (code === "vua.release_handoff.record_state_unknown") return faces.stateUnknown;
  if (code === "vua.release_handoff.record_state_blocked") {
    const state = params.state;
    return typeof state === "string" && state.length > 0
      ? format(faces.stateBlocked, { state })
      : format(faces.failedWithCode, { code });
  }
  if (code === "vua.release_handoff.invalid_params") return faces.codeInvalidParams;
  if (code === "vua.release_handoff.build_unknown") return faces.codeBuildUnknown;
  if (code === "vua.release_handoff.editor_unresolved") return faces.codeEditorUnresolved;
  // 闭集外错误码原样透传呈现,不猜测映射(诚实纪律)
  return format(faces.failedWithCode, { code });
}

/** 任务九态词表(呈现投影用;权威在 contracts TaskStateV01) */
const TASK_STATES: readonly string[] = [
  "queued",
  "preparing",
  "running",
  "waiting_for_input",
  "paused",
  "succeeded",
  "succeeded_with_warnings",
  "failed",
  "cancelled",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** task.get 回执值 → 任务快照形状收窄({ contractVersion, task } 包装或裸
 *  快照,先例同 live-production-port taskFromValue);形状不符 = null */
function taskSnapshotFrom(value: unknown): Record<string, unknown> | null {
  if (!isPlainObject(value)) return null;
  if (isPlainObject(value.task)) return value.task;
  if (isNonEmptyString(value.taskId) && isNonEmptyString(value.state)) return value;
  return null;
}

/** 任务快照 → 交接任务视图(纯投影;见文件头纪律) */
export function projectHandoffTask(snapshot: unknown): HandoffTaskView | null {
  const task = taskSnapshotFrom(snapshot);
  if (task === null) return null;
  const state = task.state;
  if (!isNonEmptyString(state)) return null;
  if (state === "succeeded" || state === "succeeded_with_warnings") {
    const fact = task.result;
    return isReleaseHandoffFactV02(fact)
      ? { kind: "succeeded", fact: fact as ReleaseHandoffFactV02 }
      : { kind: "fact-unexplainable" };
  }
  if (state === "failed") {
    const error = task.error;
    const errorCode =
      isPlainObject(error) && isNonEmptyString(error.code) ? error.code : null;
    const messageKey =
      isPlainObject(error) && isNonEmptyString(error.messageKey) ? error.messageKey : null;
    return { kind: "failed", state, errorCode, messageKey };
  }
  if (state === "cancelled") return { kind: "cancelled" };
  // 非终态(含九态外原词):原样透传,不猜测
  return { kind: "running", state };
}

/** 九态词表内判定(运行态文案对表用;词表外 UI 原样呈现原词) */
export function isKnownTaskState(state: string): boolean {
  return TASK_STATES.includes(state);
}

/** 受理错误码是否在 release_handoff 闭集内(呈现文案对表用) */
export function isReleaseHandoffErrorCode(code: string): code is ReleaseHandoffErrorCodeV02 {
  return (RELEASE_HANDOFF_ERROR_CODES_V02 as readonly string[]).includes(code);
}

/** strings.taskStatus 文案键(与 contract-projection TASK_STATE_PROJECTION
 *  同表;此处独立持有以保持 feature 模型零 gateway 内部依赖) */
export type TaskStatusLabelKey =
  | "queued"
  | "preparing"
  | "running"
  | "waitingInput"
  | "paused"
  | "completed"
  | "completedWithWarnings"
  | "failed"
  | "cancelled";

const TASK_STATE_LABEL_KEYS: Readonly<Record<string, TaskStatusLabelKey>> = {
  queued: "queued",
  preparing: "preparing",
  running: "running",
  waiting_for_input: "waitingInput",
  paused: "paused",
  succeeded: "completed",
  succeeded_with_warnings: "completedWithWarnings",
  failed: "failed",
  cancelled: "cancelled",
};

/** 任务九态原词 → taskStatus 文案键;词表外 = null(UI 原样呈现原词,
 *  与 recordListStatusLabel 同纪律——诚实纪律 1) */
export function taskStateLabelKey(state: string): TaskStatusLabelKey | null {
  return TASK_STATE_LABEL_KEYS[state] ?? null;
}
