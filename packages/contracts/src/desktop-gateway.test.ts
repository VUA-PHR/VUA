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
});
