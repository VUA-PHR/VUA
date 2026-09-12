import { describe, expect, it } from "vitest";
import type {
  ApplicationEventV01,
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import { createLiveProjectOps, type ProjectOpsOutcome } from "./project-ops-port.ts";
import type { GatewayClient, GatewayResult } from "./gateway-client.ts";

/**
 * project-ops 端口任务化消费测试(proposal 020 result 回流,#22 消费批):
 * fake GatewayClient 编排受理回执 → task.get 终态快照/事件通道,验证
 * importCopy 的任务等待与 result 窄化全部分支。诚实纪律钉死:失败/取消/
 * 超时/形态不齐一律 unavailable,不猜测、不伪造结果文档。
 */

type InvokeHandler = (
  request: DesktopGatewayRequestV1,
) => Promise<GatewayResult<DesktopGatewaySuccessValueV1>>;

type EventFire = (event: ApplicationEventV01) => void;
/** 事件注入口:subscribe 时把 emitter 交给测试(fake 事件通道) */
type EmitHook = (fire: EventFire) => void;

function fakeClient(handlers: {
  invoke?: InvokeHandler | undefined;
  emit?: EmitHook | undefined;
}): GatewayClient {
  const listeners = new Set<EventFire>();
  return {
    invoke:
      handlers.invoke ??
      (async () => ({ ok: false, error: { kind: "unavailable" } as const })),
    subscribe: (listener) => {
      listeners.add(listener);
      handlers.emit?.((event) => {
        for (const entry of listeners) entry(event);
      });
      return () => listeners.delete(listener);
    },
  };
}

const PLAN_PARAMS = {
  phase: "plan" as const,
  sourcePath: "C:/projects/source",
  targetParentDirectory: "C:/warehouse",
  targetProjectName: "copy",
};

/** wire 原始值:TS 联合未覆盖 project-ops 受理信封(窄化按字段存在性),
 *  与 Rust 侧 json! 同形构造后按 wire 值收窄语义 cast */
function asWire(value: unknown): DesktopGatewaySuccessValueV1 {
  return value as DesktopGatewaySuccessValueV1;
}

function acceptedValue(taskId = "task-1"): DesktopGatewaySuccessValueV1 {
  return asWire({
    schemaVersion: "0.2",
    operation: "project.import-copy",
    taskId,
    correlationId: "corr-1",
  });
}

let revision = 1;

function taskSnapshot(
  overrides: Partial<Record<string, unknown>> = {},
): DesktopGatewaySuccessValueV1 {
  revision += 1;
  return asWire({
    contractVersion: "0.1",
    taskId: "task-1",
    revision,
    correlationId: "corr-1",
    state: "running",
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-12T00:00:00Z",
    ...overrides,
  });
}

function completedEvent(taskId = "task-1"): ApplicationEventV01 {
  return {
    contractVersion: "0.1",
    eventId: "evt-1",
    taskId,
    revision,
    occurredAt: "2026-09-12T00:00:01Z",
    correlationId: "corr-1",
    state: "succeeded",
    kind: "task.completed",
    payload: {},
  } as ApplicationEventV01;
}

/** 受理 → 每次任务查询按脚本依次出快照(末项重复);emit 挂事件注入口 */
function scriptedClient(
  snapshots: DesktopGatewaySuccessValueV1[],
  emit?: EmitHook | undefined,
  accepted: unknown = acceptedValue(),
): GatewayClient {
  let call = 0;
  return fakeClient({
    invoke: async (request) => {
      if (request.method === "project.import-copy") {
        return { ok: true, value: asWire(accepted) };
      }
      const value = snapshots[Math.min(call, snapshots.length - 1)]!;
      call += 1;
      return { ok: true, value };
    },
    emit,
  });
}

const PLAN_DOCUMENT = {
  kind: "plan",
  sourcePath: "C:/projects/source",
  targetPath: "C:/warehouse/copy",
  targetProjectName: "copy",
  estimatedBytes: 100,
  excludedEntries: ["Library"],
  sourceTopLevels: ["Assets"],
  planDigest: "digest-1",
};

const RECEIPT_DOCUMENT = {
  kind: "receipt",
  sourcePath: "C:/projects/source",
  targetPath: "C:/warehouse/copy",
  targetProjectName: "copy",
  copiedTopLevels: ["Assets"],
  excludedEntries: ["Library"],
  bytesCopied: 100,
  sourceLink: {
    sourcePath: "C:/projects/source",
    sourceAssociations: ["vcc_registered"],
    importedAt: "2026-09-12T00:00:02Z",
    taskCorrelation: "corr-1",
  },
  reInspection: {
    unityVersion: "2022.3.22f1",
    unityClassification: "production_target",
    manifestPresent: true,
    manifestSchemaOk: true,
  },
};

const REJECTED_DOCUMENT = {
  kind: "rejected",
  guard: "plan_drift",
  code: "vua.project.plan_drift",
  detail: "digest mismatch",
};

function donePayload(result: unknown): Record<string, unknown> {
  return { schemaVersion: "0.2", operation: "project.import-copy", result } as Record<string, unknown>;
}

function unavailable(outcome: ProjectOpsOutcome): void {
  expect(outcome).toEqual({ ok: false, error: { kind: "unavailable" } });
}

describe("importCopy task-based consumption (proposal 020 result reflux)", () => {
  it("narrows a plan document from an already-terminal snapshot (fast-task inline precedent)", async () => {
    const client = scriptedClient([
      taskSnapshot({ state: "succeeded", result: donePayload(PLAN_DOCUMENT) }),
    ]);
    const port = createLiveProjectOps(client);
    const outcome = await port.importCopy(PLAN_PARAMS);
    expect(outcome).toEqual({ ok: true, plan: PLAN_DOCUMENT });
  });

  it("narrows a receipt document from the terminal snapshot result", async () => {
    const client = scriptedClient([
      taskSnapshot({ state: "succeeded_with_warnings", result: donePayload(RECEIPT_DOCUMENT) }),
    ]);
    const port = createLiveProjectOps(client);
    const outcome = await port.importCopy({
      ...PLAN_PARAMS,
      phase: "apply",
      confirmedPlanDigest: "digest-1",
    });
    expect(outcome).toEqual({ ok: true, receipt: RECEIPT_DOCUMENT });
  });

  it("narrows a guard rejection traveling as a result document on a succeeded task", async () => {
    const client = scriptedClient([
      taskSnapshot({ state: "succeeded", result: donePayload(REJECTED_DOCUMENT) }),
    ]);
    const port = createLiveProjectOps(client);
    const outcome = await port.importCopy(PLAN_PARAMS);
    expect(outcome).toEqual({ ok: true, rejected: REJECTED_DOCUMENT });
  });

  it("waits for the completed event and re-fetches the authoritative snapshot", async () => {
    const running = taskSnapshot({ state: "running" });
    const done = taskSnapshot({ state: "succeeded", result: donePayload(PLAN_DOCUMENT) });
    let calls = 0;
    let emit: EventFire | undefined;
    const client = fakeClient({
      invoke: async (request) => {
        if (request.method === "project.import-copy") {
          return { ok: true, value: acceptedValue() };
        }
        calls += 1;
        // 首取(受理后立即)= 未终态;事件后重取 = 终态
        return { ok: true, value: calls === 1 ? running : done };
      },
      emit: (fn) => {
        emit = fn;
      },
    });
    const port = createLiveProjectOps(client);
    const pending = port.importCopy(PLAN_PARAMS);
    // 让初始快照消费完、等待器进入事件订阅后再发事件
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (emit === undefined) throw new Error("expected an event emitter");
    emit(completedEvent());
    const outcome = await pending;
    expect(calls).toBe(2);
    expect(outcome).toEqual({ ok: true, plan: PLAN_DOCUMENT });
  });

  it("returns unavailable for a failed terminal state (no result reflux, no guessing)", async () => {
    const client = scriptedClient([taskSnapshot({ state: "failed" })]);
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
  });

  it("returns unavailable for a cancelled terminal state", async () => {
    const client = scriptedClient([taskSnapshot({ state: "cancelled" })]);
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
  });

  it("returns unavailable when the accepted receipt shape is untrustworthy", async () => {
    let taskQueries = 0;
    const client = fakeClient({
      invoke: async (request) => {
        if (request.method === "project.import-copy") {
          return { ok: true, value: { taskId: "task-1" } as DesktopGatewaySuccessValueV1 };
        }
        taskQueries += 1;
        return { ok: true, value: taskSnapshot() };
      },
    });
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
    expect(taskQueries).toBe(0);
  });

  it("returns unavailable when a succeeded snapshot carries no result", async () => {
    const client = scriptedClient([taskSnapshot({ state: "succeeded" })]);
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
  });

  it("returns unavailable when the snapshot contractVersion is missing or foreign", async () => {
    // 快照必需键 contractVersion 缺失/异版 = 不可信快照(形态不齐路径;
    // 集成 #22 验收 L 级观察随手批回归钉死)
    const missing = taskSnapshot({
      contractVersion: undefined,
      state: "succeeded",
      result: donePayload(PLAN_DOCUMENT),
    });
    unavailable(await createLiveProjectOps(scriptedClient([missing])).importCopy(PLAN_PARAMS));
    const foreign = taskSnapshot({
      contractVersion: "9.9",
      state: "succeeded",
      result: donePayload(PLAN_DOCUMENT),
    });
    unavailable(await createLiveProjectOps(scriptedClient([foreign])).importCopy(PLAN_PARAMS));
  });

  it("returns unavailable when the result document is missing required fields", async () => {
    const client = scriptedClient([
      taskSnapshot({
        state: "succeeded",
        result: donePayload({ kind: "plan", sourcePath: "C:/projects/source" }),
      }),
    ]);
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
  });

  it("returns unavailable when the wait bound lapses without a terminal state", async () => {
    const client = scriptedClient([taskSnapshot({ state: "running" })]);
    const port = createLiveProjectOps(client, { taskWaitMs: 20 });
    unavailable(await port.importCopy(PLAN_PARAMS));
  });

  it("returns unavailable when the command itself is rejected by the application", async () => {
    const client = fakeClient({
      invoke: async () => ({
        ok: false,
        error: {
          kind: "application",
          error: {
            contractVersion: "0.1",
            code: "vua.project.store_failed",
            category: "internal",
            messageKey: "errors.project.storeFailed",
            recoverable: false,
            retryable: false,
            correlationId: "corr-1",
          },
        },
      }),
    });
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
  });

  it("returns unavailable when the first authoritative fetch fails (disconnected)", async () => {
    let importCalls = 0;
    const client = fakeClient({
      invoke: async (request) => {
        if (request.method === "project.import-copy") {
          importCalls += 1;
          return { ok: true, value: acceptedValue() };
        }
        return { ok: false, error: { kind: "unavailable" } };
      },
    });
    const port = createLiveProjectOps(client);
    unavailable(await port.importCopy(PLAN_PARAMS));
    expect(importCalls).toBe(1);
  });

  it("keeps setNote on the acceptance-receipt face (D-6: read-face confirms the write)", async () => {
    const client = fakeClient({
      invoke: async (request) => {
        expect(request.method).toBe("project.setNote");
        return { ok: true, value: acceptedValue() };
      },
    });
    const port = createLiveProjectOps(client);
    const outcome = await port.setNote({ projectPath: "C:/projects/copy", note: "hi" });
    expect(outcome).toEqual({ ok: true, accepted: { taskId: "task-1", correlationId: "corr-1" } });
  });
});
