import assert from "node:assert/strict";
import { test } from "vitest";
import { emptyGateway } from "./empty-gateway.ts";
import { fixtureGateway } from "./fixture-gateway.ts";
import type { VuaGateway } from "./gateway.ts";
import { CURRENT_RECIPE_ID } from "./model-production-port.ts";
import { capabilityDetailKeys, capabilityStates, type CapabilityReport } from "./types.ts";

/**
 * 端口契约测试(G3):同一组用例跑 fixture / empty 双实现。
 * 任何后续新增的 live 实现必须通过同一契约,页面才能零重写切换。
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

const implementations: Array<{ label: string; source: string; make: () => VuaGateway }> = [
  { label: "fixture(demo-tasks)", source: "fixture", make: () => fixtureGateway("demo-tasks") },
  { label: "empty(not-run)", source: "none", make: () => emptyGateway() },
];

for (const { label, source, make } of implementations) {
  test(`${label}: 五领域快照均带 schemaVersion: 1`, async () => {
    const gateway = make();
    assert.equal((await gateway.environment.snapshot()).schemaVersion, 1);
    assert.equal((await gateway.modelProduction.snapshot()).schemaVersion, 1);
    assert.equal((await gateway.toolCatalog.snapshot()).schemaVersion, 1);
    assert.equal((await gateway.task.snapshot()).schemaVersion, 1);
    assert.equal((await gateway.settings.snapshot()).schemaVersion, 1);
    assert.equal((await gateway.acquire.snapshot()).schemaVersion, 1);
    assert.equal((await gateway.packages.snapshot()).schemaVersion, 1);
  });

  test(`${label}: dataSource 与实现身份一致`, () => {
    assert.equal(make().dataSource(), source);
  });

  test(`${label}: 各端口 capability 形态合法`, async () => {
    const gateway = make();
    assertCapabilityShape(await gateway.environment.capability());
    // F3:模型生产领域能力为复合报告(overall 既有面 + production 纵向流程)
    const modelProductionCaps = await gateway.modelProduction.capability();
    assertCapabilityShape(modelProductionCaps.overall);
    assertCapabilityShape(modelProductionCaps.production);
    assertCapabilityShape(await gateway.toolCatalog.capability());
    assertCapabilityShape(await gateway.task.capability());
    assertCapabilityShape(await gateway.acquire.capability());
    assertCapabilityShape(await gateway.packages.capability());
  });

  test(`${label}: task.cancel 未知任务返回 rejected(unknown_task)并携带最新快照`, async () => {
    const gateway = make();
    const result = await gateway.task.cancel("__missing__");
    assert.equal(result.kind, "rejected");
    if (result.kind === "rejected") assert.equal(result.reason, "unknown_task");
    assert.equal(result.view.schemaVersion, 1);
  });

  test(`${label}: 订阅返回可调用的退订函数`, () => {
    const gateway = make();
    const offEnvironment = gateway.environment.subscribe(() => {});
    const offTask = gateway.task.subscribe(() => {});
    assert.equal(typeof offEnvironment, "function");
    assert.equal(typeof offTask, "function");
    offEnvironment();
    offTask();
  });

  test(`${label}: 未知配方 id 图谱诚实 not-connected;分享码接真前恒 unavailable(C-RECIPE)`, async () => {
    const gateway = make();
    const graph = await gateway.modelProduction.recipeGraph("r-unknown");
    assert.equal(graph.schemaVersion, 1);
    assert.equal(graph.kind, "not-connected");
    assert.equal((await gateway.modelProduction.importShareCode("vuar1.x")).kind, "unavailable");
    assert.equal((await gateway.modelProduction.exportShareCode("r-1")).kind, "unavailable");
  });

  if (source === "fixture") {
    test(`${label}: 当前配方(CURRENT_RECIPE_ID)返回图谱,未知 id 不返回猜测图谱`, async () => {
      const gateway = make();
      const graph = await gateway.modelProduction.recipeGraph(CURRENT_RECIPE_ID);
      assert.equal(graph.schemaVersion, 1);
      assert.equal(graph.kind, "graph");
    });
  }

  test(`${label}: 工具目录四要素齐备(C-TOOLS)`, async () => {
    const gateway = make();
    const view = await gateway.toolCatalog.snapshot();
    assert.equal(view.schemaVersion, 1);
    if (source === "fixture") {
      assert.equal(view.kind, "catalog");
      if (view.kind !== "catalog") return;
      for (const tool of view.tools) {
        assert.ok(tool.name.length > 0);
        assert.ok(tool.purpose.length > 0);
        assert.ok(tool.dataDestination.length > 0);
        assert.ok(tool.maintainer.length > 0);
        assert.ok(["devices", "calibration", "capture"].includes(tool.category));
      }
    } else {
      assert.equal(view.kind, "not-connected");
    }
  });

  test(`${label}: Release 卡片墙形态合法(C-RECIPE-3)`, async () => {
    const gateway = make();
    const wall = await gateway.modelProduction.releaseWall();
    assert.equal(wall.schemaVersion, 1);
    if (source === "fixture") {
      assert.equal(wall.kind, "wall");
      if (wall.kind !== "wall") return;
      assert.ok(wall.projects.length > 0);
      for (const project of wall.projects) {
        assert.ok(project.id.length > 0);
        assert.ok(project.title.length > 0);
        assert.ok(Number.isInteger(project.snapshotCount) && project.snapshotCount >= 0);
        // 未知不猜测:无检测证据时不允许编造健康结论
        if (!project.lastInspection) continue;
        assert.ok(project.lastInspection.at.length > 0);
      }
    } else {
      assert.equal(wall.kind, "not-connected");
    }
  });

  test(`${label}: 获取视图形态合法(C-ACQUIRE,F4-6 条目模型)`, async () => {
    const gateway = make();
    const view = await gateway.acquire.snapshot();
    assert.equal(view.schemaVersion, 1);
    if (source === "fixture") {
      assert.equal(view.kind, "entries");
      if (view.kind !== "entries") return;
      for (const entry of view.entries) {
        assert.ok(entry.warehouseItemId.length > 0);
        assert.ok(entry.folderName.length > 0);
        assert.ok(entry.displayName.length > 0);
        assert.ok(["imported_material", "downloaded_material"].includes(entry.kind));
        // 模式闭集:覆盖为 null(跟随全局)或两模式之一;生效模式必为两模式之一
        assert.ok(
          entry.artifactMode === null ||
            ["use_original_unitypackage", "generate_vpm"].includes(entry.artifactMode),
        );
        assert.ok(["use_original_unitypackage", "generate_vpm"].includes(entry.effectiveArtifactMode));
        assert.ok(entry.artifacts.length > 0);
        for (const artifact of entry.artifacts) {
          assert.ok(artifact.artifactSha256.startsWith("sha256:"));
          assert.ok(artifact.relativePath.length > 0);
          assert.ok(["pending", "clean", "quarantined"].includes(artifact.state));
          assert.ok(["original", "generated_vpm"].includes(artifact.role));
          assert.ok(Number.isSafeInteger(artifact.sizeBytes) && artifact.sizeBytes >= 0);
        }
      }
    } else {
      assert.equal(view.kind, "not-connected");
    }
  });

  test(`${label}: 未知条目详情不猜测(C-ACQUIRE)`, async () => {
    const gateway = make();
    const detail = await gateway.acquire.entryDetail("__missing__");
    assert.equal(detail.schemaVersion, 1);
    if (source === "fixture") {
      assert.equal(detail.kind, "not-found");
    } else {
      assert.equal(detail.kind, "not-connected");
    }
  });
}

test("fixture: cancel 可取消任务返回 ok,状态迁移为 cancelled 且不可再取消", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const result = await gateway.task.cancel("task-assembly");
  assert.equal(result.kind, "ok");
  const task = result.view.tasks.find((item) => item.id === "task-assembly");
  assert.equal(task?.status, "cancelled");
  assert.equal(task?.cancellable, false);

  const again = await gateway.task.cancel("task-assembly");
  assert.equal(again.kind, "rejected");
  if (again.kind === "rejected") assert.equal(again.reason, "not_cancellable");
});

test("fixture: cancel 后订阅者收到最新快照推送", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const pushed: number[] = [];
  const off = gateway.task.subscribe((view) => pushed.push(view.tasks.length));
  await gateway.task.cancel("task-assembly");
  off();
  assert.deepEqual(pushed, [7]);
});

test("fixture: cancel 不可取消任务返回 rejected(not_cancellable)", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const result = await gateway.task.cancel("task-scan");
  assert.equal(result.kind, "rejected");
  if (result.kind === "rejected") assert.equal(result.reason, "not_cancellable");
});

/* ---- F4-7:下载任务链 fixture 走查(下载侧五态经任务中心统一九态呈现) ---- */

test("fixture(F4-7): 下载任务链五态在任务中心快照中的呈现形态", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const view = await gateway.task.snapshot();
  const byId = new Map(view.tasks.map((task) => [task.id, task]));
  // 下载中:running + 进度 + 可取消(任务中心零特判的九态呈现)
  const active = byId.get("task-download-active");
  assert.equal(active?.status, "running");
  assert.deepEqual(active?.progress, { done: 34, total: 100 });
  assert.equal(active?.cancellable, true);
  assert.equal(active?.originPage, "warehouse");
  // 中断:failed + 可续传说明(重试入口的呈现条件,不造九态外新词)
  const interrupted = byId.get("task-download-interrupted");
  assert.equal(interrupted?.status, "failed");
  assert.equal(interrupted?.cancellable, false);
  assert.ok(interrupted?.errorText);
  // 策略拒绝:failed + 拒绝说明(不可重试形态)
  const policy = byId.get("task-download-policy");
  assert.equal(policy?.status, "failed");
  assert.ok(policy?.errorText);
  // 取消:cancelled 终态
  assert.equal(byId.get("task-download-cancelled")?.status, "cancelled");
});

test("fixture(F4-7): 下载中断任务 retry → ok/resume,回运行态且可取消", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const result = await gateway.task.retry("task-download-interrupted");
  assert.deepEqual(result, { kind: "ok", decision: "resume" });
  const view = await gateway.task.snapshot();
  const task = view.tasks.find((item) => item.id === "task-download-interrupted");
  assert.equal(task?.status, "running");
  assert.equal(task?.cancellable, true);
});

test("fixture(F4-7): 策略拒绝任务 retry → not_retryable 如实拒绝", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const result = await gateway.task.retry("task-download-policy");
  assert.deepEqual(result, { kind: "rejected", reason: "not_retryable" });
});

test("fixture(F4-7): 非重试任务与未知任务的 retry 裁决如实呈现", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const regular = await gateway.task.retry("task-scan");
  assert.deepEqual(regular, { kind: "rejected", reason: "not_retryable" });
  const missing = await gateway.task.retry("__missing__");
  assert.deepEqual(missing, { kind: "rejected", reason: "unknown_task" });
});

test("fixture(F4-7): 下载中任务 cancel → cancelled 终态(取消传导呈现)", async () => {
  const gateway = fixtureGateway("demo-tasks");
  const result = await gateway.task.cancel("task-download-active");
  assert.equal(result.kind, "ok");
  const task = result.view.tasks.find((item) => item.id === "task-download-active");
  assert.equal(task?.status, "cancelled");
  assert.equal(task?.cancellable, false);
});

test("empty: 全领域诚实空态", async () => {
  const gateway = emptyGateway();
  const deployer = (await gateway.environment.snapshot()).deployer;
  assert.equal(deployer.zones.play.kind, "not-run");
  assert.equal(deployer.zones.create.kind, "not-run");
  assert.equal((await gateway.modelProduction.snapshot()).workshop.kind, "idle");
  assert.equal((await gateway.toolCatalog.snapshot()).kind, "not-connected");
  assert.equal((await gateway.task.snapshot()).tasks.length, 0);
  assert.equal((await gateway.environment.capability()).state, "unavailable");
  assert.equal((await gateway.task.capability()).state, "unavailable");
});

/* ---- C-ENV:部署器按辖区状态机的 fixture 走查 ---- */

test("fixture(C-ENV): runCheck 驱动 running → results 迁移,两辖区互不污染", async () => {
  const gateway = fixtureGateway("demo-env-fresh", null, { settleMs: 5 });
  const seen: string[] = [];
  const off = gateway.environment.subscribe((view) => seen.push(view.deployer.zones.play.kind));
  assert.equal((await gateway.environment.snapshot()).deployer.zones.play.kind, "not-run");
  await gateway.environment.runCheck("play");
  await new Promise((resolve) => setTimeout(resolve, 50));
  off();
  assert.deepEqual(seen, ["running", "results"]);
  const play = (await gateway.environment.snapshot()).deployer.zones.play;
  assert.equal(play.kind, "results");
  if (play.kind === "results") {
    assert.ok(play.items.length > 0);
    assert.ok(play.checkedAt.length > 0);
  }
  // play 辖区的检测不得影响 create 辖区证据
  assert.equal((await gateway.environment.snapshot()).deployer.zones.create.kind, "not-run");
});

test("fixture(C-ENV): 检测失败落入 failed 并保留上次证据(last)", async () => {
  // demo-mixed 开局即带既有结果;覆盖 failZones 模拟重检失败
  const gateway = fixtureGateway("demo-mixed", null, { settleMs: 5, failZones: ["play"] });
  await gateway.environment.runCheck("play");
  await new Promise((resolve) => setTimeout(resolve, 50));
  const play = (await gateway.environment.snapshot()).deployer.zones.play;
  assert.equal(play.kind, "failed");
  if (play.kind !== "failed") return;
  // 旧证据保留供"仅供参考"展示,但当前结论是 failed
  assert.ok(play.last !== null && play.last.items.length > 0);
});

test("fixture(C-ENV): 从未检测即失败时 last 为 null,不虚构旧证据", async () => {
  const gateway = fixtureGateway("demo-env-fail", null, { settleMs: 5 });
  await gateway.environment.runCheck("create");
  await new Promise((resolve) => setTimeout(resolve, 50));
  const create = (await gateway.environment.snapshot()).deployer.zones.create;
  assert.equal(create.kind, "failed");
  if (create.kind !== "failed") return;
  assert.equal(create.last, null);
});

/* ---- C-ENV:修复计划流 ---- */

test("fixture(C-ENV): planFix 返回版本化计划,含候选确认步且末步为 recheck", async () => {
  const gateway = fixtureGateway("demo-mixed");
  const result = await gateway.environment.planFix("vpm");
  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") return;
  assert.equal(result.plan.schemaVersion, 1);
  assert.equal(result.plan.checkId, "vpm");
  assert.ok(result.plan.steps.length > 0);
  // Issue #4:自动识别失败时要求用户确认候选;计划以重检收尾
  assert.ok(result.plan.steps.some((step) => step.kind === "confirm-candidate"));
  assert.equal(result.plan.steps.at(-1)?.kind, "recheck");
});

test("fixture(C-ENV): planFix 未知检测项返回 unknown-check", async () => {
  const gateway = fixtureGateway("demo-mixed");
  const result = await gateway.environment.planFix("__missing__");
  assert.equal(result.kind, "unknown-check");
});

test("empty(C-ENV): planFix 恒 unavailable", async () => {
  const gateway = emptyGateway();
  const result = await gateway.environment.planFix("vpm");
  assert.equal(result.kind, "unavailable");
});

/* ---- C-ACQUIRE:本地图册走查(F4-6 条目模型;扫描范围场景已随裁决退役) ---- */

test("fixture(C-ACQUIRE): demo-acquire-empty 场景为空仓库(诚实空态)", async () => {
  const gateway = fixtureGateway("demo-acquire-empty");
  const view = await gateway.acquire.snapshot();
  assert.equal(view.kind, "entries");
  if (view.kind !== "entries") return;
  assert.equal(view.entries.length, 0);
});

test("fixture(C-ACQUIRE): 默认场景覆盖两 kind、三检查状态、两副本角色与两种模式形态", async () => {
  const gateway = fixtureGateway("demo-mixed");
  const view = await gateway.acquire.snapshot();
  assert.equal(view.kind, "entries");
  if (view.kind !== "entries") return;
  const kinds = new Set(view.entries.map((entry) => entry.kind));
  assert.ok(kinds.has("imported_material") && kinds.has("downloaded_material"));
  const states = new Set(view.entries.flatMap((entry) => entry.artifacts.map((a) => a.state)));
  assert.ok(states.has("pending") && states.has("clean") && states.has("quarantined"));
  const roles = new Set(view.entries.flatMap((entry) => entry.artifacts.map((a) => a.role)));
  assert.ok(roles.has("original") && roles.has("generated_vpm"));
  // 模式形态:既有覆盖(generate_vpm),也有跟随全局(null)
  assert.ok(view.entries.some((entry) => entry.artifactMode === "generate_vpm"));
  assert.ok(view.entries.some((entry) => entry.artifactMode === null));
});

test("fixture(C-ACQUIRE): 已知条目详情携带检查事实;隔离件附拒绝理由", async () => {
  const gateway = fixtureGateway("demo-mixed");
  const view = await gateway.acquire.snapshot();
  if (view.kind !== "entries") return;
  const quarantined = view.entries.find((entry) =>
    entry.artifacts.some((artifact) => artifact.state === "quarantined"),
  );
  assert.ok(quarantined !== undefined);
  const detail = await gateway.acquire.entryDetail(quarantined.warehouseItemId);
  assert.equal(detail.kind, "detail");
  if (detail.kind !== "detail") return;
  assert.equal(detail.entry.warehouseItemId, quarantined.warehouseItemId);
  for (const fact of detail.entry.artifacts) {
    // 诚实纪律:quarantined 必附拒绝理由;pending 无判定时刻;非隔离无理由
    if (fact.state === "quarantined") {
      assert.ok(fact.rejectionReason !== null && fact.rejectionReason.length > 0);
      assert.ok(fact.inspectedAt !== null);
    } else if (fact.state === "pending") {
      assert.equal(fact.inspectedAt, null);
      assert.equal(fact.rejectionReason, null);
    } else {
      assert.equal(fact.rejectionReason, null);
      assert.ok(fact.inspectedAt !== null);
    }
  }
});
