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
