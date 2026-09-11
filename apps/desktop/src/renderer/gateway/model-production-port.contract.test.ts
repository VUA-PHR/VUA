import assert from "node:assert/strict";
import { test } from "vitest";
import { emptyGateway } from "./empty-gateway.ts";
import { fixtureGateway } from "./fixture-gateway.ts";
import { capabilityDetailKeys, capabilityStates, type CapabilityReport } from "./types.ts";
import { workflowRunStates } from "./workflow.ts";
import { projectBuildRecordDisplayStatus, type ModelProductionPort } from "./model-production-port.ts";

/**
 * F3 生产纵向端口契约测试(production-use-case v0.1〔M3 冻结〕;仿 ports.contract.test.ts):
 * 同一组用例跑 empty / fixture 实现;未来的 live 实现(electron-gateway 接线后)
 * 必须通过同一契约,页面才能零重写切换。
 * fixture 用例经 fixtureGateway 装配(任务联动走真实 fixture 任务端口)。
 */

function assertCapabilityShape(report: CapabilityReport) {
  assert.ok(
    (capabilityStates as readonly string[]).includes(report.state),
    `unknown capability state: ${report.state}`,
  );
  if (report.detailKey !== undefined) {
    assert.ok(
      (capabilityDetailKeys as readonly string[]).includes(report.detailKey),
      `unknown capability detailKey: ${report.detailKey}`,
    );
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 快速时间线的生产 fixture(settleMs=5ms) */
function productionGateway(name: "production-inspect" | "production-plan" | "production-running" | "production-success" | "production-cancelled" | "production-drifted" | "production-expired" | "production-rollback") {
  return fixtureGateway(name, null, {}, { settleMs: 5 });
}

/* ---- 双实现的公共契约 ---- */

const implementations: Array<{ label: string; make: () => ModelProductionPort }> = [
  { label: "empty(not-run)", make: () => emptyGateway().modelProduction },
  { label: "fixture(demo-mixed 非生产场景)", make: () => fixtureGateway("demo-mixed").modelProduction },
];

for (const { label, make } of implementations) {
  test(`${label}: productionRun 带 schemaVersion: 1 且为 not-connected 退路`, async () => {
    const view = await make().snapshot();
    assert.equal(view.schemaVersion, 1);
    assert.equal(view.productionRun.schemaVersion, 1);
    assert.equal(view.productionRun.kind, "not-connected");
  });

  test(`${label}: capability 为复合报告(overall + production),形态合法`, async () => {
    const caps = await make().capability();
    assertCapabilityShape(caps.overall);
    assertCapabilityShape(caps.production);
  });

  test(`${label}: 未接入时七方法 + 素材选择全部诚实退路,不编造数据`, async () => {
    const port = make();
    assert.equal(await port.pickMaterial("direct_unity_package"), null);
    const material = { materialId: "m", intake: "direct_unity_package" as const, displayName: "demo" };
    assert.equal((await port.startInspection(material)).kind, "unavailable");
    assert.equal((await port.requestPlan("i-1")).kind, "unavailable");
    assert.equal((await port.confirmPlan("p-1", 1, "continue")).kind, "unavailable");
    assert.equal(
      (await port.recover("t-1", { kind: "rollback" })).kind,
      "unavailable",
    );
    assert.equal((await port.getInspection("i-1")).kind, "not-connected");
    assert.equal((await port.getPlan("p-1")).kind, "not-connected");
    assert.equal((await port.getBuildRecord("r-1")).kind, "not-connected");
  });
}

/* ---- production-* 场景:五生命周期与意图纪律 ---- */

test("fixture(production-inspect): 全流程走查——检查 → 计划 → 确认 → 执行 → Build Record", async () => {
  const gateway = productionGateway("production-inspect");
  const port = gateway.modelProduction;

  // 开局:尚无运行(诚实空态),能力就绪
  assert.equal((await port.snapshot()).productionRun.kind, "not-connected");
  assert.equal((await port.capability()).production.state, "ready");

  // 素材选择(fixture 模拟 Kernel 文件对话框,返回合成 MaterialRef)
  const material = await port.pickMaterial("local_reusable_vpm");
  assert.ok(material !== null);
  assert.equal(material.intake, "local_reusable_vpm");
  assert.ok(material.displayName.length > 0);

  // startInspection:返回已创建任务 + 当前快照;任务经任务端口可见
  const started = await port.startInspection(material);
  assert.equal(started.kind, "ok");
  if (started.kind !== "ok") return;
  assert.ok(started.taskId.length > 0);
  assert.equal(started.run.kind, "run");
  if (started.run.kind !== "run") return;
  assert.equal(started.run.runState, "inspect");
  assert.ok(workflowRunStates.includes(started.run.runState));
  const seededTask = (await gateway.task.snapshot()).tasks.find(
    (task) => task.id === started.taskId,
  );
  assert.equal(seededTask?.status, "preparing");
  assert.equal(seededTask?.originPage, "workshop");

  // 时间线:检查完成,结果内嵌,任务结案
  await sleep(30);
  const inspected = await port.snapshot();
  assert.equal(inspected.productionRun.kind, "run");
  if (inspected.productionRun.kind !== "run") return;
  assert.ok(inspected.productionRun.inspection !== null);
  const inspection = inspected.productionRun.inspection;
  assert.ok(inspection !== null);
  assert.ok(inspection.findings.length > 0);
  assert.equal(
    (await gateway.task.snapshot()).tasks.find((task) => task.id === started.taskId)?.status,
    "completed",
  );

  // getInspection:已知 id 返回结果,未知 id 诚实 not-connected
  assert.equal((await port.getInspection(inspection.inspectionId)).kind, "inspection");
  assert.equal((await port.getInspection("__missing__")).kind, "not-connected");

  // requestPlan:未知引用拒绝;合法引用创建任务并迁移
  assert.equal((await port.requestPlan("__missing__")).kind, "rejected");
  const planned = await port.requestPlan(inspection.inspectionId);
  assert.equal(planned.kind, "ok");
  if (planned.kind !== "ok") return;
  await sleep(30);
  const plannedView = await port.snapshot();
  assert.equal(plannedView.productionRun.kind, "run");
  if (plannedView.productionRun.kind !== "run") return;
  assert.equal(plannedView.productionRun.runState, "await_confirmation");
  assert.ok(plannedView.productionRun.plan !== null);
  const plan = plannedView.productionRun.plan;
  assert.ok(plan !== null);
  assert.equal(plan.revision, 1);
  // await_confirmation → 任务中心 waitingInput + 来源页回跳(车间)
  const waitingTask = (await gateway.task.snapshot()).tasks.find(
    (task) => task.id === planned.taskId,
  );
  assert.equal(waitingTask?.status, "waitingInput");
  assert.equal(waitingTask?.originPage, "workshop");
  assert.equal((await port.getPlan(plan.planId)).kind, "plan");

  // confirmPlan:revision 不匹配 → rejected(stale_revision),确认不失效于旧修订
  const stale = await port.confirmPlan(plan.planId, 99, "continue");
  assert.equal(stale.kind, "rejected");
  if (stale.kind === "rejected") assert.equal(stale.reason, "stale_revision");

  // 正确 revision → 执行链 snapshot → execute → validate → completed + Build Record
  const confirmed = await port.confirmPlan(plan.planId, plan.revision, "snapshot_and_continue");
  assert.equal(confirmed.kind, "ok");
  if (confirmed.kind !== "ok") return;
  await sleep(80);
  const done = await port.snapshot();
  assert.equal(done.productionRun.kind, "run");
  if (done.productionRun.kind !== "run") return;
  assert.equal(done.productionRun.runState, "completed");
  assert.ok(done.productionRun.buildRecord !== null);
  const record = done.productionRun.buildRecord;
  assert.ok(record !== null);
  assert.equal(record.status, "succeeded");
  assert.equal(record.restoreAttempted, false);
  assert.equal(
    projectBuildRecordDisplayStatus(record.status, record.restoreAttempted, record.restoreSucceeded),
    "completed",
  );
  assert.ok(record.stages.length > 0);
  assert.equal((await port.getBuildRecord(record.recordId)).kind, "record");
  assert.equal(
    (await gateway.task.snapshot()).tasks.find((task) => task.id === confirmed.taskId)?.status,
    "completed",
  );
});

test("fixture(production-plan): 开局即待确认;confirmPlan 非法状态/引用被拒绝", async () => {
  const gateway = productionGateway("production-plan");
  const port = gateway.modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.runState, "await_confirmation");
  assert.ok(view.plan !== null);
  // 任务中心投影:waitingInput,可跳回车间页
  const task = (await gateway.task.snapshot()).tasks.find((item) => item.id === view.taskId);
  assert.equal(task?.status, "waitingInput");
  assert.equal(task?.originPage, "workshop");

  assert.equal((await port.confirmPlan("__missing__", 1, "continue")).kind, "rejected");
  const ok = await port.confirmPlan(view.plan!.planId, view.plan!.revision, "continue");
  assert.equal(ok.kind, "ok");
  // 已确认后重复确认同一 revision:状态已迁移,拒绝 invalid_state
  await sleep(30);
  const again = await port.confirmPlan(view.plan!.planId, view.plan!.revision, "continue");
  assert.equal(again.kind, "rejected");
});

test("fixture(production-running): 时间线推进执行链到 completed;任务取消联动运行取消", async () => {
  const gateway = productionGateway("production-running");
  const port = gateway.modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.runState, "execute");

  // 取消纪律:任务中心取消当前命令 → 运行如实标记已取消,时间线不再推进
  const cancelled = await gateway.task.cancel(view.taskId);
  assert.equal(cancelled.kind, "ok");
  const after = (await port.snapshot()).productionRun;
  assert.equal(after.kind, "run");
  if (after.kind !== "run") return;
  assert.equal(after.cancelled, true);
  await sleep(60);
  const settled = (await port.snapshot()).productionRun;
  assert.equal(settled.kind, "run");
  if (settled.kind !== "run") return;
  assert.equal(settled.cancelled, true);
  assert.equal(settled.runState, "execute");
  assert.equal(settled.buildRecord, null);
});

test("fixture(production-success): 成功生命周期——completed + 构建记录", async () => {
  const port = productionGateway("production-success").modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.runState, "completed");
  assert.equal(view.buildRecord?.status, "succeeded");
  // 终态不接受恢复
  const recovered = await port.recover(view.taskId, { kind: "rollback" });
  assert.equal(recovered.kind, "rejected");
  if (recovered.kind === "rejected") assert.equal(recovered.reason, "not_recoverable");
});

test("fixture(production-cancelled): 取消生命周期——cancelled 标记 + 任务 cancelled", async () => {
  const gateway = productionGateway("production-cancelled");
  const view = (await gateway.modelProduction.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.cancelled, true);
  const task = (await gateway.task.snapshot()).tasks.find((item) => item.id === view.taskId);
  assert.equal(task?.status, "cancelled");
});

test("fixture(production-drifted): 漂移——failed_recoverable;rollback 演示回滚失败", async () => {
  const gateway = productionGateway("production-drifted");
  const port = gateway.modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.runState, "failed_recoverable");
  const task = (await gateway.task.snapshot()).tasks.find((item) => item.id === view.taskId);
  assert.equal(task?.status, "failed");

  // 未知任务引用被拒绝
  assert.equal(
    (await port.recover("__missing__", { kind: "rollback" })).kind,
    "rejected",
  );
  const recovered = await port.recover(view.taskId, { kind: "rollback" });
  assert.equal(recovered.kind, "ok");
  await sleep(30);
  const done = (await port.snapshot()).productionRun;
  assert.equal(done.kind, "run");
  if (done.kind !== "run") return;
  assert.equal(done.runState, "failed");
  assert.equal(done.buildRecord?.status, "failed");
  assert.equal(done.buildRecord?.restoreAttempted, true);
  assert.equal(done.buildRecord?.restoreSucceeded, false);
  assert.equal(
    projectBuildRecordDisplayStatus(
      done.buildRecord.status,
      done.buildRecord.restoreAttempted,
      done.buildRecord.restoreSucceeded,
    ),
    "rollback_failed",
  );
});

test("fixture(production-drifted): continue 从安全点继续执行到 completed", async () => {
  const gateway = productionGateway("production-drifted");
  const port = gateway.modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  const recovered = await port.recover(view.taskId, { kind: "continue" });
  assert.equal(recovered.kind, "ok");
  await sleep(60);
  const done = (await port.snapshot()).productionRun;
  assert.equal(done.kind, "run");
  if (done.kind !== "run") return;
  assert.equal(done.runState, "completed");
  assert.equal(done.buildRecord?.status, "succeeded");
});

test("fixture(production-expired): 超时——expired;continue 回到待确认并可重新确认", async () => {
  const gateway = productionGateway("production-expired");
  const port = gateway.modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.runState, "expired");
  // 计划已变化(revision 递增),旧确认失效
  assert.equal(view.plan?.revision, 2);
  const expiredTask = (await gateway.task.snapshot()).tasks.find(
    (item) => item.id === view.taskId,
  );
  // expired 投影为 cancelled(工作流词表纪律:过期 ≠ 失败)
  assert.equal(expiredTask?.status, "cancelled");

  const recovered = await port.recover(view.taskId, { kind: "continue" });
  assert.equal(recovered.kind, "ok");
  if (recovered.kind !== "ok") return;
  const awaiting = (await port.snapshot()).productionRun;
  assert.equal(awaiting.kind, "run");
  if (awaiting.kind !== "run") return;
  assert.equal(awaiting.runState, "await_confirmation");
  // 等待重新确认的任务在任务中心可见并可回跳
  const waitingTask = (await gateway.task.snapshot()).tasks.find(
    (item) => item.id === recovered.taskId,
  );
  assert.equal(waitingTask?.status, "waitingInput");
  assert.equal(waitingTask?.originPage, "workshop");

  // 重新确认当前 revision → 执行链跑完
  const plan = awaiting.plan;
  assert.ok(plan !== null);
  const confirmed = await port.confirmPlan(plan!.planId, plan!.revision, "continue");
  assert.equal(confirmed.kind, "ok");
  await sleep(80);
  const done = (await port.snapshot()).productionRun;
  assert.equal(done.kind, "run");
  if (done.kind !== "run") return;
  assert.equal(done.runState, "completed");
});

test("fixture(production-rollback): 回滚生命周期——recover 后 rolled_back 记录", async () => {
  const gateway = productionGateway("production-rollback");
  const port = gateway.modelProduction;
  const view = (await port.snapshot()).productionRun;
  assert.equal(view.kind, "run");
  if (view.kind !== "run") return;
  assert.equal(view.runState, "failed_recoverable");
  const recovered = await port.recover(view.taskId, { kind: "rollback" });
  assert.equal(recovered.kind, "ok");
  await sleep(30);
  const done = (await port.snapshot()).productionRun;
  assert.equal(done.kind, "run");
  if (done.kind !== "run") return;
  assert.equal(done.runState, "completed");
  assert.equal(done.buildRecord?.status, "failed");
  assert.equal(done.buildRecord?.restoreAttempted, true);
  assert.equal(done.buildRecord?.restoreSucceeded, true);
  assert.equal(
    projectBuildRecordDisplayStatus(
      done.buildRecord.status,
      done.buildRecord.restoreAttempted,
      done.buildRecord.restoreSucceeded,
    ),
    "rolled_back",
  );
});

test("fixture(production-*): 订阅推送运行迁移;非生产场景 production 能力 unavailable", async () => {
  const gateway = productionGateway("production-inspect");
  const seen: string[] = [];
  const off = gateway.modelProduction.subscribe((view) => {
    const state = view.productionRun.kind === "run" ? view.productionRun.runState : "not-connected";
    if (seen.at(-1) !== state) seen.push(state);
  });
  const material = await gateway.modelProduction.pickMaterial("direct_unity_package");
  assert.ok(material !== null);
  await gateway.modelProduction.startInspection(material);
  await sleep(30);
  off();
  assert.deepEqual(seen, ["inspect"]);

  const mixed = fixtureGateway("demo-mixed").modelProduction;
  assert.equal((await mixed.capability()).production.state, "unavailable");
});
