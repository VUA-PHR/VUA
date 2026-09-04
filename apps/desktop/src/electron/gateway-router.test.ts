import { describe, expect, it, vi } from "vitest";
import { MockOrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { routeDesktopGatewayInvoke } from "./gateway-router.js";

const rendererUrl = "http://127.0.0.1:5173";

function request(): unknown {
  return {
    schemaVersion: 1,
    requestId: "desktop-request-1",
    method: "app.snapshot",
    params: {},
  };
}

describe("Electron Desktop Gateway routing", () => {
  it("rejects an invalid envelope before invoking the Provider", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { ...request() as object, method: "shell.execute" },
    );

    expect(response).toMatchObject({ ok: false, error: { code: "invalid_request" } });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("retains the local-origin boundary", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();

    await expect(routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      "https://booth.pm/",
      request(),
    )).rejects.toThrow("untrusted renderer origin");
  });

  it("routes app.snapshot through the Provider and derives honest capabilities", async () => {
    const provider = new MockOrchestratorProviderV01({
      capabilities: [
        { operationId: "task.list", availability: "available" },
        {
          operationId: "desktop.remoteBrowser",
          availability: "unavailable",
          reason: {
            contractVersion: "0.1",
            code: "vua.desktop.remote_browser_unavailable",
            category: "unavailable",
            messageKey: "errors.desktop.remoteBrowserUnavailable",
            recoverable: true,
            retryable: false,
            correlationId: "capability-test",
          },
        },
      ],
    });
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      request(),
    );

    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-request-1",
      correlationId: "desktop-request-1",
      kind: "query",
      method: "application.getSnapshot",
      params: {},
    });
    expect(response).toMatchObject({
      ok: true,
      value: { capabilities: { gateway: true, tasks: true, remoteBrowser: false } },
    });
  });

  it("reports absent Provider capabilities as unavailable", async () => {
    const provider = new MockOrchestratorProviderV01({ capabilities: [] });
    await provider.start();

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      request(),
    );

    expect(response).toMatchObject({
      ok: true,
      value: { capabilities: { gateway: true, tasks: false, remoteBrowser: false } },
    });
  });

  it("routes task.list through the Provider and returns the application value verbatim", async () => {
    const provider = new MockOrchestratorProviderV01({ tasks: [{
      contractVersion: "0.1",
      taskId: "task-1",
      revision: 2,
      correlationId: "correlation-1",
      state: "running",
      cancellationRequested: false,
      recoveryDisposition: "none",
      updatedAt: "2026-09-04T00:00:00.000Z",
    }] });
    await provider.start();

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { schemaVersion: 1, requestId: "desktop-request-3", method: "task.list", params: {} },
    );

    expect(response.ok).toBe(true);
    if (response.ok && "tasks" in response.value) {
      expect(response.value.tasks).toHaveLength(1);
      expect(response.value.tasks[0]?.taskId).toBe("task-1");
    } else {
      throw new Error("expected a task list value");
    }
  });

  it("passes application errors through instead of masking them as internal", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { schemaVersion: 1, requestId: "desktop-request-4", method: "task.get", params: { taskId: "missing" } },
    );

    expect(response.ok).toBe(false);
    if (!response.ok && response.error.code === "application") {
      expect(response.error.application.code).toBe("vua.task.not_found");
      expect(response.error.application.messageKey).toBe("errors.task.notFound");
    } else {
      throw new Error("expected an application error");
    }
  });

  it("routes the demo task command end to end with capability gating", async () => {
    const gated = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "demo.task", availability: "available" }],
    });
    await gated.start();

    const started = await routeDesktopGatewayInvoke(
      { provider: gated, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { schemaVersion: 1, requestId: "desktop-request-5", method: "task.startDemo", params: { commandId: "demo-1" } },
    );
    expect(started.ok).toBe(true);
    if (started.ok && "task" in started.value) {
      expect(started.value.task.state).toBe("queued");
    } else {
      throw new Error("expected a demo task");
    }

    const cancelled = await routeDesktopGatewayInvoke(
      { provider: gated, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-request-6",
        method: "task.requestCancellation",
        params: { taskId: "demo-1", commandId: "cancel-1" },
      },
    );
    expect(cancelled.ok).toBe(true);
    if (cancelled.ok && "outcome" in cancelled.value) {
      expect(cancelled.value.outcome).toBe("requested");
    } else {
      throw new Error("expected a cancellation result");
    }
  });

  it("routes environment.getSnapshot and returns the presence snapshot", async () => {
    const provider = new MockOrchestratorProviderV01({
      environment: {
        contractVersion: "0.1",
        revision: 1,
        capturedAt: "2026-09-04T00:00:00.000Z",
        items: [{
          checkId: "steam",
          zone: "play",
          presence: "not_detected",
          facts: {},
        }],
      },
    });
    await provider.start();

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { schemaVersion: 1, requestId: "desktop-request-7", method: "environment.getSnapshot", params: {} },
    );

    expect(response.ok).toBe(true);
    if (response.ok && "items" in response.value) {
      expect(response.value.items).toHaveLength(1);
      expect(response.value.items[0]?.presence).toBe("not_detected");
    } else {
      throw new Error("expected an environment snapshot");
    }
  });
});
