export const DESKTOP_GATEWAY_VERSION = 1 as const;
export const DESKTOP_GATEWAY_MAX_REQUEST_BYTES = 64 * 1024;

export interface AppSnapshotV1 {
  readonly schemaVersion: 1;
  readonly productVersion: string;
  readonly runtime: "electron";
  readonly platform: "win32" | "darwin" | "linux";
  readonly capabilities: {
    readonly gateway: true;
    readonly tasks: boolean;
    readonly remoteBrowser: boolean;
  };
}

export interface AppSnapshotRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "app.snapshot";
  readonly params: Record<string, never>;
}

export type DesktopGatewayRequestV1 = AppSnapshotRequestV1;

export type DesktopGatewayResponseV1 =
  | {
      readonly schemaVersion: 1;
      readonly requestId: string;
      readonly ok: true;
      readonly value: AppSnapshotV1;
    }
  | {
      readonly schemaVersion: 1;
      readonly requestId: string;
      readonly ok: false;
      readonly error: {
        readonly code: "invalid_request" | "unsupported_method" | "internal";
        readonly messageKey: string;
      };
    };

export interface DesktopGatewayApiV1 {
  readonly version: 1;
  invoke(request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1>;
}

export interface DesktopWindowApiV1 {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
}

export interface VuaDesktopApiV1 {
  readonly gateway: DesktopGatewayApiV1;
  readonly window: DesktopWindowApiV1;
}

export function isDesktopGatewayRequestV1(value: unknown): value is DesktopGatewayRequestV1 {
  if (value === null || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  if (request.schemaVersion !== DESKTOP_GATEWAY_VERSION) return false;
  if (request.method !== "app.snapshot") return false;
  if (typeof request.requestId !== "string" || request.requestId.length < 1 || request.requestId.length > 128) {
    return false;
  }
  if (request.params === null || typeof request.params !== "object" || Array.isArray(request.params)) {
    return false;
  }
  return Object.keys(request.params).length === 0;
}

export function requestByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
