import { describe, expect, it } from "vitest";
import {
  APPLICATION_CONTRACT_VERSION,
  type ApplicationRequestV01,
  type CapabilityOperationV01,
  type TaskCancellationResultV01,
  type TaskSnapshotV01,
} from "@vua/contracts";
import { MockOrchestratorProviderV01 } from "./mock-provider.js";

function task(overrides: Partial<TaskSnapshotV01> = {}): TaskSnapshotV01 {
  return {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    taskId: "task-1",
    revision: 3,
    correlationId: "correlation-task-1",
    state: "running",
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-02T01:00:00.000Z",
    ...overrides,
  };
}

function request(
  value: Omit<ApplicationRequestV01, "contractVersion" | "requestId" | "correlationId">,
): ApplicationRequestV01 {
  return {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-1",
    correlationId: "correlation-request-1",
    ...value,
  } as ApplicationRequestV01;
}

describe("mock Orchestrator Provider v0.1", () => {
  it("handshakes without exposing a hosting or transport choice", async () => {
    const provider = new MockOrchestratorProviderV01({
      providerBuildId: "build-abc",
      providerInstanceId: "instance-abc",
    });

    const handshake = await provider.start();
    expect(handshake).toEqual({
      contractVersion: "0.1",
      supportedContractVersions: ["0.1"],
      providerBuildId: "build-abc",
      providerInstanceId: "instance-abc",
    });
    expect(provider.status()).toEqual({ contractVersion: "0.1", state: "ready", acceptingCalls: true });
    expect(JSON.stringify(handshake)).not.toMatch(/ffi|napi|pipe|socket|sidecar/i);
  });

  it("reports partial availability per operation and keeps queries read-only", async () => {
    const unavailableReason = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      code: "vua.unity.version_mismatch",
      category: "unavailable" as const,
      messageKey: "errors.unity.versionMismatch",
      recoverable: true,
      retryable: false,
      correlationId: "correlation-capability",
    };
    const capabilities: readonly CapabilityOperationV01[] = [
      { operationId: "unity.inspectEnvironment", availability: "available" },
      { operationId: "unity.mutateProject", availability: "unavailable", reason: unavailableReason },
    ];
    const provider = new MockOrchestratorProviderV01({ capabilities, tasks: [task()] });
    await provider.start();

    const before = provider.status();
    const response = await provider.invoke(request({ kind: "query", method: "application.getSnapshot", params: {} }));
    expect(response.ok).toBe(true);
    if (response.ok) expect(response.value).toMatchObject({ capabilities: { operations: capabilities } });
    expect(provider.status()).toEqual(before);
  });

  it("accepts stale observed revision as an idempotent cancellation intent", async () => {
    const provider = new MockOrchestratorProviderV01({ tasks: [task()] });
    await provider.start();
    const events: { revision: number; kind: string }[] = [];
    provider.subscribe((event) => {
      if ("taskId" in event) events.push({ revision: event.revision, kind: event.kind });
    });
    const cancel = request({
      kind: "command",
      method: "task.requestCancellation",
      commandId: "cancel-command-1",
      params: { taskId: "task-1", observedRevision: 1 },
    });

    const first = await provider.invoke(cancel);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value).toMatchObject({ outcome: "requested", revision: 4, state: "running" });
    expect(events).toEqual([{ revision: 4, kind: "task.cancellationRequested" }]);

    const replay = await provider.invoke(cancel);
    expect(replay).toEqual(first);

    const secondCommand = await provider.invoke(request({
      kind: "command",
      method: "task.requestCancellation",
      commandId: "cancel-command-2",
      params: { taskId: "task-1", observedRevision: 4 },
    }));
    expect(secondCommand.ok).toBe(true);
    if (secondCommand.ok) {
      expect((secondCommand.value as TaskCancellationResultV01).outcome).toBe("already_requested");
    }
    expect(events).toHaveLength(1);
  });

  it("keeps a terminal result when cancellation arrives late", async () => {
    const provider = new MockOrchestratorProviderV01({ tasks: [task({ state: "succeeded" })] });
    await provider.start();
    const response = await provider.invoke(request({
      kind: "command",
      method: "task.requestCancellation",
      commandId: "cancel-after-completion",
      params: { taskId: "task-1", observedRevision: 2 },
    }));
    expect(response.ok).toBe(true);
    if (response.ok) expect(response.value).toMatchObject({ outcome: "already_terminal", state: "succeeded" });
  });

  it("lets an observer recover an event gap by re-querying the task snapshot", async () => {
    const provider = new MockOrchestratorProviderV01({ tasks: [task({ revision: 1, state: "queued" })] });
    await provider.start();
    const revisions: number[] = [];
    const unsubscribe = provider.subscribe((event) => {
      if ("taskId" in event) revisions.push(event.revision);
    });
    provider.commitTaskState("task-1", "preparing");
    unsubscribe();
    provider.commitTaskState("task-1", "running");
    provider.subscribe((event) => {
      if ("taskId" in event) revisions.push(event.revision);
    });
    provider.commitTaskState("task-1", "paused");
    expect(revisions).toEqual([2, 4]);

    const snapshot = await provider.invoke(request({ kind: "query", method: "task.get", params: { taskId: "task-1" } }));
    expect(snapshot.ok).toBe(true);
    if (snapshot.ok) expect(snapshot.value).toMatchObject({ taskId: "task-1", revision: 4, state: "paused" });
  });

  it("preserves an interrupted task's real state and explicit recovery disposition", async () => {
    const provider = new MockOrchestratorProviderV01({
      tasks: [task({ state: "running", recoveryDisposition: "inspect_required" })],
    });
    await provider.start();
    const response = await provider.invoke(request({
      kind: "query",
      method: "task.get",
      params: { taskId: "task-1" },
    }));
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.value).toMatchObject({
        state: "running",
        recoveryDisposition: "inspect_required",
      });
    }
  });

  it("closes admission, waits at safe boundaries, and requires a user decision to force", async () => {
    const provider = new MockOrchestratorProviderV01({
      tasks: [task()],
      mutatingTaskIds: ["task-1"],
    });
    await provider.start();
    const preparation = await provider.prepareShutdown({ timeoutMs: 5_000 });
    expect(preparation).toMatchObject({ outcome: "needs_user_choice", blockingTasks: [{ taskId: "task-1" }] });
    expect(provider.status().acceptingCalls).toBe(false);

    const refused = await provider.invoke(request({ kind: "query", method: "task.list", params: {} }));
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error.code).toBe("vua.provider.not_accepting");

    expect(await provider.continueShutdown({ decision: "wait", timeoutMs: 5_000 }))
      .toMatchObject({ outcome: "needs_user_choice" });
    provider.commitTaskState("task-1", "cancelled");
    expect(await provider.continueShutdown({ decision: "wait", timeoutMs: 5_000 }))
      .toEqual({ contractVersion: "0.1", outcome: "safe_to_stop", blockingTasks: [] });

    const forcedProvider = new MockOrchestratorProviderV01({
      tasks: [task()],
      mutatingTaskIds: ["task-1"],
    });
    await forcedProvider.start();
    await forcedProvider.prepareShutdown({ timeoutMs: 5_000 });
    await expect(forcedProvider.continueShutdown({ decision: "force", userDecisionId: "" }))
      .rejects.toThrow("user decision id");
    expect(await forcedProvider.continueShutdown({ decision: "force", userDecisionId: "decision-1" }))
      .toMatchObject({ outcome: "forced", userDecisionId: "decision-1", interruptedTasks: [{ taskId: "task-1" }] });
  });
});

describe("mock provider F2 surface", () => {
  function demoRequest(commandId: string): ApplicationRequestV01 {
    return {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: `request-${commandId}`,
      correlationId: `correlation-${commandId}`,
      commandId,
      kind: "command",
      method: "task.startDemo",
      params: {},
    };
  }

  it("starts a demo task when capability is available and walks it to a cancellable terminal", async () => {
    const provider = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "demo.task", availability: "available" }],
    });
    await provider.start();

    const events: string[] = [];
    provider.subscribe((event) => events.push(event.kind === "capability.changed" ? event.kind : `${event.kind}:${event.state}`));

    const started = await provider.invoke(demoRequest("demo-1"));
    if (!started.ok || started.value.contractVersion !== APPLICATION_CONTRACT_VERSION || !("task" in started.value)) {
      throw new Error("demo start failed");
    }
    expect(started.value.task.state).toBe("queued");
    expect(started.value.task.cancellationRequested).toBe(false);
    expect(events).toEqual(["task.accepted:queued"]);

    // 幂等重放:相同 commandId 返回既有任务,不产生新任务与新事件
    const replay = await provider.invoke(demoRequest("demo-1"));
    if (!replay.ok || !("task" in replay.value)) throw new Error("demo replay failed");
    expect(replay.value.task.taskId).toBe(started.value.task.taskId);
    expect(events).toEqual(["task.accepted:queued"]);

    // 观察:提交 → 运行 → 请求取消 → 终态,事件 revision 单调
    provider.commitTaskState(started.value.task.taskId, "running");
    const cancel = await provider.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-cancel",
      correlationId: "correlation-cancel",
      commandId: "cancel-1",
      kind: "command",
      method: "task.requestCancellation",
      params: { taskId: started.value.task.taskId },
    });
    if (!cancel.ok || !("outcome" in cancel.value)) throw new Error("cancel failed");
    expect(cancel.value.outcome).toBe("requested");
    provider.commitTaskState(started.value.task.taskId, "cancelled");

    const list = await provider.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-list",
      correlationId: "correlation-list",
      kind: "query",
      method: "task.list",
      params: {},
    });
    if (!list.ok || !("tasks" in list.value)) throw new Error("task.list failed");
    expect(list.value.tasks).toHaveLength(1);
    expect(list.value.tasks[0]?.state).toBe("cancelled");
    expect(events).toEqual([
      "task.accepted:queued",
      "task.stateChanged:running",
      "task.cancellationRequested:running",
      "task.completed:cancelled",
    ]);
  });

  it("rejects the demo command when the capability is unavailable", async () => {
    const provider = new MockOrchestratorProviderV01({ capabilities: [] });
    await provider.start();

    const response = await provider.invoke(demoRequest("demo-1"));
    expect(response.ok).toBe(false);
    if (!response.ok) expect(response.error.code).toBe("vua.demo.unavailable");
    expect(Object.keys(response)).not.toContain("value");
  });

  it("returns the injected environment snapshot, or an honest empty one", async () => {
    const injected = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 4,
      capturedAt: "2026-09-04T00:00:00.000Z",
      items: [
        {
          checkId: "steam",
          zone: "play" as const,
          presence: "detected" as const,
          facts: { installPath: "C:/Program Files (x86)/Steam" },
        },
        {
          checkId: "unity_editors",
          zone: "create" as const,
          presence: "detection_failed" as const,
          errorCode: "vua.env.probe_failed",
          facts: {},
        },
      ],
    };
    const seeded = new MockOrchestratorProviderV01({ environment: injected });
    await seeded.start();
    const snapshot = await seeded.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-env",
      correlationId: "correlation-env",
      kind: "query",
      method: "environment.getSnapshot",
      params: {},
    });
    expect(snapshot.ok).toBe(true);
    if (snapshot.ok && "items" in snapshot.value) expect(snapshot.value).toEqual(injected);

    const bare = new MockOrchestratorProviderV01();
    await bare.start();
    const empty = await bare.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-env-empty",
      correlationId: "correlation-env-empty",
      kind: "query",
      method: "environment.getSnapshot",
      params: {},
    });
    expect(empty.ok).toBe(true);
    if (empty.ok && "items" in empty.value) {
      expect(empty.value.items).toEqual([]);
      expect(typeof empty.value.capturedAt).toBe("string");
    }
  });
});

describe("mock provider production surface (amf-production v0.2)", () => {
  const productionCapability: CapabilityOperationV01[] = [
    { operationId: "task.list", availability: "available" },
    { operationId: "production.useCase", availability: "available" },
  ];
  const quad = {
    sourceFolder: "C:/materials/closet",
    projectRoot: "C:/projects/target",
    artifactOutputRoot: "C:/artifacts",
    projectId: "project",
  };

  async function startedProvider() {
    const provider = new MockOrchestratorProviderV01({ capabilities: productionCapability });
    await provider.start();
    return provider;
  }

  function startInspection(commandId: string): ApplicationRequestV01 {
    return request({
      commandId,
      kind: "command",
      method: "production.startInspection",
      params: { ...quad },
    } as Parameters<typeof request>[0]);
  }

  it("gates production commands on the production.useCase capability", async () => {
    const provider = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "task.list", availability: "available" }],
    });
    await provider.start();
    const rejected = await provider.invoke(startInspection("command-1"));
    expect(rejected).toMatchObject({
      ok: false,
      error: { code: "vua.production.unavailable", category: "unavailable", retryable: false },
    });
  });

  it("rejects an incomplete quadrant before creating any task (vector parity)", async () => {
    const provider = await startedProvider();
    const rejected = await provider.invoke(request({
      commandId: "command-0",
      kind: "command",
      method: "production.startInspection",
      params: { sourceFolder: quad.sourceFolder },
    } as Parameters<typeof request>[0]));
    expect(rejected).toMatchObject({ ok: false, error: { code: "vua.production.invalid_params" } });
  });

  it("issues a stable domain identity, completes inline, and replays idempotently", async () => {
    const provider = await startedProvider();

    const started = await provider.invoke(startInspection("command-1"));
    if (!started.ok || !("task" in started.value) || !("inspectionId" in started.value)) {
      throw new Error("inspection start failed");
    }
    const taskId = started.value.task.taskId;
    const inspectionId = started.value.inspectionId;
    // 真实链内联完成(Rust 同形):回执任务即 succeeded;域身份 insp- 前缀
    expect(started.value.task.state).toBe("succeeded");
    expect(inspectionId).toMatch(/^insp-[0-9a-f]{16}$/);

    // 幂等重放:相同 commandId 回放既有回执,不新建
    const replay = await provider.invoke(startInspection("command-1"));
    if (!replay.ok || !("task" in replay.value) || !("inspectionId" in replay.value)) {
      throw new Error("inspection replay failed");
    }
    expect(replay.value.task.taskId).toBe(taskId);
    expect(replay.value.inspectionId).toBe(inspectionId);

    // 查询面:按域身份直取文档;未知引用明确拒绝(record_not_found)
    const document = await provider.invoke(request({
      kind: "query",
      method: "production.getInspection",
      params: { inspectionId },
    } as Parameters<typeof request>[0]));
    if (!document.ok || !("inspection" in document.value)) throw new Error("inspection query failed");
    expect(document.value.inspection).toMatchObject({
      inspectionId,
      plannability: "plannable",
    });
    expect(document.value.state).toBe("succeeded");
    const missing = await provider.invoke(request({
      kind: "query",
      method: "production.getInspection",
      params: { inspectionId: "insp-ffffffffffffffff" },
    } as Parameters<typeof request>[0]));
    expect(missing).toMatchObject({ ok: false, error: { code: "vua.production.record_not_found" } });
  });

  it("plans with a bound revision and rejects stale confirmations before creating a task", async () => {
    const provider = await startedProvider();
    const started = await provider.invoke(startInspection("command-1"));
    if (!started.ok || !("inspectionId" in started.value)) throw new Error("inspection start failed");
    const inspectionId = started.value.inspectionId;

    const planned = await provider.invoke(request({
      commandId: "command-2",
      kind: "command",
      method: "production.requestPlan",
      params: { inspectionId, mode: "direct_unity_package" },
    } as Parameters<typeof request>[0]));
    if (!planned.ok || !("planId" in planned.value) || !("revision" in planned.value)) {
      throw new Error("plan start failed");
    }
    const planId = planned.value.planId;
    expect(planId).toMatch(/^plan-[0-9a-f]{16}$/);
    const revision = planned.value.revision;
    expect(revision).toBeGreaterThanOrEqual(1);

    const planDoc = await provider.invoke(request({
      kind: "query",
      method: "production.getPlan",
      params: { planId },
    } as Parameters<typeof request>[0]));
    if (!planDoc.ok || !("plan" in planDoc.value)) throw new Error("plan query failed");
    expect(planDoc.value.plan).toMatchObject({
      revision,
      inspectionId,
      estimatedDurationMs: null,
      diffs: [],
    });

    // 确认纪律:过期 revision 在任务创建前拒绝(不产生半个任务)
    const stale = await provider.invoke(request({
      commandId: "command-3",
      kind: "command",
      method: "production.confirmPlan",
      params: { planId, observedRevision: 99, riskChoice: "continue" },
    } as Parameters<typeof request>[0]));
    expect(stale).toMatchObject({ ok: false, error: { code: "vua.production.plan_mismatch" } });

    const confirmed = await provider.invoke(request({
      commandId: "command-4",
      kind: "command",
      method: "production.confirmPlan",
      params: { planId, observedRevision: revision, riskChoice: "snapshot_and_continue" },
    } as Parameters<typeof request>[0]));
    expect(confirmed.ok).toBe(true);

    // 构建记录按计划引用可取(planId 别名);未知引用明确拒绝
    const record = await provider.invoke(request({
      kind: "query",
      method: "production.getBuildRecord",
      params: { buildRecordId: planId },
    } as Parameters<typeof request>[0]));
    if (!record.ok || !("buildRecord" in record.value)) throw new Error("record query failed");
    expect(record.value.buildRecord).toMatchObject({
      status: "succeeded",
      restoreAttempted: false,
      evidenceSummary: { snapshot: { attempted: true, succeeded: true } },
    });
    expect(await provider.invoke(request({
      kind: "query",
      method: "production.getBuildRecord",
      params: { buildRecordId: "record-missing" },
    } as Parameters<typeof request>[0]))).toMatchObject({
      ok: false,
      error: { code: "vua.production.record_not_found" },
    });
  });

  it("requires the decision id and binds recovery to terminal failed or cancelled tasks", async () => {
    const failedTask = task({ taskId: "task-failed-1", state: "failed", revision: 5 });
    const queuedTask = task({ taskId: "task-queued-1", state: "queued", revision: 1 });
    const provider = new MockOrchestratorProviderV01({
      capabilities: productionCapability,
      tasks: [failedTask, queuedTask],
    });
    await provider.start();

    // decisionId 缺失:绑定三元组不成立,受理前拒绝
    const missingDecision = await provider.invoke(request({
      commandId: "recover-0",
      kind: "command",
      method: "production.recover",
      params: { taskId: "task-failed-1", decision: "rollback", decisionId: "" },
    } as Parameters<typeof request>[0]));
    expect(missingDecision).toMatchObject({
      ok: false,
      error: { code: "vua.production.decision_id_required" },
    });

    // 非终态任务不可恢复
    const healthy = await provider.invoke(request({
      commandId: "recover-1",
      kind: "command",
      method: "production.recover",
      params: { taskId: "task-queued-1", decision: "rollback", decisionId: "udid-1" },
    } as Parameters<typeof request>[0]));
    expect(healthy).toMatchObject({ ok: false, error: { code: "vua.production.not_recoverable" } });

    // failed 终态可恢复:新任务受理
    const recovered = await provider.invoke(request({
      commandId: "recover-2",
      kind: "command",
      method: "production.recover",
      params: { taskId: "task-failed-1", decision: "rollback", decisionId: "udid-2" },
    } as Parameters<typeof request>[0]));
    if (!recovered.ok || !("task" in recovered.value)) throw new Error("recover failed");
    expect(recovered.value.task.taskId).not.toBe("task-failed-1");
  });
});
