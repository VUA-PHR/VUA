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

/** 生产上下文四元组(amf-production v0.2:startInspection 一次性转交) */
export interface ProductionContextV02 {
  readonly sourceFolder: string;
  readonly projectRoot: string;
  readonly artifactOutputRoot: string;
  readonly projectId: string;
}

export interface DesktopGatewayRouteContext {
  readonly provider: OrchestratorProviderV01;
  readonly productVersion: string;
  readonly platform: "win32" | "darwin" | "linux";
  readonly rendererUrl: string | undefined;
  /** 生产上下文解析(M3):refId → 四元组。sourceFolder 来自用户显式选取,
   *  projectRoot/artifactOutputRoot/projectId 是 VUA 管辖配置,渲染层不可见;
   *  未知引用返回 undefined。四元组随 startInspection 一次性转交,此后路径
   *  不再出现在任何请求面 */
  readonly resolveMaterialSource: (refId: string) => ProductionContextV02 | undefined;
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
function toApplicationRequest(
  request: DesktopGatewayRequestV1,
  resolveMaterialSource: DesktopGatewayRouteContext["resolveMaterialSource"],
): ApplicationRequestV01 {
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
    case "production.startInspection": {
      // v0.2:四元组在此一次性转交;渲染层仍只持 materialRefId + commandId
      const context = resolveMaterialSource(request.params.materialRefId);
      if (context === undefined) {
        throw new UnknownMaterialSourceError(request.params.materialRefId);
      }
      return {
        ...base,
        kind: "command",
        method: "production.startInspection",
        commandId: request.params.commandId,
        params: {
          sourceFolder: context.sourceFolder,
          projectRoot: context.projectRoot,
          artifactOutputRoot: context.artifactOutputRoot,
          projectId: context.projectId,
        },
      };
    }
    case "production.getInspection":
      return { ...base, kind: "query", method: "production.getInspection", params: { inspectionId: request.params.inspectionId } };
    case "production.requestPlan":
      return {
        ...base,
        kind: "command",
        method: "production.requestPlan",
        commandId: request.params.commandId,
        params: {
          inspectionId: request.params.inspectionId,
          // 双素材入口的真实用户决策,渲染层从已选素材的 intake 透传
          mode: request.params.mode,
        },
      };
    case "production.getPlan":
      return { ...base, kind: "query", method: "production.getPlan", params: { planId: request.params.planId } };
    case "production.confirmPlan":
      return {
        ...base,
        kind: "command",
        method: "production.confirmPlan",
        commandId: request.params.commandId,
        params: {
          planId: request.params.planId,
          observedRevision: request.params.observedRevision,
          riskChoice: request.params.riskChoice,
          ...(request.params.rememberForSession === undefined
            ? {}
            : { rememberForSession: request.params.rememberForSession }),
        },
      };
    case "production.getBuildRecord":
      return { ...base, kind: "query", method: "production.getBuildRecord", params: { buildRecordId: request.params.buildRecordId } };
    case "production.recover": {
      // v0.2:用户决定 ID 由 Kernel 生成并绑定(taskId + revision + decision),
      // 渲染层不传入,防伪造授权;路径已在登记绑定中,不再由请求携带
      const decisionId = `udid-${crypto.randomUUID()}`;
      return {
        ...base,
        kind: "command",
        method: "production.recover",
        commandId: request.params.commandId,
        params: {
          taskId: request.params.taskId,
          decision: request.params.decision,
          decisionId,
        },
      };
    }
    // bdl-queries v0.2 只读查询面:查询闭集已由信封守卫验证,参数原样透传
    case "catalog.list":
      return { ...base, kind: "query", method: "catalog.list", params: request.params };
    case "catalog.detail":
      return { ...base, kind: "query", method: "catalog.detail", params: request.params };
    case "catalog.status":
      return { ...base, kind: "query", method: "catalog.status", params: {} };
    case "warehouse.listEntries":
      return { ...base, kind: "query", method: "warehouse.listEntries", params: {} };
    // bdl-queries v0.4(015 §10):可采纳下载列表,空参数 verbatim
    case "downloads.listCompleted":
      return { ...base, kind: "query", method: "downloads.listCompleted", params: {} };
    // 013 读面第一翼(核心 e720544):environmentManagers 快照,空参数 verbatim
    case "project.environmentManagers":
      return { ...base, kind: "query", method: "project.environmentManagers", params: {} };
    case "project.listProjects":
      return { ...base, kind: "query", method: "project.listProjects", params: {} };
    case "project.inspectProject":
      return { ...base, kind: "query", method: "project.inspectProject", params: { projectPath: request.params.projectPath } };
    case "project.lockStatus":
      return { ...base, kind: "query", method: "project.lockStatus", params: { projectPath: request.params.projectPath } };
    case "warehouse.entryDetail":
      return { ...base, kind: "query", method: "warehouse.entryDetail", params: { warehouseItemId: request.params.warehouseItemId } };
    case "download.retry":
      return { ...base, kind: "command", method: "download.retry", commandId: request.params.commandId, params: { taskId: request.params.taskId } };
    // bdl-commands v0.1 写命令(proposal 005):词表已由信封守卫验证,原样映射
    case "warehouse.setArtifactMode":
      return { ...base, kind: "command", method: "warehouse.setArtifactMode", commandId: request.params.commandId, params: { warehouseItemId: request.params.warehouseItemId, mode: request.params.mode } };
    case "warehouse.generateVpm":
      return { ...base, kind: "command", method: "warehouse.generateVpm", commandId: request.params.commandId, params: { warehouseItemId: request.params.warehouseItemId } };
    case "warehouse.deleteOriginals":
      return { ...base, kind: "command", method: "warehouse.deleteOriginals", commandId: request.params.commandId, params: { warehouseItemId: request.params.warehouseItemId } };
    case "warehouse.setGlobalDefaultMode":
      return { ...base, kind: "command", method: "warehouse.setGlobalDefaultMode", commandId: request.params.commandId, params: { mode: request.params.mode } };
    case "warehouse.import":
      return { ...base, kind: "command", method: "warehouse.import", commandId: request.params.commandId, params: { sourceFolders: [...request.params.sourceFolders] } };
    // bdl-commands v0.4 下载采纳(IMP-3):仅身份请求原样映射
    case "warehouse.importDownloads":
      return { ...base, kind: "command", method: "warehouse.importDownloads", commandId: request.params.commandId, params: { downloadIds: [...request.params.downloadIds] } };

    // production-use-case v0.2(W20 ten-method, W24 workbench): verbatim pass-through
    case "recipe.save":
      return {
        ...base,
        kind: "command",
        method: "recipe.save",
        commandId: `rec-${crypto.randomUUID()}`,
        params: request.params,
      };
    case "recipe.resolve":
      return {
        ...base,
        kind: "command",
        method: "recipe.resolve",
        commandId: `res-${crypto.randomUUID()}`,
        params: request.params,
      };
    case "plan.approve":
      return {
        ...base,
        kind: "command",
        method: "plan.approve",
        commandId: `apv-${crypto.randomUUID()}`,
        params: request.params,
      };
    case "job.execute":
      return {
        ...base,
        kind: "command",
        method: "job.execute",
        commandId: `job-${crypto.randomUUID()}`,
        params: request.params,
      };
    case "recipe.get":
      return { ...base, kind: "query", method: "recipe.get", params: { recipeId: request.params.recipeId } };
    case "recipe.list":
      return { ...base, kind: "query", method: "recipe.list", params: request.params };
    case "plan.get":
      return { ...base, kind: "query", method: "plan.get", params: { planId: request.params.planId } };
    case "plan.list":
      return { ...base, kind: "query", method: "plan.list", params: request.params };
    case "record.get":
      return { ...base, kind: "query", method: "record.get", params: { buildId: request.params.buildId } };
    case "record.list":
      return { ...base, kind: "query", method: "record.list", params: request.params };
    case "project.import-copy":
      return {
        ...base,
        kind: "command",
        method: "project.import-copy",
        commandId: `imp-${crypto.randomUUID()}`,
        params: request.params,
      };
  }
}

/** 未知素材引用的 Kernel 侧应用错误(渲染层呈现可发现失败) */
class UnknownMaterialSourceError extends Error {
  readonly refId: string;
  constructor(refId: string) {
    super(`unknown material source: ${refId}`);
    this.refId = refId;
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
    let applicationRequest: ApplicationRequestV01;
    try {
      applicationRequest = toApplicationRequest(request, context.resolveMaterialSource);
    } catch (error) {
      if (error instanceof UnknownMaterialSourceError) {
        // 未知素材引用:Kernel 侧应用错误(诚实失败,渲染层可发现)
        return {
          schemaVersion: DESKTOP_GATEWAY_VERSION,
          requestId: request.requestId,
          ok: false,
          error: {
            code: "application",
            application: {
              contractVersion: APPLICATION_CONTRACT_VERSION,
              code: "vua.material.source_unknown",
              category: "validation",
              messageKey: "errors.material.sourceUnknown",
              recoverable: false,
              retryable: false,
              correlationId: request.requestId,
            },
          },
        };
      }
      throw error;
    }
    const providerResponse = await context.provider.invoke(applicationRequest);
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
            // §11 仲裁 (a):内嵌浏览能力归壳自报(preload capabilities),
            // provider 不再报告也不转述;字段保留待核心处置 AppSnapshot 形状,
            // 恒 false 反映「provider 无此 capability 行」的事实(渲染层已
            // 不消费本字段)
            remoteBrowser: false,
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
