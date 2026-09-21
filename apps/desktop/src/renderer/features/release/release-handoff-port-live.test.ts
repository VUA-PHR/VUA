/**
 * release.openForHandoff live 端口测试(023 消费切片):以假 GatewayClient
 * 驱动事实:
 * - ok 受理回执 → accepted(taskId/correlationId 原样);
 * - vua.release_handoff.unavailable → absent 诚实缺席(不伪造受理);
 * - 其余闭集应用错误(build_unknown 等) → failed 携原码透传;
 * - U19 准入闸码 → failed 携原码＋params 防御性透传(state 原词;非标量滤除);
 * - 信封级 unavailable/request_rejected → absent / failed(code=null);
 * - 受理回执形状不符 → failed(响应不可解释≠缺席);
 * - task.get 快照 → projectHandoffTask 投影;读取失败 → null。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import { createGatewayClient, type DesktopGatewayHost, type GatewayClient } from "../../gateway/gateway-client.ts";
import { createLiveReleaseHandoffPort } from "./release-handoff-port-live.ts";

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
                  messageKey: "errors.release_handoff.unavailable",
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
  operation: "release.openForHandoff",
  taskId: "task-1",
  correlationId: "corr-1",
};

const HANDOFF_FACT = {
  schemaVersion: "0.2",
  buildId: "build-1",
  projectId: "proj-1",
  editor: { exePath: "C:/Unity/Unity.exe", version: "2022.3.22f1" },
  occurredAt: "2026-09-16T03:30:00Z",
};

function taskSnapshot(state: string, extra: Record<string, unknown> = {}): DesktopGatewaySuccessValueV1 {
  return {
    contractVersion: "0.1",
    taskId: "task-1",
    revision: 1,
    correlationId: "corr-1",
    state,
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-16T03:30:00Z",
    ...extra,
  } as unknown as DesktopGatewaySuccessValueV1;
}

describe("release-handoff live port: openForHandoff", () => {
  test("受理回执 → accepted,请求 params 恰单键 buildId", async () => {
    const { host, requests } = makeHost({ "release.openForHandoff": [{ value: ACCEPTED }] });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, { kind: "accepted", taskId: "task-1", correlationId: "corr-1" });
    const request = requests[0] as Extract<
      DesktopGatewayRequestV1,
      { method: "release.openForHandoff" }
    >;
    assert.equal(request.method, "release.openForHandoff");
    assert.deepEqual(request.params, { buildId: "build-1" });
  });

  test("vua.release_handoff.unavailable → absent 诚实缺席(不伪造受理)", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [{ applicationError: { code: "vua.release_handoff.unavailable" } }],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, { kind: "absent" });
  });

  test("闭集应用错误(build_unknown) → failed 携原码透传", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [{ applicationError: { code: "vua.release_handoff.build_unknown" } }],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, {
      kind: "failed",
      code: "vua.release_handoff.build_unknown",
      params: {},
    });
  });

  test("U19 准入闸 record_state_blocked → failed 携原码＋params(state 原词)", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [
        { applicationError: { code: "vua.release_handoff.record_state_blocked", params: { state: "failed" } } },
      ],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, {
      kind: "failed",
      code: "vua.release_handoff.record_state_blocked",
      params: { state: "failed" },
    });
  });

  test("params 形状防御:非标量值滤除,标量保留(词面插值消费安全)", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [
        {
          applicationError: {
            code: "vua.release_handoff.record_state_unknown",
            params: { state: "rolled_back", hostile: { nested: true } },
          },
        },
      ],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, {
      kind: "failed",
      code: "vua.release_handoff.record_state_unknown",
      params: { state: "rolled_back" },
    });
  });

  test("宿主不可达(信封级 unavailable) → absent", async () => {
    const { host } = makeHost({ "release.openForHandoff": [{ reject: true }] });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, { kind: "absent" });
  });

  test("信封级拒绝(request_rejected,无应用码) → failed code=null", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [{ envelopeError: "unsupported_method" }],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, { kind: "failed", code: null, params: {} });
  });

  test("受理回执形状不符(缺 correlationId) → failed(不可解释≠缺席)", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [
        {
          // 缺 correlationId 的形状不符回执(unknown 中转构造,测试专用)
          value: {
            schemaVersion: "0.2",
            operation: "release.openForHandoff",
            taskId: "task-1",
          } as unknown as DesktopGatewaySuccessValueV1,
        },
      ],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, { kind: "failed", code: null, params: {} });
  });

  test("v0.1 版本戳受理回执 → failed(族 0.1→0.2 单源推进,wire 只说 0.2;历史钉)", async () => {
    const { host } = makeHost({
      "release.openForHandoff": [
        {
          value: {
            schemaVersion: "0.1",
            operation: "release.openForHandoff",
            taskId: "task-1",
            correlationId: "corr-1",
          } as unknown as DesktopGatewaySuccessValueV1,
        },
      ],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const intent = await port.openForHandoff("build-1");
    assert.deepEqual(intent, { kind: "failed", code: null, params: {} });
  });
});

describe("release-handoff live port: taskSnapshot", () => {
  test("running 快照 → running 视图携九态原词", async () => {
    const { host } = makeHost({ "task.get": [{ value: taskSnapshot("preparing") }] });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const view = await port.taskSnapshot("task-1");
    assert.deepEqual(view, { kind: "running", state: "preparing" });
  });

  test("succeeded 快照携交接事实 → succeeded 视图(事实透传)", async () => {
    const { host } = makeHost({
      "task.get": [{ value: taskSnapshot("succeeded", { result: HANDOFF_FACT }) }],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const view = await port.taskSnapshot("task-1");
    assert.deepEqual(view, { kind: "succeeded", fact: HANDOFF_FACT });
  });

  test("succeeded 但事实携带词表外字段(上传状态) → fact-unexplainable(不猜测)", async () => {
    const polluted = { ...HANDOFF_FACT, uploadState: "done" };
    const { host } = makeHost({
      "task.get": [{ value: taskSnapshot("succeeded", { result: polluted }) }],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const view = await port.taskSnapshot("task-1");
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
              correlationId: "corr-1",
            },
          }),
        },
      ],
    });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const view = await port.taskSnapshot("task-1");
    assert.deepEqual(view, {
      kind: "failed",
      state: "failed",
      errorCode: "vua.task.handshake_timeout",
      messageKey: "errors.task.handshakeTimeout",
    });
  });

  test("cancelled 快照 → cancelled 视图", async () => {
    const { host } = makeHost({ "task.get": [{ value: taskSnapshot("cancelled") }] });
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const view = await port.taskSnapshot("task-1");
    assert.deepEqual(view, { kind: "cancelled" });
  });

  test("读取失败(信封错误) → null(调用方保持上一视图)", async () => {
    const { host } = makeHost({});
    const port = createLiveReleaseHandoffPort(clientOf(host));
    const view = await port.taskSnapshot("task-1");
    assert.equal(view, null);
  });
});
