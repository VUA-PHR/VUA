import { useEffect, useRef, useState } from "react";
import { monotonicDone } from "../../app/busy-timing.ts";
import { Button } from "../../components/primitives/Button.tsx";
import { Icon, type IconName } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import {
  useGateway,
  useTaskCenter,
  type CapabilityReport,
  type FixtureTaskPort,
  type TaskItem,
} from "../../gateway/index.ts";
import type { PageId } from "../../app/nav-model.ts";
import type { TaskStatus } from "../../app/task-status.ts";
import "./taskbar.css";

const copy = strings.taskCenter;
const statusCopy = strings.taskStatus;

/**
 * 任务中心(ui-ux-standard §4.4 任务栏,§7.4 九态):
 * 折叠条显示运行中任务摘要,点击展开列表浮层;列表提供"回到来源页"
 * 回跳与取消意图。状态事实来源在应用层(TaskPort),本组件只是视图:
 * 取消由端口裁决 ok / rejected,rejected 时行内提示,不自行推断。
 *
 * 入口显隐(§2.6):capability 非 ready 时整条不出现(而非禁用)。
 */
const statusGlyph: Record<TaskStatus, IconName> = {
  queued: "clock",
  preparing: "arrow-right",
  running: "arrow-right",
  waitingInput: "question",
  paused: "clock",
  completed: "check",
  completedWithWarnings: "warning",
  failed: "close",
  cancelled: "close",
};

const activeStatuses: readonly TaskStatus[] = ["queued", "preparing", "running"];

function TaskRow({
  task,
  rejected,
  onCancel,
  onBackToOrigin,
}: {
  task: TaskItem;
  rejected: boolean;
  onCancel: () => void;
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
      <div className="vua-taskbar__task-main">
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
          <span className="vua-caption vua-text-secondary">{task.errorText}</span>
        ) : null}
        {rejected ? <span className="vua-taskbar__rejected vua-caption">{copy.cancelRejected}</span> : null}
      </div>
      <div className="vua-taskbar__task-actions">
        <Button variant="subtle" onClick={onBackToOrigin}>
          {copy.backToOrigin}
        </Button>
        {task.cancellable ? (
          <Button variant="subtle" onClick={onCancel}>
            {copy.cancel}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function Taskbar({ navigate }: { navigate: (target: PageId) => void }) {
  const gateway = useGateway();
  const view = useTaskCenter();
  const [capability, setCapability] = useState<CapabilityReport | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [rejectedId, setRejectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.task.capability().then((report) => {
      if (active) setCapability(report);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  // §2.6:任务引擎未接入(unavailable)时入口整条不出现
  if (capability?.state !== "ready") return null;

  const running = view.tasks.filter((task) => activeStatuses.includes(task.status));
  const summary =
    running.length > 0
      ? format(copy.runningSummary, { title: running[0]!.title, count: running.length })
      : copy.idleSummary;

  async function handleCancel(taskId: string) {
    const result = await gateway.task.cancel(taskId);
    setRejectedId(result.kind === "rejected" ? taskId : null);
  }

  // DEV 演示回放:仅 fixture 任务端口实现该可选方法时才出现
  const replay =
    import.meta.env.DEV && "replayDemoEvents" in gateway.task
      ? () => (gateway.task as FixtureTaskPort).replayDemoEvents?.()
      : null;

  return (
    <div className="vua-shell__taskbar">
      {expanded && (view.tasks.length > 0 || replay) ? (
        <div className="vua-taskbar__panel" role="region" aria-label={copy.title}>
          {view.tasks.length > 0 ? (
            <ul className="vua-taskbar__list">
              {view.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  rejected={rejectedId === task.id}
                  onCancel={() => void handleCancel(task.id)}
                  onBackToOrigin={() => {
                    setExpanded(false);
                    navigate(task.originPage);
                  }}
                />
              ))}
            </ul>
          ) : null}
          {replay ? (
            <div className="vua-taskbar__devtools">
              <Button variant="subtle" onClick={replay}>
                {copy.replay}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        className="vua-taskbar__toggle"
        aria-expanded={expanded}
        aria-label={expanded ? copy.collapseAria : format(copy.expandAria, { count: view.tasks.length })}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="vua-taskbar__summary">{summary}</span>
      </button>
    </div>
  );
}
