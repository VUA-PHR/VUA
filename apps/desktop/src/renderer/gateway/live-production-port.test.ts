import { describe, expect, it, vi } from "vitest";
import { MockOrchestratorProviderV01, type OrchestratorProviderV01 } from "@vua/orchestrator-provider";
import type { ApplicationEventV01, CapabilityOperationV01 } from "@vua/contracts";
import { routeDesktopGatewayInvoke } from "../../electron/gateway-router.js";
import { createElectronGateway, type DesktopKernelHost } from "./electron-gateway.js";
import type { ModelProductionPort, ModelProductionView } from "./model-production-port.js";

/**
 * F-3 live 生产端口测试:renderer typed client → Kernel 路由
 * (routeDesktopGatewayInvoke)→ mock Provider 执行器,全链路无 Electron/Rust。
 * 用 mock 的合成数据覆盖冻结协议要求的五种生命周期呈现:
 * 成功 / 取消 / 漂移(failed_recoverable)/ 超时(expired)/ 回滚。
 */

const rendererUrl = "http://127.0.0.1:5173";

const PRODUCTION_CAPABILITIES = [
  { operationId: "task.list", availability: "available" as const },
  { operationId: "production.useCase", availability: "available" as const },
];

function kernelHost(
  provider: OrchestratorProviderV01,
  materialSources: ReadonlyMap<string, string> = new Map([["mat-1", "C:/materials/closet"]]),
): DesktopKernelHost {
  const listeners = new Set<(event: ApplicationEventV01) => void>();
  provider.subscribe((event) => {
    for (const listener of listeners) listener(event);
  });
  return {
    gateway: {
      invoke: async (request) =>
        routeDesktopGatewayInvoke(
          {
            provider,
            productVersion: "0.4.2",
            platform: "win32",
            rendererUrl,
            resolveMaterialSource: (refId) => {
              const sourceFolder = materialSources.get(refId);
              return sourceFolder === undefined
                ? undefined
                : { sourceFolder, intake: "direct_unity_package" };
            },
          },
          `${rendererUrl}/`,
          request,
        ),
    },
    events: {
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
}

const dialog = {
  pickMaterialSource: async (intake: string) =>
    intake === "direct_unity_package"
      ? { refId: "mat-1", displayName: "closet.unitypackage" }
      : null,
};

async function liveGateway(capabilities: CapabilityOperationV01[] = PRODUCTION_CAPABILITIES): Promise<{
  provider: MockOrchestratorProviderV01;
  port: ModelProductionPort;
  gateway: ReturnType<typeof createElectronGateway>;
}> {
  const provider = new MockOrchestratorProviderV01({ capabilities });
  await provider.start();
  const gateway = createElectronGateway({ ...kernelHost(provider), dialog }, null);
  return { provider, port: gateway.modelProduction, gateway };
}

/** 把检查任务推进到 succeeded 并等文档回填(事件 → task.get → getInspection) */
async function completeInspection(provider: MockOrchestratorProviderV01, port: ModelProductionPort) {
  const view = await port.snapshot();
  if (view.productionRun.kind !== "run") throw new Error("expected a run");
  const inspectTaskId = view.productionRun.taskId;
  provider.commitTaskState(inspectTaskId, "succeeded");
  await vi.waitFor(async () => {
    expect(inspectionOf(await port.snapshot())).not.toBeNull();
  });
  const inspection = inspectionOf(await port.snapshot());
  if (inspection === null) throw new Error("expected inspection document");
  return { inspectTaskId, inspection };
}

async function planAndWait(provider: MockOrchestratorProviderV01, port: ModelProductionPort, inspectionId: string) {
  const planned = await port.requestPlan(inspectionId);
  if (planned.kind !== "ok") throw new Error("expected plan acceptance");
  provider.commitTaskState(planned.taskId, "succeeded");
  await vi.waitFor(async () => {
    expect(planOf(await port.snapshot())).not.toBeNull();
  });
  const plan = planOf(await port.snapshot());
  if (plan === null) throw new Error("expected plan document");
  return { planTaskId: planned.taskId, plan };
}

function runStateOf(view: ModelProductionView): string {
  return view.productionRun.kind === "run" ? view.productionRun.runState : view.productionRun.kind;
}

function inspectionOf(view: ModelProductionView) {
  return view.productionRun.kind === "run" ? view.productionRun.inspection : null;
}

function planOf(view: ModelProductionView) {
  return view.productionRun.kind === "run" ? view.productionRun.plan : null;
}

function recordOf(view: ModelProductionView) {
  return view.productionRun.kind === "run" ? view.productionRun.buildRecord : null;
}

describe("live production port over the Kernel route (F-3)", () => {
  it("walks the happy path through all seven methods to a build record", async () => {
    const { provider, port, gateway } = await liveGateway();
    const invokeSpy = vi.spyOn(provider, "invoke");

    // 能力就绪;开局诚实空态
    expect(await port.capability()).toEqual({
      overall: { state: "unavailable", detailKey: "detectorsMissing" },
      production: { state: "ready" },
    });
    expect(runStateOf(await port.snapshot())).toBe("not-connected");

    // 素材选取经 Kernel 对话框;startInspection 携带 refId(路径由 Kernel 解析)
    const material = await port.pickMaterial("direct_unity_package");
    expect(material).toEqual({ materialId: "mat-1", intake: "direct_unity_package", displayName: "closet.unitypackage" });
    const started = await port.startInspection(material!);
    expect(started.kind).toBe("ok");
    if (started.kind !== "ok" || started.run.kind !== "run") throw new Error("expected a run");
    expect(started.taskId).toMatch(/^production-/);
    expect(started.run.runState).toBe("inspect");
    expect(started.run.cancelled).toBe(false);
    expect(started.run.source).toEqual(material);
    expect(started.run.inspection).toBeNull();
    const startCall = invokeSpy.mock.calls.find(([request]) => request.method === "production.startInspection")?.[0];
    // Kernel 已把 refId 翻译为真实路径(materialRefId 是 Gateway 面参数,不进应用请求)
    expect(startCall).toMatchObject({
      kind: "command",
      params: { sourceFolder: "C:/materials/closet" },
    });

    // 检查任务成功 → 检查文档回填;任务中心如实呈现已完成任务
    const { inspectTaskId, inspection } = await completeInspection(provider, port);
    expect(inspection.plannability).toBe("plannable");
    expect(inspection.source).toEqual(material);
    const centerTask = (await gateway.task.snapshot()).tasks.find((task) => task.id === inspectTaskId);
    expect(centerTask).toMatchObject({ status: "completed", cancellable: false });

    // getInspection:已知引用返回结果,未知引用诚实 not-connected
    expect((await port.getInspection(inspectTaskId)).kind).toBe("inspection");
    expect(await port.getInspection("__missing__")).toEqual({ schemaVersion: 1, kind: "not-connected" });

    // requestPlan → 计划文档回填,阶段转 await_confirmation
    const { planTaskId, plan } = await planAndWait(provider, port, inspectTaskId);
    expect(runStateOf(await port.snapshot())).toBe("await_confirmation");
    expect(plan.revision).toBe(1);
    expect(plan.stages.map((stage) => stage.stage)).toEqual(["snapshot", "execute", "validate"]);
    expect(plan.estimatedDurationMs).not.toBeNull();
    expect((await port.getPlan(plan.planId)).kind).toBe("plan");
    expect(await port.getPlan("__missing__")).toEqual({ schemaVersion: 1, kind: "not-connected" });

    // 超时(确认失效):过期 revision 被拒,运行态 expired(超时生命周期)
    const stale = await port.confirmPlan(plan.planId, 99);
    expect(stale).toMatchObject({ kind: "rejected", reason: "stale_revision" });
    expect(runStateOf(await port.snapshot())).toBe("expired");

    // 确认绑定 revision:正确 revision 创建执行任务,expired 解除
    const confirmed = await port.confirmPlan(plan.planId, plan.revision);
    expect(confirmed.kind).toBe("ok");
    if (confirmed.kind !== "ok" || confirmed.run.kind !== "run") throw new Error("expected a run");
    expect(confirmed.run.runState).toBe("snapshot");
    const confirmCall = invokeSpy.mock.calls.filter(([request]) => request.method === "production.confirmPlan").at(-1)?.[0];
    expect(confirmCall).toMatchObject({ kind: "command", params: { planId: plan.planId, observedRevision: plan.revision } });

    // 执行链:running → execute;succeeded → completed + Build Record 回填
    provider.commitTaskState(confirmed.taskId, "running");
    await vi.waitFor(async () => expect(runStateOf(await port.snapshot())).toBe("execute"));
    provider.commitTaskState(confirmed.taskId, "succeeded");
    await vi.waitFor(async () => expect(recordOf(await port.snapshot())).not.toBeNull());
    const doneView = await port.snapshot();
    expect(runStateOf(doneView)).toBe("completed");
    const record = recordOf(doneView)!;
    expect(record.status).toBe("succeeded");
    expect(record.restoreAttempted).toBe(false);
    expect(record.stages).toEqual(["snapshot", "execute", "validate"]);
    expect(Object.values(record.facts).every((fact) => fact.length > 0)).toBe(true);

    // getBuildRecord:计划引用派生记录 id;未知引用诚实 not-connected
    expect((await port.getBuildRecord(plan.planId)).kind).toBe("record");
    expect(await port.getBuildRecord("__missing__")).toEqual({ schemaVersion: 1, kind: "not-connected" });

    // 车间视图:live 运行推导轨道与迁移日志(headline 取轨道结论文案)
    const view = await port.snapshot();
    expect(view.workshop.kind).toBe("running");
    if (view.workshop.kind !== "running") return;
    expect(view.workshop.stages.map((stage) => stage.state)).toEqual([
      "completed", "completed", "completed", "completed", "completed", "pending",
    ]);
    expect(view.workshop.log.length).toBeGreaterThanOrEqual(4);
  });

  it("marks the run cancelled when the production task reaches the cancelled state", async () => {
    const { provider, port, gateway } = await liveGateway();
    const material = await port.pickMaterial("direct_unity_package");
    const started = await port.startInspection(material!);
    if (started.kind !== "ok") throw new Error("expected start acceptance");

    // 取消纪律:cancelled 是任务事实;runState 保留取消发生的阶段
    provider.commitTaskState(started.taskId, "cancelled");
    await vi.waitFor(async () => {
      expect(await port.snapshot()).toMatchObject({
        productionRun: { kind: "run", cancelled: true, runState: "inspect" },
      });
    });
    // 取消后任务中心如实呈现
    const task = (await gateway.task.snapshot()).tasks.find((entry) => entry.id === started.taskId);
    expect(task).toMatchObject({ status: "cancelled", cancellable: false });
  });

  it("covers drift (failed_recoverable), recover rollback, and not_recoverable/unknown_ref rejections", async () => {
    const { provider, port } = await liveGateway();
    const invokeSpy = vi.spyOn(provider, "invoke");

    const material = await port.pickMaterial("direct_unity_package");
    const started = await port.startInspection(material!);
    if (started.kind !== "ok") throw new Error("expected start acceptance");
    const { inspectTaskId } = await completeInspection(provider, port);
    const { plan } = await planAndWait(provider, port, inspectTaskId);
    const confirmed = await port.confirmPlan(plan.planId, plan.revision);
    if (confirmed.kind !== "ok") throw new Error("expected confirm acceptance");

    // 漂移:failed + inspect_required → failed_recoverable(恢复卡片事实)
    provider.commitTaskState(confirmed.taskId, "running");
    provider.commitTaskState(confirmed.taskId, "failed", { recoveryDisposition: "inspect_required" });
    await vi.waitFor(async () => expect(runStateOf(await port.snapshot())).toBe("failed_recoverable"));

    // 恢复决定 ID 由 Kernel 生成:渲染层不携带 decisionId,应用请求带 udid- 前缀
    const recovered = await port.recover(confirmed.taskId, { kind: "rollback" });
    expect(recovered.kind).toBe("ok");
    const recoverCall = invokeSpy.mock.calls.filter(([request]) => request.method === "production.recover").at(-1)?.[0];
    expect(recoverCall).toMatchObject({ kind: "command", params: { taskId: confirmed.taskId, decision: "rollback" } });
    expect(String((recoverCall?.params as { decisionId: string }).decisionId)).toMatch(/^udid-/);
    if (recovered.kind !== "ok" || recovered.run.kind !== "run") throw new Error("expected a run");
    expect(recovered.run.runState).toBe("recover");

    // 回滚任务成功 → 运行结案;记录引用沿用原计划
    provider.commitTaskState(recovered.taskId, "succeeded");
    await vi.waitFor(async () => expect(runStateOf(await port.snapshot())).toBe("completed"));
    expect(recordOf(await port.snapshot())).not.toBeNull();

    // 终态成功不可恢复;未知任务引用拒绝
    expect(await port.recover(recovered.taskId, { kind: "continue" }))
      .toMatchObject({ kind: "rejected", reason: "not_recoverable" });
    expect(await port.recover("__missing__", { kind: "rollback" }))
      .toMatchObject({ kind: "rejected", reason: "unknown_ref" });
  });

  it("stays honest when the production use case is absent and the provider is unreachable", async () => {
    // production.useCase 缺席:命令以应用错误拒绝(unavailable),查询诚实退路
    const { port } = await liveGateway([PRODUCTION_CAPABILITIES[0]!]);
    const material = await port.pickMaterial("direct_unity_package");
    expect(await port.startInspection(material!)).toEqual({ kind: "unavailable" });
    expect(await port.requestPlan("i-1")).toEqual({ kind: "unavailable" });
    expect(await port.confirmPlan("p-1", 1)).toEqual({ kind: "unavailable" });
    expect(await port.recover("t-1", { kind: "rollback" })).toEqual({ kind: "unavailable" });
    expect(await port.getInspection("i-1")).toEqual({ schemaVersion: 1, kind: "not-connected" });
    expect(await port.getPlan("p-1")).toEqual({ schemaVersion: 1, kind: "not-connected" });
    expect(await port.getBuildRecord("r-1")).toEqual({ schemaVersion: 1, kind: "not-connected" });
    // 任务引擎仍在:能力报告就绪(生产缺席在命令层如实拒绝)
    await expect(port.capability()).resolves.toMatchObject({ production: { state: "ready" } });

    // Provider 不可达:capability 首帧诚实失败向上抛;snapshot 保持内存事实
    const deadProvider = new MockOrchestratorProviderV01({ capabilities: PRODUCTION_CAPABILITIES });
    await deadProvider.start();
    const host = kernelHost(deadProvider);
    host.gateway.invoke = async () => ({ ok: false, error: { code: "internal", messageKey: "errors.gateway.providerUnavailable" } });
    const deadPort = createElectronGateway({ ...host, dialog }, null).modelProduction;
    await expect(deadPort.capability()).rejects.toThrow("production_capability_unavailable");
    await expect(deadPort.snapshot()).resolves.toMatchObject({ schemaVersion: 1, productionRun: { kind: "not-connected" } });
  });

  it("keeps the last view when a refresh fails mid-subscription and resumes after recovery", async () => {
    const { provider } = await liveGateway();
    const host = kernelHost(provider);
    let broken = false;
    const inner = host.gateway.invoke.bind(host.gateway);
    host.gateway.invoke = async (request) => {
      if (broken) return { ok: false, error: { code: "internal", messageKey: "errors.gateway.providerUnavailable" } };
      return inner(request);
    };
    const livePort = createElectronGateway({ ...host, dialog }, null).modelProduction;
    const views: ModelProductionView[] = [];
    const unsubscribe = livePort.subscribe((view) => views.push(view));

    const material = await livePort.pickMaterial("direct_unity_package");
    const started = await livePort.startInspection(material!);
    if (started.kind !== "ok") throw new Error("expected start acceptance");
    await vi.waitFor(() => expect(views.length).toBeGreaterThanOrEqual(1));
    expect(runStateOf(views[views.length - 1]!)).toBe("inspect");

    // 断连期间事件到达:task.get 失败 → 保留上一视图(阶段不回退、不虚构)
    broken = true;
    provider.commitTaskState(started.taskId, "running");
    const count = views.length;
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(views.length).toBe(count);
    expect(runStateOf(views[views.length - 1]!)).toBe("inspect");

    // 恢复后下一次事件继续驱动(权威状态重取成功)
    broken = false;
    provider.commitTaskState(started.taskId, "cancelled");
    await vi.waitFor(async () => {
      expect(await livePort.snapshot()).toMatchObject({ productionRun: { cancelled: true, runState: "inspect" } });
    });
    unsubscribe();
  });
});

describe("live modelProduction wiring (electron gateway)", () => {
  it("keeps the run view honest outside the Electron host while the dialog degrades to null", async () => {
    const gateway = createElectronGateway(undefined, null);
    expect(await gateway.modelProduction.pickMaterial("local_reusable_vpm")).toBeNull();
    await expect(gateway.modelProduction.capability()).rejects.toThrow("production_capability_unavailable");
    expect(await gateway.modelProduction.snapshot()).toMatchObject({
      schemaVersion: 1,
      productionRun: { kind: "not-connected" },
      workshop: { kind: "idle" },
    });
    expect(gateway.dataSource()).toBe("live");
  });
});
