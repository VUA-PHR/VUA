import { describe, expect, it } from "vitest";
import {
  DESKTOP_GATEWAY_MAX_REQUEST_BYTES,
  isDesktopGatewayRequestV1,
  requestByteLength,
} from "./desktop-gateway.js";

describe("desktop Gateway v1", () => {
  it("accepts the single M1 query", () => {
    expect(
      isDesktopGatewayRequestV1({
        schemaVersion: 1,
        requestId: "request-1",
        method: "app.snapshot",
        params: {},
      }),
    ).toBe(true);
  });

  it("rejects unknown methods and oversized envelopes", () => {
    expect(
      isDesktopGatewayRequestV1({
        schemaVersion: 1,
        requestId: "request-2",
        method: "shell.execute",
        params: {},
      }),
    ).toBe(false);
    expect(requestByteLength({ payload: "x".repeat(DESKTOP_GATEWAY_MAX_REQUEST_BYTES) })).toBeGreaterThan(
      DESKTOP_GATEWAY_MAX_REQUEST_BYTES,
    );
  });

  it("accepts the F2 method table with per-method params", () => {
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-3", method: "task.list", params: {},
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-4", method: "task.get", params: { taskId: "task-1" },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1,
      requestId: "request-5",
      method: "task.requestCancellation",
      params: { taskId: "task-1", commandId: "cancel-1", observedRevision: 8 },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-6", method: "task.requestCancellation", params: { taskId: "task-1", commandId: "cancel-1" },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-7", method: "environment.getSnapshot", params: {},
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-8", method: "task.startDemo", params: { commandId: "demo-1" },
    })).toBe(true);
  });

  it("rejects F2 methods with missing, extra, or malformed params", () => {
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-9", method: "task.get", params: {},
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-10", method: "task.get", params: { taskId: "" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1,
      requestId: "request-11",
      method: "task.requestCancellation",
      params: { taskId: "task-1", commandId: "cancel-1", observedRevision: -1 },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-12", method: "task.startDemo", params: { commandId: "demo-1", force: true },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-13", method: "task.startDemo", params: {},
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-14", method: "environment.getSnapshot", params: { zone: "play" },
    })).toBe(false);
  });

  it("keeps the app.snapshot query untouched", () => {
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "request-15", method: "app.snapshot", params: { extra: 1 },
    })).toBe(false);
  });
});

describe("production.* v0.2 方法守卫", () => {
  const base = {
    schemaVersion: 1,
    requestId: "request-prod-1",
    kind: "command",
    method: "production.startInspection",
    params: { materialRefId: "mat-1", commandId: "command-1" },
  };
  const variants: Record<string, Record<string, unknown>> = {
    "production.getInspection": { inspectionId: "insp-0123456789abcdef" },
    "production.requestPlan": {
      inspectionId: "insp-0123456789abcdef",
      commandId: "command-2",
      mode: "direct_unity_package",
    },
    "production.getPlan": { planId: "plan-0123456789abcdef" },
    "production.confirmPlan": {
      planId: "plan-0123456789abcdef",
      commandId: "command-3",
      observedRevision: 8,
      riskChoice: "snapshot_and_continue",
    },
    "production.recover": { taskId: "task-1", decision: "rollback", commandId: "command-4" },
    "production.getBuildRecord": { buildRecordId: "record-1" },
  };

  it("accepts each production method with its exact params", () => {
    for (const [method, params] of Object.entries(variants)) {
      const request = {
        schemaVersion: 1,
        requestId: "request-prod",
        method,
        params,
      };
      expect(isDesktopGatewayRequestV1(request)).toBe(true);
    }
  });

  it("accepts the optional rememberForSession on confirmPlan", () => {
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1,
      requestId: "r",
      method: "production.confirmPlan",
      params: {
        planId: "plan-0123456789abcdef",
        commandId: "command-5",
        observedRevision: 8,
        riskChoice: "continue",
        rememberForSession: true,
      },
    })).toBe(true);
  });

  it("rejects malformed production params and unknown production methods", () => {
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.startInspection", params: {},
    })).toBe(false);
    // v0.2:observedRevision 必填、riskChoice 必填且在四枚举内
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.confirmPlan",
      params: { planId: "plan-0123456789abcdef", commandId: "c", riskChoice: "continue" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.confirmPlan",
      params: { planId: "plan-0123456789abcdef", commandId: "c", observedRevision: 8, riskChoice: "snapshot_first" },
    })).toBe(false);
    // v0.2:mode 必填且在双素材词表内
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.requestPlan",
      params: { inspectionId: "insp-0123456789abcdef", commandId: "c" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.requestPlan",
      params: { inspectionId: "insp-0123456789abcdef", commandId: "c", mode: "mystery_mode" },
    })).toBe(false);
    // v0.2:recover 瘦身为语义选择,渲染层携带的路径/决定 ID 一律拒绝
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.recover",
      params: { taskId: "t", decision: "continue" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.recover",
      params: { taskId: "t", decision: "sideways", commandId: "c" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.recover",
      params: { taskId: "t", decision: "rollback", commandId: "c", sourceFolder: "C:/x" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.unknown", params: {},
    })).toBe(false);
  });
});

describe("bdl-queries v0.2 gateway surface", () => {
  const base = { schemaVersion: 1, requestId: "r" } as const;

  it("accepts the five read-only queries within the frozen closed sets", () => {
    expect(isDesktopGatewayRequestV1({ ...base, method: "catalog.list", params: {} })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base,
      method: "catalog.list",
      params: { text: "uniform", availabilityStatus: "available", limit: 50, offset: 0 },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base,
      method: "catalog.list",
      params: { text: null, availabilityStatus: null },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.detail", params: { productId: "booth:1000001" },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({ ...base, method: "catalog.status", params: {} })).toBe(true);
    expect(isDesktopGatewayRequestV1({ ...base, method: "warehouse.listEntries", params: {} })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.entryDetail", params: { warehouseItemId: "wh-1" },
    })).toBe(true);
  });

  it("rejects entity filters, bad enum values, out-of-range paging, and bad identities", () => {
    // 负例对齐 schemas/bdl-queries/v0.2/examples:实体过滤参数必被拒
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { entityType: "avatar" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { relationKind: "addon_for" },
    })).toBe(false);
    // 负例对齐:非稳定枚举的筛选值必被拒(原词透传不构成合法筛选项)
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { availabilityStatus: "InStock" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { limit: 0 },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { limit: 201 },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { offset: -1 },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.list", params: { text: "" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.detail", params: { productId: "product-1" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "catalog.status", params: { extra: 1 },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.entryDetail", params: {},
    })).toBe(false);
  });
});

describe("bdl-commands v0.1 gateway surface", () => {
  const base = { schemaVersion: 1, requestId: "r" } as const;

  it("accepts the three warehouse write commands with commandId and closed mode sets", () => {
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "generate_vpm", commandId: "cmd-1" },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: null, commandId: "cmd-2" },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1", commandId: "cmd-3" },
    })).toBe(true);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.deleteOriginals",
      params: { warehouseItemId: "wh-entry-1", commandId: "cmd-4" },
    })).toBe(true);
  });

  it("rejects mode vocabulary escapes and missing command ids", () => {
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "unknown_mode", commandId: "cmd-5" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      ...base, method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(false);
  });
});
