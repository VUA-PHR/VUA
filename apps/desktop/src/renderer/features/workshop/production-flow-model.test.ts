import assert from "node:assert/strict";
import { test } from "vitest";
import { strings } from "../../i18n/strings.zh-CN.ts";
import {
  buildRecordDisplayStatuses,
  projectBuildRecordDisplayStatus,
  inspectionFindingKinds,
  planDiffKinds,
  plannabilityStates,
  productionRejectReasons,
  recoverDecisionKinds,
  sourceIntakes,
  type BuildRecord,
  type BuildRecordDisplayStatus,
  type InspectionReport,
  type MaterialRef,
  type ProductionPlan,
  type ProductionRunView,
} from "../../gateway/model-production-port.ts";
import type { CapabilityReport } from "../../gateway/types.ts";
import {
  buildRecordGoReleaseAvailable,
  flowDisabledReasons,
  phaseOfRun,
  productionFlowModel,
  productionFlowPhases,
  toneForPhase,
  type ProductionFlowPhase,
} from "./production-flow-model.ts";

/**
 * F3 流程模型测试:五生命周期(completed/cancelled/failed_recoverable/expired/recover)
 * × 加载(capability 未知、检查/计划内容未回)/ 失败(能力 error、运行 failed)/
 * not-connected / 空态(无运行)穷尽;枚举键与 i18n 表一一对应(奇偶)。
 */

const ready: CapabilityReport = { state: "ready" };
const loading: CapabilityReport = { state: "loading" };
const unavailable: CapabilityReport = { state: "unavailable", detailKey: "taskEngineMissing" };
const errored: CapabilityReport = { state: "error" };

const material: MaterialRef = {
  materialId: "m-1",
  intake: "direct_unity_package",
  displayName: "demo.unitypackage",
};

const inspectionReport: InspectionReport = {
  inspectionId: "i-1",
  source: material,
  findings: [
    { id: "f-1", kind: "compat", summary: "ok", recoverable: true, retryable: true },
  ],
  plannability: "needs_attention",
  inspectedAt: "2026-09-04T10:24:40+08:00",
};

const planV1: ProductionPlan = {
  planId: "p-1",
  revision: 1,
  inspectionId: "i-1",
  mode: "direct_unity_package",
  projectId: "project",
  projectFingerprint: "fp-plan-1",
  stages: ["snapshot", "execute", "validate"],
  riskDecisionRequired: true,
  risks: [],
  estimatedDurationMs: null,
  diffs: [],
};

const recordCompleted: BuildRecord = {
  recordId: "r-1",
  taskId: "task-1",
  planId: "p-1",
  mode: "direct_unity_package",
  status: "succeeded",
  restoreAttempted: false,
  restoreSucceeded: null,
  stages: ["snapshot", "execute", "validate"],
  evidenceSummary: {
    snapshot: { attempted: true, succeeded: true },
    bridge: { jobsRun: 1, allSucceeded: true, lastOperation: null },
    localVpm: { attempted: false, published: null, packageId: null },
    validation: { status: "passed" },
  },
  startedAt: "2026-09-04T10:25:10+08:00",
  finishedAt: "2026-09-04T10:33:10+08:00",
};

type RunView = Extract<ProductionRunView, { kind: "run" }>;

function runWith(partial: Partial<RunView>): RunView {
  return {
    schemaVersion: 1,
    kind: "run",
    runId: "run-1",
    taskId: "task-1",
    runState: "execute",
    cancelled: false,
    source: material,
    inspection: inspectionReport,
    plan: planV1,
    buildRecord: null,
    ...partial,
  };
}

const notConnected: ProductionRunView = { schemaVersion: 1, kind: "not-connected" };

/* ---- 枚举键与 i18n 表奇偶(新增成员不在四表登记即测试失败) ---- */

test("parity: 端口与模型的枚举键和 strings.productionFlow 一一对应", () => {
  const flow = strings.productionFlow;
  assert.deepEqual([...sourceIntakes].sort(), Object.keys(flow.material.intake).sort());
  assert.deepEqual(
    [...inspectionFindingKinds].sort(),
    Object.keys(flow.inspection.findingKind).sort(),
  );
  assert.deepEqual(
    [...plannabilityStates].sort(),
    Object.keys(flow.inspection.plannability).sort(),
  );
  assert.deepEqual([...planDiffKinds].sort(), Object.keys(flow.plan.diffKind).sort());
  assert.deepEqual(
    [...buildRecordDisplayStatuses].sort(),
    Object.keys(flow.record.status).sort(),
  );
  assert.deepEqual([...recoverDecisionKinds].sort(), Object.keys(flow.recover.decision).sort());
  assert.deepEqual([...productionRejectReasons].sort(), Object.keys(flow.rejected).sort());
  assert.deepEqual([...productionFlowPhases].sort(), Object.keys(flow.phase).sort());
  assert.deepEqual([...flowDisabledReasons].sort(), Object.keys(flow.disabledReasons).sort());
});

/* ---- 五生命周期展示映射(色彩纪律:橙=进行/完成,琥珀=待确认,红=仅阻断) ---- */

test("completed: 完成态——橙(tone accent),记录卡可见,恢复禁用(可发现原因)", () => {
  const model = productionFlowModel(
    runWith({ runState: "completed", buildRecord: recordCompleted }),
    ready,
  );
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "completed");
  assert.equal(model.tone, "accent");
  assert.deepEqual(model.cards, { inspection: true, plan: true, recover: false, buildRecord: true });
  assert.equal(model.primaryAction, "start");
  assert.deepEqual(model.actions.startInspection, { enabled: true });
  assert.deepEqual(model.actions.recover, { enabled: false, reason: "notRecoverable" });
  assert.deepEqual(model.actions.confirmPlan, { enabled: false, reason: "notAwaiting" });
  assert.deepEqual(model.actions.requestPlan, { enabled: false, reason: "flowPending" });
});

test("cancelled: 取消态——中性色(非阻断),可重新开始,恢复禁用", () => {
  const model = productionFlowModel(runWith({ runState: "execute", cancelled: true }), ready);
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "cancelled");
  assert.equal(model.tone, "neutral");
  assert.equal(model.cards.recover, false);
  assert.equal(model.cards.buildRecord, false);
  assert.equal(model.primaryAction, "start");
  assert.deepEqual(model.actions.startInspection, { enabled: true });
  assert.deepEqual(model.actions.recover, { enabled: false, reason: "notRecoverable" });
});

test("failed_recoverable(漂移): 红(阻断),恢复卡可见且恢复可用,开始禁用(先结案)", () => {
  const model = productionFlowModel(runWith({ runState: "failed_recoverable" }), ready);
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "failedRecoverable");
  assert.equal(model.tone, "error");
  assert.equal(model.cards.recover, true);
  assert.equal(model.primaryAction, "recover");
  assert.deepEqual(model.actions.recover, { enabled: true });
  assert.deepEqual(model.actions.startInspection, { enabled: false, reason: "flowPending" });
  assert.deepEqual(model.actions.confirmPlan, { enabled: false, reason: "notAwaiting" });
});

test("expired(超时/确认过期): 琥珀(待处理),恢复可用,计划卡过期态由 phase 表达", () => {
  const model = productionFlowModel(
    runWith({ runState: "expired", plan: { ...planV1, revision: 2 } }),
    ready,
  );
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "expired");
  assert.equal(model.tone, "amber");
  assert.equal(model.cards.recover, true);
  assert.equal(model.primaryAction, "recover");
  assert.deepEqual(model.actions.recover, { enabled: true });
  assert.deepEqual(model.actions.startInspection, { enabled: false, reason: "flowPending" });
});

test("recover(恢复进行中): 橙(进行),恢复卡保持可见但动作禁用(恢复是任务)", () => {
  const model = productionFlowModel(runWith({ runState: "recover" }), ready);
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "recovering");
  assert.equal(model.tone, "accent");
  assert.equal(model.cards.recover, true);
  assert.equal(model.primaryAction, null);
  assert.deepEqual(model.actions.recover, { enabled: false, reason: "notRecoverable" });
});

test("recover 结局: 显示四态齐备且经 B 五态 + 恢复证据投影", () => {
  const cases = [
    { display: "completed", authority: "succeeded", restoreAttempted: false, restoreSucceeded: undefined, runState: "completed" },
    { display: "completed", authority: "recovered", restoreAttempted: true, restoreSucceeded: true, runState: "completed" },
    { display: "aborted", authority: "cancelled", restoreAttempted: false, restoreSucceeded: undefined, runState: "expired" },
    { display: "rolled_back", authority: "failed", restoreAttempted: true, restoreSucceeded: true, runState: "completed" },
    { display: "rollback_failed", authority: "failed", restoreAttempted: true, restoreSucceeded: false, runState: "failed" },
  ] as const;
  for (const testCase of cases) {
    const model = productionFlowModel(
      runWith({
        runState: testCase.runState,
        buildRecord: {
          ...recordCompleted,
          status: testCase.authority,
          restoreAttempted: testCase.restoreAttempted,
          ...(testCase.restoreSucceeded === undefined
            ? {}
            : { restoreSucceeded: testCase.restoreSucceeded }),
        },
      }),
      ready,
    );
    assert.equal(model.kind, "run");
    if (model.kind !== "run") return;
    assert.equal(model.cards.buildRecord, true);
    assert.ok(model.buildRecord !== null);
    const display = projectBuildRecordDisplayStatus(
      model.buildRecord.status,
      model.buildRecord.restoreAttempted,
      model.buildRecord.restoreSucceeded,
    );
    assert.equal(display, testCase.display);
  }
});
/* ---- × 加载 / 失败 / not-connected / 空态 ---- */

test("五生命周期 × 能力加载中/能力失败/能力不可用:一律 hidden(入口不出现)", () => {
  const runs = [
    runWith({ runState: "completed", buildRecord: recordCompleted }),
    runWith({ runState: "execute", cancelled: true }),
    runWith({ runState: "failed_recoverable" }),
    runWith({ runState: "expired" }),
    runWith({ runState: "recover" }),
  ];
  for (const run of runs) {
    assert.equal(productionFlowModel(run, null).kind, "hidden");
    assert.equal(productionFlowModel(run, loading).kind, "hidden");
    assert.equal(productionFlowModel(run, errored).kind, "hidden");
    assert.equal(productionFlowModel(run, unavailable).kind, "hidden");
  }
});

test("not-connected + 能力就绪: empty(素材入口 + 诚实空态)", () => {
  assert.equal(productionFlowModel(notConnected, ready).kind, "empty");
  assert.equal(productionFlowModel(notConnected, null).kind, "hidden");
});

test("空数据(运行初建): inspect 任务进行中而结果未回,检查卡 Skeleton", () => {
  const model = productionFlowModel(runWith({ runState: "inspect", inspection: null, plan: null }), ready);
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "inspecting");
  assert.equal(model.inspectionLoading, true);
  assert.equal(model.planLoading, false);
  assert.equal(model.cards.inspection, true);
  assert.equal(model.cards.plan, false);
  assert.equal(model.primaryAction, null);
  assert.deepEqual(model.actions.startInspection, { enabled: false, reason: "runActive" });
  assert.deepEqual(model.actions.requestPlan, { enabled: false, reason: "noInspection" });
});

test("检查完成待生成计划: inspectionReady,生成计划为主操作", () => {
  const model = productionFlowModel(runWith({ runState: "inspect", plan: null }), ready);
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "inspectionReady");
  assert.equal(model.inspectionLoading, false);
  assert.equal(model.primaryAction, "requestPlan");
  assert.deepEqual(model.actions.requestPlan, { enabled: true });
  assert.deepEqual(model.actions.startInspection, { enabled: false, reason: "flowPending" });
});

test("检查结论不可计划: requestPlan 禁用且原因 notPlannable", () => {
  const model = productionFlowModel(
    runWith({
      runState: "inspect",
      plan: null,
      inspection: { ...inspectionReport, plannability: "not_plannable" },
    }),
    ready,
  );
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.deepEqual(model.actions.requestPlan, { enabled: false, reason: "notPlannable" });
});

test("计划生成中: planning,计划卡 Skeleton;待确认: awaiting,琥珀,确认为主操作", () => {
  const planning = productionFlowModel(runWith({ runState: "plan", plan: null }), ready);
  assert.equal(planning.kind, "run");
  if (planning.kind === "run") {
    assert.equal(planning.phase, "planning");
    assert.equal(planning.planLoading, true);
    assert.equal(planning.cards.plan, true);
    assert.deepEqual(planning.actions.confirmPlan, { enabled: false, reason: "noPlan" });
  }
  const awaiting = productionFlowModel(runWith({ runState: "await_confirmation" }), ready);
  assert.equal(awaiting.kind, "run");
  if (awaiting.kind !== "run") return;
  assert.equal(awaiting.phase, "awaiting");
  assert.equal(awaiting.tone, "amber");
  assert.equal(awaiting.primaryAction, "confirm");
  assert.deepEqual(awaiting.actions.confirmPlan, { enabled: true });
});

test("failed(不可恢复失败): 红,恢复禁用,可重新开始", () => {
  const model = productionFlowModel(
    runWith({
      runState: "failed",
      buildRecord: {
        ...recordCompleted,
        status: "failed",
        restoreAttempted: true,
        restoreSucceeded: false,
      },
    }),
    ready,
  );
  assert.equal(model.kind, "run");
  if (model.kind !== "run") return;
  assert.equal(model.phase, "failed");
  assert.equal(model.tone, "error");
  assert.equal(model.cards.recover, false);
  assert.equal(model.cards.buildRecord, true);
  assert.deepEqual(model.actions.recover, { enabled: false, reason: "notRecoverable" });
  assert.deepEqual(model.actions.startInspection, { enabled: true });
});

test("phaseOfRun/toneForPhase 穷尽十一相;取消标记优先于 runState", () => {
  const phases: Array<[RunView["runState"], boolean, ProductionFlowPhase]> = [
    ["inspect", false, "inspectionReady"],
    ["plan", false, "planning"],
    ["await_confirmation", false, "awaiting"],
    ["snapshot", false, "executing"],
    ["execute", false, "executing"],
    ["validate", false, "executing"],
    ["recover", false, "recovering"],
    ["completed", false, "completed"],
    ["failed", false, "failed"],
    ["failed_recoverable", false, "failedRecoverable"],
    ["expired", false, "expired"],
  ];
  for (const [runState, cancelled, expected] of phases) {
    assert.equal(phaseOfRun(runWith({ runState, cancelled })), expected);
  }
  assert.equal(phaseOfRun(runWith({ runState: "validate", cancelled: true })), "cancelled");
  for (const phase of productionFlowPhases) {
    assert.ok(["accent", "amber", "error", "neutral"].includes(toneForPhase(phase)));
  }
});

test("buildRecordGoReleaseAvailable:仅显示投影 completed 放行(缺口 (a);四态期望表穷尽闭集,recovered 折叠 completed 后同样在场)", () => {
  const expected: Record<BuildRecordDisplayStatus, boolean> = {
    completed: true,
    aborted: false,
    rolled_back: false,
    rollback_failed: false,
  };
  for (const status of buildRecordDisplayStatuses) {
    assert.equal(buildRecordGoReleaseAvailable(status), expected[status], status);
  }
});
