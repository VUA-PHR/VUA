import { describe, expect, it, vi } from "vitest";
import { MockOrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { routeDesktopGatewayInvoke, type DesktopGatewayRouteContext } from "./gateway-router.js";

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

describe("bdl-queries v0.2 routing", () => {
  it("routes the five read-only queries through to the provider verbatim", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const listResponse = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.2", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-catalog-list",
        method: "catalog.list",
        params: { text: "uniform", availabilityStatus: "available", limit: 20, offset: 0 },
      },
    );

    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-catalog-list",
      correlationId: "desktop-catalog-list",
      kind: "query",
      method: "catalog.list",
      params: { text: "uniform", availabilityStatus: "available", limit: 20, offset: 0 },
    });
    expect(listResponse).toMatchObject({
      ok: true,
      value: { total: 0, entries: [] },
    });

    const statusResponse = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.2", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      { schemaVersion: 1, requestId: "desktop-catalog-status", method: "catalog.status", params: {} },
    );
    expect(statusResponse).toMatchObject({
      ok: true,
      value: { health: "unknown", revision: { catalogUpdatedSeq: null, datasetRevision: "0.1" } },
    });

    const detailResponse = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.2", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-catalog-detail",
        method: "catalog.detail",
        params: { productId: "booth:404" },
      },
    );
    expect(detailResponse).toMatchObject({
      ok: false,
      error: { code: "application", application: { code: "vua.catalog.product_not_found" } },
    });

    const entryResponse = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.2", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-entry-detail",
        method: "warehouse.entryDetail",
        params: { warehouseItemId: "wh-1" },
      },
    );
    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-entry-detail",
      correlationId: "desktop-entry-detail",
      kind: "query",
      method: "warehouse.entryDetail",
      params: { warehouseItemId: "wh-1" },
    });
    expect(entryResponse).toMatchObject({
      ok: false,
      // mock-provider 对齐(核心复核 2026-09-08):真实 provider(10325cd)对
      // entryDetail 未命中回既有冻结码 entry_not_found,非旧 not_found 字面量
      error: { code: "application", application: { code: "vua.warehouse.entry_not_found" } },
    });
  });

  it("rejects entity filters at the envelope before the provider is invoked", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const response = await routeDesktopGatewayInvoke(
      { provider, productVersion: "0.4.2", platform: "win32", rendererUrl },
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-entity-filter",
        method: "catalog.list",
        params: { entityType: "avatar" },
      },
    );

    expect(response).toMatchObject({ ok: false, error: { code: "invalid_request" } });
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("amf-production v0.2 routing", () => {
  const quad = {
    sourceFolder: "C:/materials/source",
    projectRoot: "C:/projects/target",
    artifactOutputRoot: "C:/artifacts",
    projectId: "vua-m3-synthetic-avatar",
  };

  function productionContext(provider: DesktopGatewayRouteContext["provider"]): DesktopGatewayRouteContext {
    return {
      provider,
      productVersion: "0.6.0",
      platform: "win32",
      rendererUrl,
      resolveMaterialSource: (refId) => (refId === "mat-1" ? quad : undefined),
    };
  }

  it("translates startInspection into the one-time production context handover", async () => {
    const provider = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "production.useCase", availability: "available" }],
    });
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const response = await routeDesktopGatewayInvoke(
      productionContext(provider),
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-start-1",
        method: "production.startInspection",
        params: { materialRefId: "mat-1", commandId: "command-1" },
      },
    );

    expect(response.ok).toBe(true);
    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({
      kind: "command",
      method: "production.startInspection",
      commandId: "command-1",
      // 四元组随应用请求一次性转交;渲染层只有 refId
      params: quad,
    }));

    const unknown = await routeDesktopGatewayInvoke(
      productionContext(provider),
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-start-2",
        method: "production.startInspection",
        params: { materialRefId: "mat-missing", commandId: "command-2" },
      },
    );
    expect(unknown).toMatchObject({
      ok: false,
      error: { code: "application", application: { code: "vua.material.source_unknown" } },
    });
  });

  it("passes requestPlan mode and confirmPlan risk decision through verbatim", async () => {
    const provider = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "production.useCase", availability: "available" }],
    });
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    await routeDesktopGatewayInvoke(
      productionContext(provider),
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-plan-1",
        method: "production.requestPlan",
        params: {
          inspectionId: "insp-0123456789abcdef",
          commandId: "command-plan",
          mode: "local_reusable_vpm",
        },
      },
    );
    expect(invoke).toHaveBeenLastCalledWith(expect.objectContaining({
      method: "production.requestPlan",
      params: { inspectionId: "insp-0123456789abcdef", mode: "local_reusable_vpm" },
    }));

    await routeDesktopGatewayInvoke(
      productionContext(provider),
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-confirm-1",
        method: "production.confirmPlan",
        params: {
          planId: "plan-0123456789abcdef",
          commandId: "command-confirm",
          observedRevision: 3,
          riskChoice: "snapshot_and_continue",
          rememberForSession: true,
        },
      },
    );
    expect(invoke).toHaveBeenLastCalledWith(expect.objectContaining({
      method: "production.confirmPlan",
      params: {
        planId: "plan-0123456789abcdef",
        observedRevision: 3,
        riskChoice: "snapshot_and_continue",
        rememberForSession: true,
      },
    }));
  });

  it("generates the recover decisionId in the Kernel and never accepts renderer paths", async () => {
    const provider = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "production.useCase", availability: "available" }],
    });
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke");

    const response = await routeDesktopGatewayInvoke(
      productionContext(provider),
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-recover-1",
        method: "production.recover",
        params: {
          taskId: "task-failed-1",
          decision: "rollback",
          commandId: "command-recover",
        },
      },
    );

    // 本测试只锁 Kernel 翻译(任务不存在时 mock 的应用错误与本翻译无关)
    const application = invoke.mock.calls.at(-1)?.[0] as {
      method: string;
      params: { decisionId: string; taskId: string; decision: string };
    };
    expect(application.method).toBe("production.recover");
    expect(application.params.taskId).toBe("task-failed-1");
    expect(application.params.decision).toBe("rollback");
    // 用户决定 ID 是 Kernel 侧授权事实:受理时生成并绑定,渲染层不可见
    expect(application.params.decisionId).toMatch(/^udid-/);
    expect(response.ok).toBe(false);

    // 信封守卫:v0.2 recover 面不再接受渲染层携带路径/风险选择等权威字段
    const stale = await routeDesktopGatewayInvoke(
      productionContext(provider),
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-recover-2",
        method: "production.recover",
        params: {
          taskId: "task-failed-1",
          decision: "rollback",
          commandId: "command-recover-2",
          sourceFolder: "C:/renderer-supplied",
        },
      },
    );
    expect(stale).toMatchObject({ ok: false, error: { code: "invalid_request" } });
  });
});

describe("bdl-commands v0.1 command routing", () => {
  it("routes the three warehouse write commands with commandId mapping", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    // provider-host 路由由核心登记(proposal 005);本测试锁映射与透传,
    // 不依赖 provider 对写命令的真实处置
    const invoke = vi.spyOn(provider, "invoke").mockResolvedValue({
      ok: true,
      value: { warehouseItemId: "wh-1", effectiveMode: "use_original_unitypackage" },
    });
    const context = { provider, productVersion: "0.4.2", platform: "win32" as const, rendererUrl };

    const modeResponse = await routeDesktopGatewayInvoke(
      context,
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-wh-mode",
        method: "warehouse.setArtifactMode",
        params: { warehouseItemId: "wh-1", mode: null, commandId: "cmd-1" },
      },
    );
    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-wh-mode",
      correlationId: "desktop-wh-mode",
      kind: "command",
      method: "warehouse.setArtifactMode",
      commandId: "cmd-1",
      params: { warehouseItemId: "wh-1", mode: null },
    });
    expect(modeResponse).toMatchObject({
      ok: true,
      value: { warehouseItemId: "wh-1", effectiveMode: "use_original_unitypackage" },
    });

    await routeDesktopGatewayInvoke(
      context,
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-wh-vpm",
        method: "warehouse.generateVpm",
        params: { warehouseItemId: "wh-1", commandId: "cmd-2" },
      },
    );
    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-wh-vpm",
      correlationId: "desktop-wh-vpm",
      kind: "command",
      method: "warehouse.generateVpm",
      commandId: "cmd-2",
      params: { warehouseItemId: "wh-1" },
    });

    await routeDesktopGatewayInvoke(
      context,
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-wh-del",
        method: "warehouse.deleteOriginals",
        params: { warehouseItemId: "wh-1", commandId: "cmd-3" },
      },
    );
    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-wh-del",
      correlationId: "desktop-wh-del",
      kind: "command",
      method: "warehouse.deleteOriginals",
      commandId: "cmd-3",
      params: { warehouseItemId: "wh-1" },
    });
  });

  it("routes the v0.4 download-adoption command with identity-only params", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke").mockResolvedValue({
      ok: true,
      value: { taskId: "task-1", correlationId: "corr-1" },
    });
    const context = { provider, productVersion: "0.4.2", platform: "win32" as const, rendererUrl };

    const response = await routeDesktopGatewayInvoke(
      context,
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-wh-downloads",
        method: "warehouse.importDownloads",
        params: { downloadIds: ["dl-1", "dl-2"], commandId: "cmd-dl-1" },
      },
    );
    // 仅身份透传(路径/大小/文件名是服务端事实,永不经渲染层)
    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-wh-downloads",
      correlationId: "desktop-wh-downloads",
      kind: "command",
      method: "warehouse.importDownloads",
      commandId: "cmd-dl-1",
      params: { downloadIds: ["dl-1", "dl-2"] },
    });
    expect(response).toMatchObject({ ok: true, value: { taskId: "task-1", correlationId: "corr-1" } });
  });

  it("routes the v0.4 completed-downloads read query verbatim", async () => {
    const provider = new MockOrchestratorProviderV01();
    await provider.start();
    const invoke = vi.spyOn(provider, "invoke").mockResolvedValue({
      ok: true,
      value: { downloads: [] },
    });
    const context = { provider, productVersion: "0.4.2", platform: "win32" as const, rendererUrl };

    const response = await routeDesktopGatewayInvoke(
      context,
      `${rendererUrl}/`,
      {
        schemaVersion: 1,
        requestId: "desktop-dl-list",
        method: "downloads.listCompleted",
        params: {},
      },
    );
    expect(invoke).toHaveBeenCalledWith({
      contractVersion: "0.1",
      requestId: "desktop-dl-list",
      correlationId: "desktop-dl-list",
      kind: "query",
      method: "downloads.listCompleted",
      params: {},
    });
    expect(response).toMatchObject({ ok: true, value: { downloads: [] } });
  });
});
