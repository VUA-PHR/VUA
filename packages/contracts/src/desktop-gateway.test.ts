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
