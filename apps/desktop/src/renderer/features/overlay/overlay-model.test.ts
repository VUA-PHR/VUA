/**
 * Overlay 表现模型测试(切片五 F7a):
 * - 有/无任务 × desktop/vr × inactive/失败态的矩阵覆盖;
 * - 色彩纪律映射(进行=accent、等待=amber、阻断=error、inactive=neutral);
 * - 动作可用性与禁用原因键、形态差异(open_on_desktop 仅 VR、环境截断);
 * - 枚举奇偶:disabledReasons/environmentStates/statusTones 键与 TS 联合一一对应。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import { strings } from "../../i18n/index.ts";
import {
  overlayEnvironmentStates,
  overlayStatusTones,
  type OverlaySnapshot,
} from "./overlay-contract.ts";
import {
  overlayDisabledReasons,
  overlayViewModel,
  toneForStatus,
} from "./overlay-model.ts";

function makeSnapshot(overrides: Partial<OverlaySnapshot> = {}): OverlaySnapshot {
  return {
    schemaVersion: 1,
    revision: 1,
    presentation: { locale: "zh-CN", textScale: 1, reducedMotion: false },
    status: { tone: "active", title: "demo status" },
    task: {
      title: "demo task",
      stage: "execute",
      progress: { done: 3, total: 6 },
      cancellable: true,
    },
    environment: [
      { id: "steamvr", state: "running" },
      { id: "unity", state: "ready" },
      { id: "vrchat", state: "running" },
      { id: "vpm", state: "ready" },
    ],
    allowedActions: ["open_on_desktop", "dismiss", "request_cancel_task"],
    ...overrides,
  };
}

const inactiveSnapshot = makeSnapshot({
  status: { tone: "inactive", title: "" },
  task: null,
  environment: [],
  allowedActions: [],
});

function actionView(model: ReturnType<typeof overlayViewModel>, action: string) {
  const view = model.actions.find((entry) => entry.action === action);
  assert.ok(view, `missing action view: ${action}`);
  return view;
}

test("tone 映射穷尽:进行=accent、等待=amber、阻断=error、inactive=neutral", () => {
  assert.equal(toneForStatus("active"), "accent");
  assert.equal(toneForStatus("waiting"), "amber");
  assert.equal(toneForStatus("blocked"), "error");
  assert.equal(toneForStatus("inactive"), "neutral");
});

test("inactive 占位快照(未接入/dismiss 后):两形态均为 inactive,区块全隐", () => {
  for (const mode of ["desktop", "vr"] as const) {
    const model = overlayViewModel(inactiveSnapshot, mode);
    assert.equal(model.state, "inactive");
    assert.equal(model.tone, "neutral");
    assert.equal(model.task, null);
    assert.equal(model.environment.length, 0);
    for (const action of model.actions) {
      assert.equal(action.availability.enabled, false);
      assert.equal(action.primary, false);
    }
  }
});

test("进行中任务 × desktop:任务卡/环境(≤4)可见,open_on_desktop 不出现,主操作=dismiss", () => {
  const model = overlayViewModel(makeSnapshot(), "desktop");
  assert.equal(model.state, "ready");
  assert.equal(model.tone, "accent");
  assert.deepEqual(model.task, {
    title: "demo task",
    stage: "execute",
    progress: { done: 3, total: 6 },
  });
  assert.equal(model.environment.length, 4);
  assert.equal(model.hiddenEnvironmentCount, 0);
  assert.equal(actionView(model, "open_on_desktop").visible, false);
  assert.equal(actionView(model, "request_cancel_task").visible, true);
  assert.equal(actionView(model, "request_cancel_task").availability.enabled, true);
  const dismiss = actionView(model, "dismiss");
  assert.equal(dismiss.visible, true);
  assert.equal(dismiss.availability.enabled, true);
  assert.equal(dismiss.primary, true);
});

test("进行中任务 × vr:环境截断 ≤3 且计数折叠,open_on_desktop 可见且为主操作", () => {
  const model = overlayViewModel(makeSnapshot(), "vr");
  assert.equal(model.state, "ready");
  assert.equal(model.environment.length, 3);
  assert.equal(model.hiddenEnvironmentCount, 1);
  const open = actionView(model, "open_on_desktop");
  assert.equal(open.visible, true);
  assert.equal(open.availability.enabled, true);
  assert.equal(open.primary, true);
  assert.equal(actionView(model, "request_cancel_task").visible, true);
  assert.equal(actionView(model, "dismiss").primary, false);
});

test("无真实总量不注水:progress=null 原样透传,表面只显示阶段", () => {
  const snapshot = makeSnapshot({
    task: { title: "demo task", stage: "validate", progress: null, cancellable: true },
  });
  for (const mode of ["desktop", "vr"] as const) {
    const model = overlayViewModel(snapshot, mode);
    assert.equal(model.task?.stage, "validate");
    assert.equal(model.task?.progress, null);
  }
});

test("取消后的会话(任务空、动作仍在)不是 inactive,基调 neutral", () => {
  const snapshot = makeSnapshot({
    status: { tone: "inactive", title: "cancelled" },
    task: null,
    allowedActions: ["open_on_desktop", "dismiss"],
  });
  const model = overlayViewModel(snapshot, "desktop");
  assert.equal(model.state, "ready");
  assert.equal(model.tone, "neutral");
  assert.equal(model.task, null);
  const cancel = actionView(model, "request_cancel_task");
  assert.equal(cancel.visible, true);
  assert.deepEqual(cancel.availability, { enabled: false, reason: "notAllowed" });
});

test("等待与阻断基调:amber / error 双形态一致", () => {
  for (const mode of ["desktop", "vr"] as const) {
    assert.equal(
      overlayViewModel(makeSnapshot({ status: { tone: "waiting", title: "w" } }), mode).tone,
      "amber",
    );
    assert.equal(
      overlayViewModel(makeSnapshot({ status: { tone: "blocked", title: "b" } }), mode).tone,
      "error",
    );
  }
});

test("request_cancel_task:任务不可取消时禁用原因 notCancellable", () => {
  const snapshot = makeSnapshot({
    task: { title: "demo task", stage: "execute", progress: null, cancellable: false },
  });
  const model = overlayViewModel(snapshot, "desktop");
  assert.deepEqual(actionView(model, "request_cancel_task").availability, {
    enabled: false,
    reason: "notCancellable",
  });
});

test("request_cancel_task:任务在但动作未下发时禁用原因 notAllowed", () => {
  const snapshot = makeSnapshot({ allowedActions: ["open_on_desktop", "dismiss"] });
  const model = overlayViewModel(snapshot, "vr");
  assert.deepEqual(actionView(model, "request_cancel_task").availability, {
    enabled: false,
    reason: "notAllowed",
  });
});

test("VR 无任务时收起 cancel 按钮(更少元素),桌面常驻禁用 + noTask 原因", () => {
  const snapshot = makeSnapshot({
    task: null,
    allowedActions: ["open_on_desktop", "dismiss", "request_cancel_task"],
  });
  const vr = overlayViewModel(snapshot, "vr");
  assert.equal(actionView(vr, "request_cancel_task").visible, false);
  const desktop = overlayViewModel(snapshot, "desktop");
  const cancel = actionView(desktop, "request_cancel_task");
  assert.equal(cancel.visible, true);
  assert.deepEqual(cancel.availability, { enabled: false, reason: "noTask" });
});

test("dismiss 未下发时禁用且主操作为空(desktop)/回退(vr)", () => {
  const snapshot = makeSnapshot({ allowedActions: ["request_cancel_task"] });
  const desktop = overlayViewModel(snapshot, "desktop");
  assert.deepEqual(actionView(desktop, "dismiss").availability, {
    enabled: false,
    reason: "notAllowed",
  });
  assert.equal(desktop.actions.every((a) => !a.primary), true);
  const vr = overlayViewModel(snapshot, "vr");
  assert.equal(vr.actions.every((a) => !a.primary), true);
});

test("环境摘要行数上限:desktop 4 行、vr 3 行,超出计数", () => {
  const five = [
    { id: "a", state: "ready" as const },
    { id: "b", state: "running" as const },
    { id: "c", state: "missing" as const },
    { id: "d", state: "ready" as const },
    { id: "e", state: "ready" as const },
  ];
  const snapshot = makeSnapshot({ environment: five });
  const desktop = overlayViewModel(snapshot, "desktop");
  assert.equal(desktop.environment.length, 4);
  assert.equal(desktop.hiddenEnvironmentCount, 1);
  const vr = overlayViewModel(snapshot, "vr");
  assert.equal(vr.environment.length, 3);
  assert.equal(vr.hiddenEnvironmentCount, 2);
});

test("textScale 与 reducedMotion 从 presentation 透传", () => {
  const snapshot = makeSnapshot({
    presentation: { locale: "zh-CN", textScale: 1.25, reducedMotion: true },
  });
  const model = overlayViewModel(snapshot, "vr");
  assert.equal(model.textScale, 1.25);
  assert.equal(model.reducedMotion, true);
});

test("枚举奇偶:模型联合与字符串表键一一对应", () => {
  assert.deepEqual(
    Object.keys(strings.overlay.disabledReasons).sort(),
    [...overlayDisabledReasons].sort(),
  );
  assert.deepEqual(
    Object.keys(strings.overlay.environmentStates).sort(),
    [...overlayEnvironmentStates].sort(),
  );
  assert.deepEqual(
    Object.keys(strings.overlay.statusTones).sort(),
    [...overlayStatusTones].sort(),
  );
});
