import {
  isTerminalTaskStateV01,
  type EnvironmentCheckItemV01,
  type EnvironmentPresenceV01,
  type EnvironmentSnapshotV01,
  type TaskSnapshotV01,
  type TaskStateV01,
} from "@vua/contracts";
import type { TaskStatus } from "../app/task-status.ts";
import type { CheckItem, CheckStatus, CheckZone, DeployerView } from "../features/deployer/deployer-model.ts";
import type { EnvironmentView } from "./environment-port.ts";
import type { TaskItem } from "./task-port.ts";
import { strings } from "../i18n/index.ts";

/**
 * 契约 → 表现层投影(契约"与表现层的衔接"一节):
 * 投射必须穷尽——契约新增状态而本表未覆盖时编译失败,而不是静默落默认分支。
 * 投射不改变契约事实:缓存与诊断一律引用契约原值。
 */

/** 任务九态 → 表现层九态;`satisfies` 保证契约每个状态都有唯一投射 */
const TASK_STATE_PROJECTION = {
  queued: "queued",
  preparing: "preparing",
  running: "running",
  waiting_for_input: "waitingInput",
  paused: "paused",
  succeeded: "completed",
  succeeded_with_warnings: "completedWithWarnings",
  failed: "failed",
  cancelled: "cancelled",
} as const satisfies Readonly<Record<TaskStateV01, TaskStatus>>;

export function projectTaskState(state: TaskStateV01): TaskStatus {
  return TASK_STATE_PROJECTION[state];
}

/**
 * TaskSnapshotV01 → 任务中心条目。
 * - title:契约 v0.1 尚无标题负载(F3 首个真实用例引入);演示任务给本地化
 *   标签,其余任务如实展示 taskId,不伪造标题;
 * - cancellable:由应用层事实派生(未请求取消且非终态),前端不自行猜测;
 * - errorText:契约错误码(工程事实);本地化错误文案随 F3 诊断切片接入。
 */
export function projectTaskItem(task: TaskSnapshotV01): TaskItem {
  return {
    id: task.taskId,
    title: task.taskId.startsWith("demo-") ? strings.taskCenter.demoTaskTitle : task.taskId,
    status: projectTaskState(task.state),
    originPage: "home",
    cancellable: !task.cancellationRequested && !isTerminalTaskStateV01(task.state),
    ...(task.error === undefined ? {} : { errorText: task.error.code }),
    // 重启恢复(M2):遗留非终态任务如实标注,前端不得当作仍在执行
    ...(task.recoveryDisposition === "inspect_required" ? { errorText: "inspect_required" } : {}),
  };
}

/**
 * 在场事实 → 部署器严重度的消费侧缺省裁决(契约明确严重度由消费侧决定):
 * detected → ok,not_detected → warning,detection_failed → error。
 * F6 环境切片引入检查项文案注册表后,此缺省由注册表替换。
 */
const PRESENCE_SEVERITY: Readonly<Record<EnvironmentPresenceV01, CheckStatus>> = {
  detected: "ok",
  not_detected: "warning",
  detection_failed: "error",
};

function projectCheckItem(item: EnvironmentCheckItemV01): CheckItem {
  return {
    id: item.checkId,
    zone: item.zone,
    title: item.checkId,
    status: PRESENCE_SEVERITY[item.presence],
    description: item.errorCode ?? item.presence,
  };
}

/**
 * 环境快照 → 部署器视图:两个辖区各自独立呈现;辖区无检查项时仍给出
 * "results + 空列表"(检测确实执行过),由 summarizeHealth 呈现诚实空态。
 * 版本轨道未接入(版本源属 F6/B6),整块为空数组,表现层不渲染。
 */
export function projectEnvironmentSnapshot(snapshot: EnvironmentSnapshotV01): EnvironmentView & { deployer: DeployerView } {
  const byZone = (zone: CheckZone) =>
    snapshot.items.filter((item) => item.zone === zone).map(projectCheckItem);
  return {
    schemaVersion: 1,
    deployer: {
      zones: {
        play: { kind: "results", items: byZone("play"), checkedAt: snapshot.capturedAt },
        create: { kind: "results", items: byZone("create"), checkedAt: snapshot.capturedAt },
      },
    },
    versions: { play: [], create: [] },
  };
}
