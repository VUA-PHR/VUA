import {
  APPLICATION_CONTRACT_VERSION,
  DESKTOP_GATEWAY_MAX_REQUEST_BYTES,
  DESKTOP_GATEWAY_VERSION,
  isDesktopGatewayRequestV1,
  requestByteLength,
  type ApplicationSnapshotV01,
  type DesktopGatewayResponseV1,
} from "@vua/contracts";
import type { OrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { isAllowedLocalSender } from "./security.js";

const TASK_LIST_CAPABILITY = "task.list";
const REMOTE_BROWSER_CAPABILITY = "desktop.remoteBrowser";

export interface DesktopGatewayRouteContext {
  readonly provider: OrchestratorProviderV01;
  readonly productVersion: string;
  readonly platform: "win32" | "darwin" | "linux";
  readonly rendererUrl: string | undefined;
}

function requestIdFrom(value: unknown): string {
  return value !== null
    && typeof value === "object"
    && typeof (value as { requestId?: unknown }).requestId === "string"
    ? (value as { requestId: string }).requestId
    : "invalid";
}

function failure(
  requestId: string,
  code: Extract<DesktopGatewayResponseV1, { ok: false }>["error"]["code"],
  messageKey: string,
): DesktopGatewayResponseV1 {
  return {
    schemaVersion: DESKTOP_GATEWAY_VERSION,
    requestId,
    ok: false,
    error: { code, messageKey },
  };
}

function isApplicationSnapshot(value: unknown): value is ApplicationSnapshotV01 {
  return value !== null
    && typeof value === "object"
    && "capabilities" in value
    && (value as { capabilities?: unknown }).capabilities !== null
    && typeof (value as { capabilities?: unknown }).capabilities === "object";
}

function capabilityAvailable(snapshot: ApplicationSnapshotV01, operationId: string): boolean {
  return snapshot.capabilities.operations.some(
    (operation) => operation.operationId === operationId && operation.availability === "available",
  );
}

export async function routeDesktopGatewayInvoke(
  context: DesktopGatewayRouteContext,
  senderUrl: string,
  request: unknown,
): Promise<DesktopGatewayResponseV1> {
  if (!isAllowedLocalSender(senderUrl, context.rendererUrl)) throw new Error("untrusted renderer origin");

  const requestId = requestIdFrom(request);
  if (requestByteLength(request) > DESKTOP_GATEWAY_MAX_REQUEST_BYTES || !isDesktopGatewayRequestV1(request)) {
    return failure(requestId, "invalid_request", "errors.gateway.invalidRequest");
  }

  try {
    const providerResponse = await context.provider.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: request.requestId,
      correlationId: request.requestId,
      kind: "query",
      method: "application.getSnapshot",
      params: {},
    });
    if (!providerResponse.ok) {
      return failure(request.requestId, "internal", providerResponse.error.messageKey);
    }
    if (!isApplicationSnapshot(providerResponse.value)) {
      return failure(request.requestId, "internal", "errors.gateway.invalidProviderResponse");
    }

    return {
      schemaVersion: DESKTOP_GATEWAY_VERSION,
      requestId: request.requestId,
      ok: true,
      value: {
        schemaVersion: 1,
        productVersion: context.productVersion,
        runtime: "electron",
        platform: context.platform,
        capabilities: {
          gateway: true,
          tasks: capabilityAvailable(providerResponse.value, TASK_LIST_CAPABILITY),
          remoteBrowser: capabilityAvailable(providerResponse.value, REMOTE_BROWSER_CAPABILITY),
        },
      },
    };
  } catch {
    return failure(request.requestId, "internal", "errors.gateway.providerUnavailable");
  }
}
