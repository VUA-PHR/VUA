/**
 * Inspection live 端口测试(M7 消费批):以假 GatewayClient 驱动四类事实:
 * - ok 回执 → available 视图原样透传(list 摘要行/get 证据文档);
 * - vua.inspection.unavailable → not-connected 诚实缺席(不伪装空数据);
 * - vua.inspection.not_found(get) → missing 正常查询无果;
 * - 其它应用错误/传输失败 → reject(页面呈现失败＋重试);
 * - 响应形状不符(schemaVersion 缺失等) → reject,零字段猜测。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import { createGatewayClient, type DesktopGatewayHost, type GatewayClient } from "../../gateway/gateway-client.ts";
import { createLiveInspectionPort } from "./inspection-port-live.ts";

interface ScriptedResponse {
  readonly value?: DesktopGatewaySuccessValueV1;
  readonly applicationError?: { readonly code: string };
  readonly reject?: boolean;
}

/** 假宿主:按方法记录请求,按脚本逐次应答 */
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
                  messageKey: "errors.inspection.unavailable",
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

const INSP_ID = "01982b5a-3f10-7c4e-9d2a-4b8e1f6a7c21";

// 联合字面量在键面与既有成员(RecordListEntryV02 等)重叠时 TS 会窄到错误
// 成员——此处锁方法-响应对应事实,与运行时窄化守卫(三键组合)互补
const listResult = {
  contractVersion: "0.1",
  total: 1,
  entries: [
    {
      inspectionId: INSP_ID,
      avatarRef: { ref: "warehouse:booth-item-1001", label: "Synthetic Avatar A" },
      overallStatus: "fail",
      performedAt: "2026-09-13T00:20:00Z",
    },
  ],
  schemaVersion: "0.1",
} as unknown as DesktopGatewaySuccessValueV1;

const getResult = {
  contractVersion: "0.1",
  inspectionId: INSP_ID,
  inspectionDocument: {
    schemaVersion: "0.1",
    inspectionId: INSP_ID,
    avatarRef: { ref: "warehouse:booth-item-1001", label: null },
    performedAt: "2026-09-13T00:20:00Z",
    bridge: {
      editorVersion: "2022.3.22f1",
      bridgeSchemaVersion: 3,
      operations: [],
    },
    dimensions: [
      { kind: "functional", status: "unavailable", basis: "none", checks: [] },
    ],
    overallStatus: "warn",
  },
  schemaVersion: "0.1",
} as unknown as DesktopGatewaySuccessValueV1;

describe("inspection live 端口(M7 消费批)", () => {
  test("list ok → available 视图原样透传,查询词表为 inspection.list 且可选闭集参数", async () => {
    const { host, requests } = makeHost({
      "inspection.list": [{ value: listResult }],
    });
    const port = createLiveInspectionPort(clientOf(host));
    const view = await port.list({ avatarRef: "warehouse:booth-item-1001", limit: 50 });
    assert.equal(view.kind, "available");
    assert.ok(view.kind === "available");
    assert.equal(view.total, 1);
    assert.equal(view.entries[0]?.inspectionId, INSP_ID);
    assert.equal(requests[0]?.method, "inspection.list");
    assert.deepEqual(requests[0]?.params, { avatarRef: "warehouse:booth-item-1001", limit: 50 });
  });

  test("list unavailable → not-connected 诚实缺席,不以空列表伪装", async () => {
    const { host } = makeHost({
      "inspection.list": [{ applicationError: { code: "vua.inspection.unavailable" } }],
    });
    const port = createLiveInspectionPort(clientOf(host));
    const view = await port.list();
    assert.deepEqual(view, { schemaVersion: 1, kind: "not-connected" });
  });

  test("list 形状不符(缺 schemaVersion) → reject,零字段猜测", async () => {
    const { host } = makeHost({
      "inspection.list": [{
        value: {
          contractVersion: "0.1",
          total: 0,
          entries: [],
          // schemaVersion 故意缺失:非 inspection-queries v0.1 面
        } as unknown as DesktopGatewaySuccessValueV1,
      }],
    });
    const port = createLiveInspectionPort(clientOf(host));
    await assert.rejects(port.list(), /inspection_list_unavailable/);
  });

  test("get ok → available 视图携带文档本体;查询词表为 inspection.get 单身份参", async () => {
    const { host, requests } = makeHost({
      "inspection.get": [{ value: getResult }],
    });
    const port = createLiveInspectionPort(clientOf(host));
    const view = await port.get(INSP_ID);
    assert.equal(view.kind, "available");
    assert.ok(view.kind === "available");
    assert.equal(view.document.overallStatus, "warn");
    assert.equal(view.document.dimensions[0]?.status, "unavailable");
    assert.equal(requests[0]?.method, "inspection.get");
    assert.deepEqual(requests[0]?.params, { inspectionId: INSP_ID });
  });

  test("get not_found → missing 正常查询无果;unavailable → not-connected", async () => {
    const { host } = makeHost({
      "inspection.get": [
        { applicationError: { code: "vua.inspection.not_found" } },
        { applicationError: { code: "vua.inspection.unavailable" } },
      ],
    });
    const port = createLiveInspectionPort(clientOf(host));
    const missing = await port.get(INSP_ID);
    assert.deepEqual(missing, { schemaVersion: 1, kind: "missing" });
    const notConnected = await port.get(INSP_ID);
    assert.deepEqual(notConnected, { schemaVersion: 1, kind: "not-connected" });
  });

  test("传输失败与其它应用错误 → reject(页面呈现失败＋重试)", async () => {
    const { host } = makeHost({
      "inspection.get": [
        { reject: true },
        { applicationError: { code: "vua.inspection.store_failed" } },
      ],
    });
    const port = createLiveInspectionPort(clientOf(host));
    await assert.rejects(port.get(INSP_ID));
    await assert.rejects(port.get(INSP_ID), /inspection_get_unavailable/);
  });
});
