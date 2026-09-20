import { taskErrorMessage } from "../../i18n/diagnostics.ts";
import { useRef } from "react";
import { monotonicDone } from "../../app/busy-timing.ts";
import { Button } from "../../components/primitives/Button.tsx";
import { Icon, type IconName } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type { TaskItem } from "../../gateway/index.ts";
import type { TaskStatus } from "../../app/task-status.ts";

const copy = strings.taskCenter;
const statusCopy = strings.taskStatus;

const statusGlyph: Record<TaskStatus, IconName> = {
  queued: "clock",
  preparing: "arrow-right",
  running: "arrow-right",
  waitingInput: "question",
  paused: "clock",
  completed: "check",
  completedWithWarnings: "warning",
  failed: "error-circle",
  cancelled: "close",
};

function TaskRow({
  task,
  rejected,
  onCancel,
  onRetry,
  onDismiss,
  onBackToOrigin,
}: {
  task: TaskItem;
  rejected: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onDismiss?: (() => void) | undefined;
  onBackToOrigin: () => void;
}) {
  // 单调进度地板(S-XIV-4):快照乱序/重算导致的回退不显示;
  // 行按 task.id key 挂载,ref 即该任务的历史最大 done;上限钳制到 total
  const maxDoneRef = useRef<number | null>(null);
  if (task.progress) {
    maxDoneRef.current = monotonicDone(maxDoneRef.current, task.progress.done);
  }
  const done =
    task.progress && maxDoneRef.current !== null
      ? Math.min(maxDoneRef.current, task.progress.total)
      : null;
  return (
    <li className="vua-taskbar__task">
      <span className="vua-taskbar__task-glyph" data-status={task.status}>
        <Icon name={statusGlyph[task.status]} size={16} />
      </span>
      {/* 行主区 = 打开按钮(W25 走查 D2):活动/终态两态一致回来源页,
          不做静默无响应;可访问名说明动作与目标,行内动作按钮在其外 */}
      <button
        type="button"
        className="vua-taskbar__task-main"
        onClick={onBackToOrigin}
        aria-label={`${copy.backToOrigin}: ${task.title}`}
      >
        <span className="vua-taskbar__task-title">{task.title}</span>
        <span className="vua-taskbar__task-meta vua-caption">
          <span className="vua-taskbar__task-status" data-status={task.status}>
            {statusCopy[task.status]}
          </span>
          {task.progress && done !== null ? (
            <span className="vua-text-secondary">
              {format(copy.progress, { done, total: task.progress.total })}
            </span>
          ) : null}
        </span>
        {task.errorText ? (
          <span className="vua-caption vua-text-secondary">{taskErrorMessage(task.errorText)} <code>{task.errorText}</code></span>
        ) : null}
        {rejected ? <span className="vua-taskbar__rejected vua-caption">{copy.cancelRejected}</span> : null}
      </button>
      <div className="vua-taskbar__task-actions">
        <Button variant="subtle" onClick={onBackToOrigin}>
          {copy.backToOrigin}
        </Button>
        {task.cancellable ? (
          <Button variant="subtle" onClick={onCancel}>
            {copy.cancel}
          </Button>
        ) : null}
        {task.status === "failed" ? (
          <Button variant="subtle" onClick={onRetry}>
            {copy.retry}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button variant="subtle" onClick={onDismiss}>
            {copy.clear}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * 通知列表本体:底部任务条展开面板与顶栏铃铛弹出层共用同一份内容,
 * 两个入口只是容器不同(锚点/动效/毛玻璃),列表语义一致。
 */
export function NotificationList({
  notifications,
  rejectedId,
  showCompleted,
  onShowCompletedChange,
  onCancel,
  onRetry,
  dismissible,
  onBackToOrigin,
  emptyText,
  replay,
}: {
  notifications: readonly TaskItem[];
  rejectedId: string | null;
  showCompleted: boolean;
  onShowCompletedChange: (value: boolean) => void;
  onCancel: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  dismissible: (task: TaskItem) => (() => void) | undefined;
  onBackToOrigin: (task: TaskItem) => void;
  /** 空态文案:底部条 null 时不渲染空态(维持原条状外观),铃铛面板传入诚实空态 */
  emptyText: string | null;
  replay: (() => void) | null;
}) {
  return (
    <>
      {notifications.length > 0 ? (
        <ul className="vua-taskbar__list">
          {notifications.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              rejected={rejectedId === task.id}
              onCancel={() => onCancel(task.id)}
              onRetry={() => onRetry(task.id)}
              onDismiss={dismissible(task)}
              onBackToOrigin={() => onBackToOrigin(task)}
            />
          ))}
        </ul>
      ) : emptyText !== null ? (
        <p className="vua-taskbar__empty vua-caption">{emptyText}</p>
      ) : null}
      <div className="vua-taskbar__filters">
        <label className="vua-taskbar__show-completed">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(event) => onShowCompletedChange(event.target.checked)}
          />{" "}
          {copy.showCompleted}
        </label>
      </div>
      {replay ? (
        <div className="vua-taskbar__devtools">
          <Button variant="subtle" onClick={replay}>
            {copy.replay}
          </Button>
        </div>
      ) : null}
    </>
  );
}
