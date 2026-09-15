import {
  isReleaseHandoffFactV01,
  RELEASE_HANDOFF_ERROR_CODES_V01,
  type ReleaseHandoffErrorCodeV01,
  type ReleaseHandoffFactV01,
} from "@vua/contracts";
import type { HandoffTaskView } from "./release-handoff-port.ts";

/**
 * release.openForHandoff 呈现模型(023 消费切片):
 * - task.get 回执 → 交接任务视图的纯投影;只做字段存在性收窄与九态投影,
 *   不解释、不猜测、不重算(照 release-records-model 先例);
 * - 任务九态词表原样透传:running 视图携带原词,UI 文案对表 strings.taskStatus,
 *   词表外原样呈现(与 recordListStatusLabel 同纪律——诚实纪律 1);
 * - 交接事实经 contracts isReleaseHandoffFactV01 守卫(additionalProperties
 *   false 五键闭集,无上传状态字段)——事实不可解释 = fact-unexplainable,
 *   如实呈现,绝不合成;
 * - 受理错误码对 contracts RELEASE_HANDOFF_ERROR_CODES_V01 闭集对表,
 *   闭集外原样透传,不猜测映射。
 */

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
    return isReleaseHandoffFactV01(fact)
      ? { kind: "succeeded", fact: fact as ReleaseHandoffFactV01 }
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
export function isReleaseHandoffErrorCode(code: string): code is ReleaseHandoffErrorCodeV01 {
  return (RELEASE_HANDOFF_ERROR_CODES_V01 as readonly string[]).includes(code);
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
