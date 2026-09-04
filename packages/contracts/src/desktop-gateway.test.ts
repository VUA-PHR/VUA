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

describe("production.* v0.1 方法守卫", () => {
  const base = {
    schemaVersion: 1,
    requestId: "request-prod-1",
    kind: "command",
    method: "production.startInspection",
    params: { materialRefId: "mat-1", commandId: "command-1" },
  };
  const variants: Record<string, Record<string, unknown>> = {
    "production.getInspection": { inspectionId: "insp-1" },
    "production.requestPlan": { inspectionId: "insp-1", commandId: "command-2" },
    "production.getPlan": { planId: "plan-1" },
    "production.confirmPlan": { planId: "plan-1", commandId: "command-3", observedRevision: 8 },
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

  it("rejects malformed production params and unknown production methods", () => {
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.startInspection", params: {},
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.recover",
      params: { taskId: "t", decision: "continue" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.recover",
      params: { taskId: "t", decision: "sideways", commandId: "c" },
    })).toBe(false);
    expect(isDesktopGatewayRequestV1({
      schemaVersion: 1, requestId: "r", method: "production.unknown", params: {},
    })).toBe(false);
  });
});
