/**
 * 通知中心呈现模型(proposal 007 路径 B,核心两条件下):
 * - 任务权威(SQLite 九态)与快照面不动;通知 = 终态任务的呈现层投影;
 * - 默认只显示活动任务(核心条件二前半:重启后终态任务默认不再作为通知);
 * - 「显示已完成」开启时,未被用户清除的终态任务作为通知显示,并逐条提供清除;
 * - 已清除集合(localStorage 持久化)只影响呈现——任务权威事实仍可经任务
 *   列表/详情面查询(核心条件一:清除的是通知,不是事实)。
 */
import { storageKeys } from "../../app/storage-keys.ts";
import type { TaskStatus } from "../../app/task-status.ts";
import type { TaskItem } from "../../gateway/index.ts";

const TERMINAL: readonly TaskStatus[] = [
  "completed",
  "completedWithWarnings",
  "failed",
  "cancelled",
];

export function isTerminalStatus(status: TaskStatus): boolean {
  return TERMINAL.includes(status);
}

/** 通知列表投影:活动任务恒显;终态任务需「显示已完成」开启且未被清除 */
export function visibleNotifications(
  tasks: readonly TaskItem[],
  dismissed: ReadonlySet<string>,
  showCompleted: boolean,
): readonly TaskItem[] {
  return tasks.filter((task) => {
    if (dismissed.has(task.id)) return false;
    return showCompleted || !isTerminalStatus(task.status);
  });
}

/** 清除动作的合法性:仅终态通知可清除(活动任务不可清除,取消走任务取消) */
export function canDismiss(task: TaskItem): boolean {
  return isTerminalStatus(task.status);
}

const ACTIVE: readonly TaskStatus[] = ["queued", "preparing", "running"];

export function isActiveStatus(status: TaskStatus): boolean {
  return ACTIVE.includes(status);
}

/** 进行中任务计数:通知铃铛徽标与折叠条摘要共用同一口径 */
export function activeTaskCount(tasks: readonly TaskItem[]): number {
  return tasks.filter((task) => isActiveStatus(task.status)).length;
}

/* ---- 已清除集合的持久化(localStorage;存储不可用则仅本次会话生效) ---- */

export function loadDismissedIds(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(storageKeys.notificationDismissed);
    if (raw === null) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function saveDismissedId(taskId: string): ReadonlySet<string> {
  const next = new Set(loadDismissedIds());
  next.add(taskId);
  try {
    window.localStorage.setItem(storageKeys.notificationDismissed, JSON.stringify([...next]));
  } catch {
    /* 存储不可用时仅本次会话生效 */
  }
  return next;
}
