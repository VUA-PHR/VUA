import {
  APPLICATION_CONTRACT_VERSION,
  DESKTOP_GATEWAY_MAX_REQUEST_BYTES,
  DESKTOP_GATEWAY_VERSION,
  isDesktopGatewayRequestV1,
  requestByteLength,
  type ApplicationRequestV01,
  type ApplicationSnapshotV01,
  type DesktopGatewayRequestV1,
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
  code: "invalid_request" | "unsupported_method" | "internal",
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

/** Gateway 方法 → 应用契约请求;方法表穷尽,新增方法在此同步登记 */
function toApplicationRequest(request: DesktopGatewayRequestV1): ApplicationRequestV01 {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: request.requestId,
    correlationId: request.requestId,
  };
  switch (request.method) {
    case "app.snapshot":
      return { ...base, kind: "query", method: "application.getSnapshot", params: {} };
    case "task.list":
      return { ...base, kind: "query", method: "task.list", params: {} };
    case "task.get":
      return { ...base, kind: "query", method: "task.get", params: { taskId: request.params.taskId } };
    case "task.requestCancellation":
      return {
        ...base,
        kind: "command",
        method: "task.requestCancellation",
        commandId: request.params.commandId,
        params: {
          taskId: request.params.taskId,
          ...(request.params.observedRevision === undefined
            ? {}
            : { observedRevision: request.params.observedRevision }),
        },
      };
    case "environment.getSnapshot":
      return { ...base, kind: "query", method: "environment.getSnapshot", params: {} };
    case "task.startDemo":
      return {
        ...base,
        kind: "command",
        method: "task.startDemo",
        commandId: request.params.commandId,
        params: {},
      };
  }
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
    const providerResponse = await context.provider.invoke(toApplicationRequest(request));
    if (!providerResponse.ok) {
      // 应用错误原样透传:本地化键、可重试与可恢复判定引用契约原值
      return {
        schemaVersion: DESKTOP_GATEWAY_VERSION,
        requestId: request.requestId,
        ok: false,
        error: { code: "application", application: providerResponse.error },
      };
    }
    if (request.method === "app.snapshot") {
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
    }
    // 其余方法:应用契约值原样作为 Gateway 返回值(方法表已保证形状)
    return {
      schemaVersion: DESKTOP_GATEWAY_VERSION,
      requestId: request.requestId,
      ok: true,
      value: providerResponse.value,
    };
  } catch {
    return failure(request.requestId, "internal", "errors.gateway.providerUnavailable");
  }
}
