/**
 * Overlay 表现模型测试(v2,017 表面批 1 wire 消费):
 * - unavailable 缺席两态与空集快照的诚实呈现;
 * - tone 推导(冻结九态词表:非终态=accent、failed=error、终态=neutral);
 * - 任务卡投影(词表内/词表外 state 透传、终态无取消目标);
 * - 生产状态卡两半独立可空投影;
 * - 形态差异(open_on_desktop 仅 VR、主操作纪律);
 * - 枚举奇偶:statusTitles/statusTones 键与 TS 联合一一对应。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import { strings } from "../../i18n/index.ts";
import {
  overlayStatusTones,
  type OverlaySnapshot,
} from "./overlay-contract.ts";
import {
  overlayStatusTitleKeys,
  overlayViewModel,
  toneForStatus,
} from "./overlay-model.ts";

const presentation = { locale: "zh-CN", textScale: 1, reducedMotion: false };

function makeAvailableSnapshot(
  overrides: {
    cards?: Array<{ taskId: string; state: string; correlationId: string }>;
    productionCard?: Partial<{
      currentPlan: {
        planId: string;
        planStatus: string;
        createdAt: string;
        recipeId: string;
      } | null;
      latestRecord: {
        buildId: string;
        planId: string;
        status: string;
        finishedAt: string;
      } | null;
    }>;
  } = {},
): Extract<OverlaySnapshot, { availability: "available" }> {
  return {
    schemaVersion: 2,
    availability: "available",
    presentation,
    tasks: overrides.cards ?? [],
    productionCard: {
      currentPlan: null,
      latestRecord: null,
      ...overrides.productionCard,
    },
  };
}

const unavailableSnapshot: OverlaySnapshot = {
  schemaVersion: 2,
  availability: "unavailable",
  presentation,
};

const runningCard = { taskId: "task-2", state: "running", correlationId: "c2" };
const queuedCard = { taskId: "task-1", state: "queued", correlationId: "c1" };

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

test("unavailable 缺席快照:两形态均 inactive 空态,不伪装成空数据快照", () => {
  for (const mode of ["desktop", "vr"] as const) {
    const model = overlayViewModel(unavailableSnapshot, mode);
    assert.equal(model.state, "inactive");
    assert.equal(model.tone, "neutral");
    assert.equal(model.taskCards.length, 0);
    assert.equal(model.productionCard.currentPlan, null);
    assert.equal(model.productionCard.latestRecord, null);
    assert.equal(actionView(model, "request_cancel_task").visible, false);
    assert.equal(actionView(model, "dismiss").visible, true);
  }
});

test("非终态任务(queued/running):tone=accent、state=ready、取消目标可见", () => {
  for (const mode of ["desktop", "vr"] as const) {
    const model = overlayViewModel(
      makeAvailableSnapshot({ cards: [queuedCard, runningCard] }),
      mode,
    );
    assert.equal(model.state, "ready");
    assert.equal(model.tone, "accent");
    assert.equal(model.statusTone, "active");
    assert.equal(model.taskCards.length, 2);
    assert.deepEqual(
      model.taskCards.map((card) => card.cancellable),
      [true, true],
    );
    assert.equal(actionView(model, "request_cancel_task").visible, true);
  }
});

test("主操作纪律:desktop 主操作=dismiss,open_on_desktop 不出现;vr 相反", () => {
  const snapshot = makeAvailableSnapshot({ cards: [runningCard] });
  const desktop = overlayViewModel(snapshot, "desktop");
  assert.equal(actionView(desktop, "open_on_desktop").visible, false);
  assert.equal(actionView(desktop, "dismiss").primary, true);
  const vr = overlayViewModel(snapshot, "vr");
  assert.equal(actionView(vr, "open_on_desktop").visible, true);
  assert.equal(actionView(vr, "open_on_desktop").primary, true);
  assert.equal(actionView(vr, "dismiss").primary, false);
});

test("全部终态任务:tone=neutral,取消目标收起,快照仍为 ready(近期活动)", () => {
  const snapshot = makeAvailableSnapshot({
    cards: [
      { taskId: "task-3", state: "succeeded", correlationId: "c3" },
      { taskId: "task-4", state: "cancelled", correlationId: "c4" },
    ],
  });
  const model = overlayViewModel(snapshot, "desktop");
  assert.equal(model.state, "ready");
  assert.equal(model.tone, "neutral");
  assert.equal(model.statusTone, "inactive");
  assert.equal(model.statusTitleKey, "recent");
  for (const card of model.taskCards) {
    assert.equal(card.cancellable, false);
  }
  assert.equal(actionView(model, "request_cancel_task").visible, false);
});

test("无进行中但有 failed 任务:tone=error(唯一允许红色语义的基调)", () => {
  const snapshot = makeAvailableSnapshot({
    cards: [{ taskId: "task-5", state: "failed", correlationId: "c5" }],
  });
  const model = overlayViewModel(snapshot, "desktop");
  assert.equal(model.tone, "error");
  assert.equal(model.statusTone, "blocked");
  // failed 是冻结终态:不再提供取消目标
  assert.equal(model.taskCards[0]?.cancellable, false);
});

test("空集+生产卡两半空:available 快照呈 inactive 空态(空态即终态,非错误)", () => {
  const model = overlayViewModel(makeAvailableSnapshot(), "desktop");
  assert.equal(model.state, "inactive");
  assert.equal(model.statusTitleKey, "idle");
});

test("生产状态卡两半独立可空投影:字段原样透传,无合成行", () => {
  const snapshot = makeAvailableSnapshot({
    productionCard: {
      currentPlan: {
        planId: "plan-a",
        planStatus: "approved",
        createdAt: "2026-09-13T00:00:00.000Z",
        recipeId: "recipe-a",
      },
      latestRecord: null,
    },
  });
  const model = overlayViewModel(snapshot, "desktop");
  assert.deepEqual(model.productionCard.currentPlan, {
    planId: "plan-a",
    statusLabel: "approved",
    createdAt: "2026-09-13T00:00:00.000Z",
    recipeId: "recipe-a",
  });
  assert.equal(model.productionCard.latestRecord, null);
});

test("仅最近记录半存在:state=ready 且标题=recent,plan 半保持 null", () => {
  const snapshot = makeAvailableSnapshot({
    productionCard: {
      latestRecord: {
        buildId: "record-a",
        planId: "plan-a",
        status: "succeeded",
        finishedAt: "2026-09-13T00:05:00.000Z",
      },
    },
  });
  const model = overlayViewModel(snapshot, "vr");
  assert.equal(model.state, "ready");
  assert.equal(model.statusTitleKey, "recent");
  assert.equal(model.productionCard.currentPlan, null);
  assert.equal(model.productionCard.latestRecord?.buildId, "record-a");
});

test("词表外任务态:stateLabel/stateRaw 原词透传,不猜测九态语义(保守可取消)", () => {
  const snapshot = makeAvailableSnapshot({
    cards: [{ taskId: "task-9", state: "mystery_state", correlationId: "c9" }],
  });
  const model = overlayViewModel(snapshot, "desktop");
  const card = model.taskCards[0];
  assert.ok(card);
  assert.equal(card.stateRaw, "mystery_state");
  assert.equal(card.stateLabel, "mystery_state");
});

test("textScale 与 reducedMotion 从 presentation 透传", () => {
  const snapshot: OverlaySnapshot = {
    schemaVersion: 2,
    availability: "available",
    presentation: { locale: "zh-CN", textScale: 1.25, reducedMotion: true },
    tasks: [],
    productionCard: { currentPlan: null, latestRecord: null },
  };
  const model = overlayViewModel(snapshot, "vr");
  assert.equal(model.textScale, 1.25);
  assert.equal(model.reducedMotion, true);
});

test("枚举奇偶:模型联合与字符串表键一一对应", () => {
  assert.deepEqual(
    Object.keys(strings.overlay.statusTitles).sort(),
    [...overlayStatusTitleKeys].sort(),
  );
  assert.deepEqual(
    Object.keys(strings.overlay.statusTones).sort(),
    [...overlayStatusTones].sort(),
  );
  // 词表镜像:planStatuses/recordStatuses 键与冻结枚举一一对应
  assert.deepEqual(
    Object.keys(strings.overlay.productionPlanStatuses).sort(),
    ["approved", "draft", "superseded"],
  );
  assert.deepEqual(
    Object.keys(strings.overlay.productionRecordStatuses).sort(),
    ["cancelled", "failed", "recovered", "succeeded", "succeeded_with_warnings"],
  );
});
