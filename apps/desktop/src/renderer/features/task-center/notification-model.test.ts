import assert from "node:assert/strict";
import { test } from "vitest";
import {
  activeTaskCount,
  canDismiss,
  isTerminalStatus,
  visibleNotifications,
} from "./notification-model.ts";
import type { TaskItem } from "../../gateway/index.ts";

function taskOf(id: string, status: TaskItem["status"]): TaskItem {
  return {
    id,
    title: `任务 ${id}`,
    status,
    originPage: "warehouse",
    cancellable: false,
  };
}

const tasks = [
  taskOf("t-running", "running"),
  taskOf("t-done", "completed"),
  taskOf("t-failed", "failed"),
  taskOf("t-cancelled", "cancelled"),
];

test("通知投影:默认只显示活动任务,终态不作为通知(核心条件二前半)", () => {
  const visible = visibleNotifications(tasks, new Set(), false);
  assert.deepEqual(
    visible.map((task) => task.id),
    ["t-running"],
  );
});

test("通知投影:显示已完成开启时,未被清除的终态任务作为通知出现", () => {
  const visible = visibleNotifications(tasks, new Set(), true);
  assert.deepEqual(
    visible.map((task) => task.id),
    ["t-running", "t-done", "t-failed", "t-cancelled"],
  );
});

test("通知投影:已清除集合只隐藏通知呈现(核心条件一)", () => {
  const dismissed = new Set(["t-failed"]);
  const visible = visibleNotifications(tasks, dismissed, true);
  assert.deepEqual(
    visible.map((task) => task.id),
    ["t-running", "t-done", "t-cancelled"],
  );
  // 默认视图下同样被隐藏,且活动任务不受清除影响
  assert.deepEqual(
    visibleNotifications(tasks, dismissed, false).map((task) => task.id),
    ["t-running"],
  );
});

test("通知清除合法性:仅终态可清除,活动任务不可", () => {
  assert.equal(canDismiss(taskOf("a", "running")), false);
  assert.equal(canDismiss(taskOf("b", "preparing")), false);
  assert.equal(canDismiss(taskOf("c", "completed")), true);
  assert.equal(canDismiss(taskOf("d", "failed")), true);
  assert.equal(canDismiss(taskOf("e", "cancelled")), true);
  assert.equal(isTerminalStatus("completedWithWarnings"), true);
});

test("进行中计数:queued/preparing/running 计入,终态与等待/暂停不计", () => {
  const mixed = [
    ...tasks,
    taskOf("t-queued", "queued"),
    taskOf("t-preparing", "preparing"),
    taskOf("t-waiting", "waitingInput"),
    taskOf("t-paused", "paused"),
  ];
  assert.equal(activeTaskCount(mixed), 3);
  assert.equal(activeTaskCount([]), 0);
});
