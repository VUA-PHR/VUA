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
});

  it("answers not-yet-routed F2 methods with unsupported_method instead of a fake snapshot", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.1", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { schemaVersion: 1, requestId: "desktop-request-2", method: "task.list", params: {} },
    );

    expect(response).toMatchObject({ ok: false, error: { code: "unsupported_method" } });
    expect(invoke).not.toHaveBeenCalled();
  });
