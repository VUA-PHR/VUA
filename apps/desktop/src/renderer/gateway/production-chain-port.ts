import type {
  JobExecuteResultV02,
  PlanApproveResultV02,
  PlanGetResultV02,
  PlanListResultV02,
  PlanStatusV02,
  ProductionListQueryV02,
  ProductionTaskAcceptedV02,
  RecordGetResultV02,
  RecordListResultV02,
} from "@vua/contracts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";
import { createGatewayClient, type DesktopGatewayHost, type GatewayClient } from "./gateway-client.ts";

/**
 * 生产链共享端口(019 批 C,需求 §5 Production 分组;两套 UI 共用解析/
 * 计划/任务/记录,消费 production-use-case v0.2 中核心已交付的七方法):
 * - resolveRecipe/executeJob 为任务化受理(九态;任务进度经任务中心);
 * - approvePlan 幂等(draft→approved);
 * - get/list 为只读查询(闭集分页与过滤);
 * - 共享前端接口不依赖 React 组件(需求 §3);fixture 端口不模拟生产链
 *   (019 批 C 验收:无模拟替代未完成接口),诚实不可用。
 *
 * 返回 null = 提供方响应不可解释/不可用(收窄失败),由调用方如实呈现;
 * 值形状由 Kernel 路由保证,端口侧用字段存在性收窄(照 warehouse live
 * 先例)。
 */
export interface ProductionChainPort {
  /** 解析(recipe.resolve;任务化受理) */
  resolveRecipe(recipeId: string, revision?: number): Promise<ProductionTaskAcceptedV02 | null>;
  /** 批准计划(plan.approve;draft→approved 幂等) */
  approvePlan(planId: string): Promise<PlanApproveResultV02 | null>;
  /** 读取一份计划(plan.get) */
  getPlan(planId: string): Promise<PlanGetResultV02 | null>;
  /** 计划列表(plan.list;分页与 recipeId 过滤) */
  listPlans(query: ProductionChainListQuery): Promise<PlanListResultV02 | null>;
  /** 执行作业(job.execute;仅 approved 计划;任务化受理) */
  executeJob(planId: string): Promise<JobExecuteResultV02 | null>;
  /** 读取一份构建记录(record.get;recordDocument 为透传文档) */
  getRecord(buildId: string): Promise<RecordGetResultV02 | null>;
  /** 构建记录列表(record.list) */
  listRecords(query: ProductionChainListQuery): Promise<RecordListResultV02 | null>;
  capability(): Promise<CapabilityReport>;
}

/** 共享层查询参数(019 §5;契约闭集镜像,渲染层不扩字段) */
export interface ProductionChainListQuery {
  readonly text?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly recipeId?: string;
}

/** 受理回执收窄(taskId/correlationId/state 三字段齐才可信) */
function narrowTaskAccepted(value: unknown): ProductionTaskAcceptedV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const taskId = record.taskId;
  const correlationId = record.correlationId;
  const state = record.state;
  if (
    typeof taskId !== "string" ||
    taskId.length === 0 ||
    typeof correlationId !== "string" ||
    correlationId.length === 0 ||
    typeof state !== "string" ||
    state.length === 0
  ) {
    return null;
  }
  return {
    taskId,
    correlationId,
    state: state as ProductionTaskAcceptedV02["state"],
  };
}

/** plan.approve 回执收窄(planId/planStatus 齐才可信) */
function narrowPlanApprove(value: unknown): PlanApproveResultV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const planId = record.planId;
  const planStatus = record.planStatus;
  if (typeof planId !== "string" || planId.length === 0) return null;
  if (planStatus !== "draft" && planStatus !== "approved" && planStatus !== "superseded") {
    return null;
  }
  return { planId, planStatus };
}

/** plan.get 收窄(planId/planStatus/planDocument 齐才可信) */
function narrowPlanGet(value: unknown): PlanGetResultV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const planId = record.planId;
  const planStatus = record.planStatus;
  if (typeof planId !== "string" || planId.length === 0) return null;
  if (planStatus !== "draft" && planStatus !== "approved" && planStatus !== "superseded") {
    return null;
  }
  if (record.planDocument === null || typeof record.planDocument !== "object" || Array.isArray(record.planDocument)) {
    return null;
  }
  return {
    planId,
    planStatus,
    planDocument: record.planDocument as Record<string, unknown>,
  };
}

/** 列表条目收窄(字段存在性与类型逐项核,词表外滤除) */
function narrowPlanListEntry(raw: unknown): { planId: string; recipeId: string; status: PlanStatusV02; approvedAt: string } | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const planId = record.planId;
  const recipeId = record.recipeId;
  const status = record.status;
  const approvedAt = record.approvedAt;
  if (
    typeof planId !== "string" || planId.length === 0 ||
    typeof recipeId !== "string" || recipeId.length === 0 ||
    typeof status !== "string" ||
    (status !== "draft" && status !== "approved" && status !== "superseded") ||
    typeof approvedAt !== "string" || approvedAt.length === 0
  ) {
    return null;
  }
  return { planId, recipeId, status, approvedAt };
}

/** plan.list 收窄(total/entries 齐才可信) */
function narrowPlanList(value: unknown): PlanListResultV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.entries)) return null;
  const entries = record.entries
    .map(narrowPlanListEntry)
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const total = record.total;
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0) return null;
  return { total, entries };
}

/** job.execute 受理回执收窄 */
function narrowJobExecute(value: unknown): JobExecuteResultV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const taskId = record.taskId;
  const correlationId = record.correlationId;
  const state = record.state;
  if (typeof taskId !== "string" || taskId.length === 0) return null;
  if (typeof correlationId !== "string" || correlationId.length === 0) return null;
  if (typeof state !== "string" || state.length === 0) return null;
  return {
    taskId,
    correlationId,
    state: state as JobExecuteResultV02["state"],
  };
}

/** record.get 收窄(buildId/recordDocument 齐才可信) */
function narrowRecordGet(value: unknown): RecordGetResultV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const buildId = record.buildId;
  const recordDocument = record.recordDocument;
  if (typeof buildId !== "string" || buildId.length === 0) return null;
  if (recordDocument === null || typeof recordDocument !== "object" || Array.isArray(recordDocument)) {
    return null;
  }
  return {
    buildId,
    recordDocument: recordDocument as Record<string, unknown>,
  };
}

/** record.list 条目收窄(buildId/planId/status/finishedAt 齐才可信) */
function narrowRecordListEntry(
  raw: unknown,
): { buildId: string; planId: string; status: string; finishedAt: string } | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const buildId = record.buildId;
  const planId = record.planId;
  const status = record.status;
  const finishedAt = record.finishedAt;
  if (
    typeof buildId !== "string" || buildId.length === 0 ||
    typeof planId !== "string" || planId.length === 0 ||
    typeof status !== "string" || status.length === 0 ||
    typeof finishedAt !== "string" || finishedAt.length === 0
  ) {
    return null;
  }
  return { buildId, planId, status, finishedAt };
}

/** record.list 收窄(total/entries 齐才可信) */
function narrowRecordList(value: unknown): RecordListResultV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.entries)) return null;
  const entries = record.entries
    .map(narrowRecordListEntry)
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const total = record.total;
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0) return null;
  return { total, entries };
}

/** live 实现:经 GatewayClient 消费 Kernel(字段存在性收窄,收不齐=不可
 *  解释,如实 null——照 warehouse-commands live 先例) */
export function createLiveProductionChainPort(host: DesktopGatewayHost): ProductionChainPort {
  const client: GatewayClient = createGatewayClient(host);
  const invoke = async (
    method: Parameters<GatewayClient["invoke"]>[0]["method"],
    params: Record<string, unknown>,
  ): Promise<Awaited<ReturnType<GatewayClient["invoke"]>>> =>
    client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method,
      params,
    } as Parameters<GatewayClient["invoke"]>[0]);

  return {
    resolveRecipe: async (recipeId, revision) => {
      const params: Record<string, unknown> = { recipeId };
      if (revision !== undefined) params.revision = revision;
      const result = await invoke("recipe.resolve", params);
      return result.ok ? narrowTaskAccepted(result.value) : null;
    },
    approvePlan: async (planId) => {
      const result = await invoke("plan.approve", { planId });
      return result.ok ? narrowPlanApprove(result.value) : null;
    },
    getPlan: async (planId) => {
      const result = await invoke("plan.get", { planId });
      return result.ok ? narrowPlanGet(result.value) : null;
    },
    listPlans: async (query) => {
      const result = await invoke("plan.list", { ...query });
      return result.ok ? narrowPlanList(result.value) : null;
    },
    executeJob: async (planId) => {
      const result = await invoke("job.execute", { planId });
      return result.ok ? narrowJobExecute(result.value) : null;
    },
    getRecord: async (buildId) => {
      const result = await invoke("record.get", { buildId });
      return result.ok ? narrowRecordGet(result.value) : null;
    },
    listRecords: async (query) => {
      const result = await invoke("record.list", { ...query });
      return result.ok ? narrowRecordList(result.value) : null;
    },
    capability: async () => ({ state: "unavailable", detailKey: "detectorsMissing" }),
  };
}
