/**
 * release.openForInspection live 端口测试(U19 独立检视入口;核心 v0.2 冻结
 * 形状对齐——第 156 批,照 release-handoff-port-live.test.ts 先例):以假
 * GatewayClient 驱动事实:
 * - ok 受理回执(v0.2 形状)→ accepted(taskId/correlationId 原样);
 * - v0.1 版本戳回执 → failed(族 0.1→0.2 单源推进,历史钉);
 * - 携交接操作词面的受理回执 → failed(operation 钉检视词面);
 * - vua.release_handoff.unavailable → absent 诚实缺席(不伪造受理);
 * - 检视闭集应用错误(build_unknown/editor_unresolved)→ failed 携原码透传;
 * - 信封级 unavailable/request_rejected → absent / failed(code=null);
 * - task.get 快照投影:succeeded 携六键检视事实 → succeeded(事实透传);
 *   携交接词面/上传状态字段的事实 → fact-unexplainable(守卫负例);
 *   failed/cancelled/running/读取失败各臂如实。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import { createGatewayClient, type DesktopGatewayHost, type GatewayClient } from "../../gateway/gateway-client.ts";
import { createLiveReleaseProjectOpenPort } from "./release-project-open-port-live.ts";

interface ScriptedResponse {
  readonly value?: DesktopGatewaySuccessValueV1;
  readonly applicationError?: {
    readonly code: string;
    /** 防御性收窄测试通道:非标量值混入由端口滤除 */
    readonly params?: Record<string, unknown>;
  };
  /** 信封级拒绝(Kernel 层,无应用码) */
  readonly envelopeError?: "invalid_request" | "unsupported_method";
  readonly reject?: boolean;
}

function makeHost(script: Partial<Record<string, ScriptedResponse[]>>): {
  host: DesktopGatewayHost;
  requests: DesktopGatewayRequestV1[];
} {
  const requests: DesktopGatewayRequestV1[] = [];
  const remaining = new Map<string, ScriptedResponse[]>(
    Object.entries(script).map(([method, responses]) => [method, [...(responses ?? [])]]),
  );
  return {
    requests,
    host: {
      gateway: {
        async invoke(request) {
          requests.push(request as DesktopGatewayRequestV1);
          const queue = remaining.get((request as DesktopGatewayRequestV1).method);
          const next = queue?.shift();
          if (next === undefined) {
            return { schemaVersion: 1, requestId: "x", ok: false, error: { code: "internal", messageKey: "errors.gateway.providerUnavailable" } };
          }
          if (next.reject === true) throw new Error("bridge down");
          if (next.envelopeError !== undefined) {
            return {
              schemaVersion: 1,
              requestId: "x",
              ok: false,
              error: { code: next.envelopeError, messageKey: "errors.gateway.unsupportedMethod" },
            };
          }
          if (next.applicationError !== undefined) {
            return {
              schemaVersion: 1,
              requestId: "x",
              ok: false,
              error: {
                code: "application",
                application: {
                  contractVersion: "0.1",
                  code: next.applicationError.code,
                  category: "unavailable",
                  messageKey: "errors.releaseHandoff.unavailable",
                  params: next.applicationError.params,
                  recoverable: true,
                  retryable: false,
                  correlationId: "c",
                },
              },
            };
          }
          return { schemaVersion: 1, requestId: "x", ok: true, value: next.value! };
        },
      },
      events: {
        subscribe() {
          return () => {};
        },
      },
    },
  };
}

function clientOf(host: DesktopGatewayHost): GatewayClient {
  return createGatewayClient(host);
}

const ACCEPTED = {
  schemaVersion: "0.2",
  operation: "release.openForInspection",
  taskId: "task-2",
  correlationId: "corr-2",
};

const INSPECTION_FACT = {
  schemaVersion: "0.2",
  operation: "release.openForInspection",
  buildId: "build-1",
  projectId: "proj-1",
  editor: { exePath: "C:/Unity/Unity.exe", version: "2022.3.22f1" },
  occurredAt: "2026-09-22T00:30:00Z",
};

function taskSnapshot(state: string, extra: Record<string, unknown> = {}): DesktopGatewaySuccessValueV1 {
  return {
    contractVersion: "0.1",
    taskId: "task-2",
    revision: 1,
    correlationId: "corr-2",
    state,
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-22T00:30:00Z",
    ...extra,
  } as unknown as DesktopGatewaySuccessValueV1;
}

describe("release-project-open live port: openForInspection", () => {
  test("v0.2 受理回执 → accepted,请求 params 恰单键 buildId", async () => {
    const { host, requests } = makeHost({ "release.openForInspection": [{ value: ACCEPTED }] });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const intent = await port.openForInspection("build-1");
    assert.deepEqual(intent, { kind: "accepted", taskId: "task-2", correlationId: "corr-2" });
    const request = requests[0] as Extract<
      DesktopGatewayRequestV1,
      { method: "release.openForInspection" }
    >;
    assert.equal(request.method, "release.openForInspection");
    assert.deepEqual(request.params, { buildId: "build-1" });
  });

  test("v0.1 版本戳受理回执 → failed(族单源推进,wire 只说 0.2;历史钉)", async () => {
    const { host } = makeHost({
      "release.openForInspection": [
        {
          value: {
            schemaVersion: "0.1",
            operation: "release.openForInspection",
            taskId: "task-2",
            correlationId: "corr-2",
          } as unknown as DesktopGatewaySuccessValueV1,
        },
      ],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const intent = await port.openForInspection("build-1");
    assert.deepEqual(intent, { kind: "failed", code: null, params: {} });
  });

  test("携交接操作词面的受理回执 → failed(operation 词面钉检视操作)", async () => {
    const { host } = makeHost({
      "release.openForInspection": [
        {
          value: {
            ...ACCEPTED,
            operation: "release.openForHandoff",
          } as unknown as DesktopGatewaySuccessValueV1,
        },
      ],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const intent = await port.openForInspection("build-1");
    assert.deepEqual(intent, { kind: "failed", code: null, params: {} });
  });

  test("vua.release_handoff.unavailable → absent 诚实缺席(不伪造受理)", async () => {
    const { host } = makeHost({
      "release.openForInspection": [{ applicationError: { code: "vua.release_handoff.unavailable" } }],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const intent = await port.openForInspection("build-1");
    assert.deepEqual(intent, { kind: "absent" });
  });

  test("检视闭集应用错误(build_unknown/editor_unresolved)→ failed 携原码透传", async () => {
    const { host } = makeHost({
      "release.openForInspection": [
        { applicationError: { code: "vua.release_handoff.build_unknown" } },
        { applicationError: { code: "vua.release_handoff.editor_unresolved" } },
      ],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    assert.deepEqual(await port.openForInspection("build-1"), {
      kind: "failed",
      code: "vua.release_handoff.build_unknown",
      params: {},
    });
    assert.deepEqual(await port.openForInspection("build-1"), {
      kind: "failed",
      code: "vua.release_handoff.editor_unresolved",
      params: {},
    });
  });

  test("宿主不可达(信封级 unavailable) → absent;信封级拒绝 → failed code=null", async () => {
    const { host } = makeHost({
      "release.openForInspection": [{ reject: true }, { envelopeError: "unsupported_method" }],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    assert.deepEqual(await port.openForInspection("build-1"), { kind: "absent" });
    assert.deepEqual(await port.openForInspection("build-1"), { kind: "failed", code: null, params: {} });
  });

  test("受理回执形状不符(缺 correlationId) → failed(不可解释≠缺席)", async () => {
    const { host } = makeHost({
      "release.openForInspection": [
        {
          value: {
            schemaVersion: "0.2",
            operation: "release.openForInspection",
            taskId: "task-2",
          } as unknown as DesktopGatewaySuccessValueV1,
        },
      ],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const intent = await port.openForInspection("build-1");
    assert.deepEqual(intent, { kind: "failed", code: null, params: {} });
  });
});

describe("release-project-open live port: taskSnapshot", () => {
  test("running 快照 → running 视图携九态原词", async () => {
    const { host } = makeHost({ "task.get": [{ value: taskSnapshot("running") }] });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const view = await port.taskSnapshot("task-2");
    assert.deepEqual(view, { kind: "running", state: "running" });
  });

  test("succeeded 携六键检视事实 → succeeded 视图(事实透传,词面永不宣称交接)", async () => {
    const { host } = makeHost({
      "task.get": [{ value: taskSnapshot("succeeded", { result: INSPECTION_FACT }) }],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const view = await port.taskSnapshot("task-2");
    assert.deepEqual(view, { kind: "succeeded", fact: INSPECTION_FACT });
    // 六键闭集词面钉:事实自携 operation=检视操作词面,≠交接操作词面
    if (view.kind === "succeeded") {
      assert.equal(view.fact.operation, "release.openForInspection");
      assert.notEqual(view.fact.operation, "release.openForHandoff");
      assert.equal("uploadState" in view.fact, false);
    }
  });

  test("succeeded 携交接词面事实(检视词面负例) → fact-unexplainable", async () => {
    const handoffWorded = { ...INSPECTION_FACT, operation: "release.openForHandoff" };
    const { host } = makeHost({
      "task.get": [{ value: taskSnapshot("succeeded", { result: handoffWorded }) }],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const view = await port.taskSnapshot("task-2");
    assert.deepEqual(view, { kind: "fact-unexplainable" });
  });

  test("succeeded 携上传状态字段事实(诚实纪律负例) → fact-unexplainable", async () => {
    const polluted = { ...INSPECTION_FACT, uploadState: "done" };
    const { host } = makeHost({
      "task.get": [{ value: taskSnapshot("succeeded", { result: polluted }) }],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const view = await port.taskSnapshot("task-2");
    assert.deepEqual(view, { kind: "fact-unexplainable" });
  });

  test("succeeded 但事实缺失 → fact-unexplainable(不合成事实)", async () => {
    const { host } = makeHost({ "task.get": [{ value: taskSnapshot("succeeded") }] });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const view = await port.taskSnapshot("task-2");
    assert.deepEqual(view, { kind: "fact-unexplainable" });
  });

  test("failed 快照 → failed 视图携错误码与 messageKey", async () => {
    const { host } = makeHost({
      "task.get": [
        {
          value: taskSnapshot("failed", {
            error: {
              contractVersion: "0.1",
              code: "vua.task.handshake_timeout",
              category: "timeout",
              messageKey: "errors.task.handshakeTimeout",
              recoverable: true,
              retryable: true,
              correlationId: "corr-2",
            },
          }),
        },
      ],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    const view = await port.taskSnapshot("task-2");
    assert.deepEqual(view, {
      kind: "failed",
      state: "failed",
      errorCode: "vua.task.handshake_timeout",
      messageKey: "errors.task.handshakeTimeout",
    });
  });

  test("cancelled 快照 → cancelled 视图;读取失败 → null(保持上一视图)", async () => {
    const { host } = makeHost({
      "task.get": [{ value: taskSnapshot("cancelled") }, { applicationError: { code: "vua.task.not_found" } }],
    });
    const port = createLiveReleaseProjectOpenPort(clientOf(host));
    assert.deepEqual(await port.taskSnapshot("task-2"), { kind: "cancelled" });
    assert.equal(await port.taskSnapshot("task-2"), null);
  });
});
