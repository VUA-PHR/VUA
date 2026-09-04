import { describe, expect, it, vi } from "vitest";
import { APPLICATION_CONTRACT_VERSION, type ApplicationEventV01 } from "@vua/contracts";
import { createElectronGateway } from "./electron-gateway.js";
import { createGatewayClient, type DesktopGatewayHost } from "./gateway-client.js";
import type { TaskCenterView } from "./task-port.js";

function taskSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    taskId: "demo-1",
    revision: 1,
    correlationId: "correlation-1",
    state: "queued",
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-04T00:00:00.000Z",
    ...overrides,
  };
}

interface InvokeCall {
  readonly method: string;
  readonly params: Record<string, unknown>;
}

function stubHost(responses: (call: InvokeCall) => unknown): {
  host: DesktopGatewayHost;
  calls: InvokeCall[];
  emit: (event: ApplicationEventV01) => void;
} {
  const calls: InvokeCall[] = [];
  const listeners = new Set<(event: ApplicationEventV01) => void>();
  const host: DesktopGatewayHost = {
    gateway: {
      invoke: vi.fn(async (request) => {
        const typed = request as InvokeCall & { schemaVersion: number };
        calls.push({ method: typed.method, params: typed.params });
        return responses(calls[calls.length - 1]!);
      }),
    },
    events: {
      subscribe: vi.fn((listener: (event: ApplicationEventV01) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
    },
  };
  return { host, calls, emit: (event) => listeners.forEach((listener) => listener(event)) };
}

const ok = (value: unknown) => ({ ok: true as const, value });
// Kernel 信封:Provider 应用错误以 code=application 包装透传(见 gateway-router)
const appError = (code: string) => ({
  ok: false as const,
  error: {
    code: "application" as const,
    application: {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      code,
      category: "validation" as const,
      messageKey: "errors.test",
      recoverable: false,
      retryable: false,
      correlationId: "correlation-1",
    },
  },
});

describe("live Electron Gateway (F2)", () => {
  it("serves the task center from task.list and projects contract values", async () => {
    const { host } = stubHost(() => ok({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 2,
      tasks: [taskSnapshot()],
    }));
    const gateway = createElectronGateway(host, null);

    const view = await gateway.task.snapshot();
    expect(view.tasks).toEqual([
      expect.objectContaining({ id: "demo-1", status: "queued", cancellable: true }),
    ]);
    expect(gateway.dataSource()).toBe("live");
  });

  it("refreshes the view after task events and stops on unsubscribe", async () => {
    const { host, emit } = stubHost(() => ok({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 2,
      tasks: [],
    }));
    const gateway = createElectronGateway(host, null);
    const views: TaskCenterView[] = [];
    const unsubscribe = gateway.task.subscribe((view) => views.push(view));

    emit({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      eventId: "event-1",
      taskId: "demo-1",
      revision: 2,
      occurredAt: "2026-09-04T00:00:01.000Z",
      correlationId: "correlation-1",
      kind: "task.stateChanged",
      state: "running",
      payload: {},
    });
    await vi.waitFor(() => expect(views).toHaveLength(1));

    unsubscribe();
    emit({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      eventId: "event-2",
      taskId: "demo-1",
      revision: 3,
      occurredAt: "2026-09-04T00:00:02.000Z",
      correlationId: "correlation-1",
      kind: "task.stateChanged",
      state: "succeeded",
      payload: {},
    });
    expect(views).toHaveLength(1);
  });

  it("distinguishes unknown tasks from provider outages when cancelling", async () => {
    const notFound = stubHost(() => appError("vua.task.not_found"));
    const gatewayNotFound = createElectronGateway(notFound.host, null);
    const rejected = await gatewayNotFound.task.cancel("missing");
    expect(rejected).toMatchObject({ kind: "rejected", reason: "unknown_task" });

    const outage = stubHost(() => ({ ok: false, error: { code: "internal", messageKey: "errors.gateway.providerUnavailable" } }));
    const gatewayOutage = createElectronGateway(outage.host, null);
    const unavailable = await gatewayOutage.task.cancel("demo-1");
    expect(unavailable).toMatchObject({ kind: "rejected", reason: "unavailable" });
  });

  it("throws on the first frame when the provider is unreachable so the shell shows an honest failure", async () => {
    const outage = stubHost(() => ({ ok: false, error: { code: "internal", messageKey: "errors.gateway.providerUnavailable" } }));
    const gateway = createElectronGateway(outage.host, null);
    await expect(gateway.task.snapshot()).rejects.toThrow("task_list_unavailable");
    await expect(gateway.environment.snapshot()).rejects.toThrow("environment_snapshot_unavailable");
  });

  it("projects the environment snapshot and derives the module capability", async () => {
    const { host } = stubHost((call) =>
      call.method === "environment.getSnapshot"
        ? ok({
            contractVersion: APPLICATION_CONTRACT_VERSION,
            revision: 1,
            capturedAt: "2026-09-04T01:00:00.000Z",
            items: [
              { checkId: "steam", zone: "play", presence: "detected", facts: {} },
            ],
          })
        : ok({
            contractVersion: APPLICATION_CONTRACT_VERSION,
            revision: 1,
            capabilities: { revision: 1, operations: [] },
          }),
    );
    const gateway = createElectronGateway(host, null);

    const view = await gateway.environment.snapshot();
    const play = view.deployer.zones.play;
    if (play.kind !== "results") throw new Error("expected a results phase");
    expect(play.items[0]).toMatchObject({ id: "steam", status: "ok" });
    await expect(gateway.environment.capability()).resolves.toEqual({ state: "ready" });
    await expect(gateway.environment.planFix("steam")).resolves.toEqual({ kind: "unavailable" });
    await expect(gateway.task.capability()).resolves.toEqual({ state: "unavailable", detailKey: "taskEngineMissing" });
  });

  it("falls back to the honest not-run ports outside the Electron host", async () => {
    const gateway = createElectronGateway(undefined, null);
    await expect(gateway.task.snapshot()).rejects.toThrow("task_list_unavailable");
    expect(await gateway.environment.planFix("steam")).toEqual({ kind: "unavailable" });
  });
});
