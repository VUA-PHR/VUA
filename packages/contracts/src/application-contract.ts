import { isDownloadEventV01 } from "./download-events.js";

export const APPLICATION_CONTRACT_VERSION = "0.1" as const;

export type ApplicationContractVersion = typeof APPLICATION_CONTRACT_VERSION;

export type ApplicationErrorCategoryV01 =
  | "validation"
  | "conflict"
  | "permission"
  | "dependency"
  | "unavailable"
  | "timeout"
  | "cancelled"
  | "external_failure"
  | "internal";

export type ApplicationParamValueV01 = string | number | boolean;

export interface AppErrorV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly code: string;
  readonly category: ApplicationErrorCategoryV01;
  readonly messageKey: string;
  readonly params?: Readonly<Record<string, ApplicationParamValueV01>>;
  readonly recoverable: boolean;
  readonly retryable: boolean;
  readonly correlationId: string;
  readonly fieldPath?: string;
  readonly redactedContext?: Readonly<Record<string, ApplicationParamValueV01>>;
}

export type TaskStateV01 =
  | "queued"
  | "preparing"
  | "running"
  | "waiting_for_input"
  | "paused"
  | "succeeded"
  | "succeeded_with_warnings"
  | "failed"
  | "cancelled";

export const TERMINAL_TASK_STATES_V01 = [
  "succeeded",
  "succeeded_with_warnings",
  "failed",
  "cancelled",
] as const satisfies readonly TaskStateV01[];

export function isTerminalTaskStateV01(state: TaskStateV01): boolean {
  return (TERMINAL_TASK_STATES_V01 as readonly string[]).includes(state);
}

export type TaskRecoveryDispositionV01 = "none" | "inspect_required";

export type CapabilityOperationV01 =
  | {
      readonly operationId: string;
      readonly availability: "available";
    }
  | {
      readonly operationId: string;
      readonly availability: "unavailable";
      readonly reason: AppErrorV01;
    };

export interface CapabilitySnapshotV01 {
  readonly revision: number;
  readonly operations: readonly CapabilityOperationV01[];
}

export interface ApplicationSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly revision: number;
  readonly capabilities: CapabilitySnapshotV01;
}

export interface TaskSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly taskId: string;
  readonly revision: number;
  readonly correlationId: string;
  readonly state: TaskStateV01;
  readonly cancellationRequested: boolean;
  readonly recoveryDisposition: TaskRecoveryDispositionV01;
  readonly updatedAt: string;
  readonly error?: AppErrorV01;
}

interface ApplicationRequestBaseV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly requestId: string;
  readonly correlationId: string;
}

export interface ApplicationSnapshotQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "application.getSnapshot";
  readonly params: Readonly<Record<string, never>>;
}

export interface TaskListQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "task.list";
  readonly params: Readonly<Record<string, never>>;
}

export interface TaskGetQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "task.get";
  readonly params: {
    readonly taskId: string;
  };
}

export interface TaskCancellationCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "task.requestCancellation";
  readonly commandId: string;
  readonly params: {
    readonly taskId: string;
    readonly observedRevision?: number;
  };
}

// ---- production.*(production-use-case v0.1 冻结面;素材路径已由 Kernel 解析) ----

export interface ProductionStartInspectionCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.startInspection";
  readonly commandId: string;
  readonly params: { readonly sourceFolder: string };
}

export interface ProductionGetInspectionQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "production.getInspection";
  readonly params: { readonly inspectionId: string };
}

export interface ProductionRequestPlanCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.requestPlan";
  readonly commandId: string;
  readonly params: { readonly inspectionId: string };
}

export interface ProductionGetPlanQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "production.getPlan";
  readonly params: { readonly planId: string };
}

export interface ProductionConfirmPlanCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.confirmPlan";
  readonly commandId: string;
  readonly params: {
    readonly planId: string;
    readonly observedRevision?: number;
  };
}

export interface ProductionRecoverCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.recover";
  readonly commandId: string;
  readonly params: {
    readonly taskId: string;
    readonly decision: "continue" | "rollback";
    readonly decisionId: string;
  };
}

export interface ProductionGetBuildRecordQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "production.getBuildRecord";
  readonly params: { readonly buildRecordId: string };
}

// ---- catalog.* / warehouse.*(bdl-queries v0.3 冻结面:AMF 从本地 BDL 出的
// 五个只读查询。传输信封归本契约;本节冻结操作词表、查询闭集、字段面与结果
// 形状。渲染层永不直接触达 BDL;协议变更须升版,不得原地改写) ----

/** v0.2 availability 稳定枚举:由 AMF/BDL 处理器按协议版本化规则表从观测
 *  原词派生;渲染层只消费该枚举(徽标与筛选),原词证据走 availabilityRaw */
export type CatalogAvailabilityStatusV03 = "available" | "unavailable" | "unknown";

export interface CatalogListQueryV03 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "catalog.list";
  readonly params: {
    /** 标题与 productId 的不区分大小写子串匹配;缺省或 null 不过滤 */
    readonly text?: string | null;
    /** 对派生稳定枚举精确匹配;缺省或 null 不过滤 */
    readonly availabilityStatus?: CatalogAvailabilityStatusV03 | null;
    /** 1–200,默认 50 */
    readonly limit?: number;
    /** ≥ 0,默认 0 */
    readonly offset?: number;
  };
}

export interface CatalogDetailQueryV03 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "catalog.detail";
  readonly params: { readonly productId: string };
}

export interface CatalogStatusQueryV03 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "catalog.status";
  readonly params: Readonly<Record<string, never>>;
}

export interface WarehouseListEntriesQueryV03 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "warehouse.listEntries";
  readonly params: Readonly<Record<string, never>>;
}

export interface WarehouseEntryDetailQueryV03 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "warehouse.entryDetail";
  readonly params: { readonly warehouseItemId: string };
}

export interface CatalogPriceV03 {
  /** 字符串金额 + 币种(禁用 JS number 表示货币);仅单价商品有值 */
  readonly amount: string;
  readonly currency: string;
}

/** v0.2 双字段:raw = 观测原词(证据,可为裸词或完整 schema.org URL,永不
 *  归一化);status = 处理器按版本化规则表派生的稳定枚举 */
export interface CatalogAvailabilityPairV03 {
  readonly raw: string | null;
  readonly status: CatalogAvailabilityStatusV03;
}

export interface CatalogProductSummaryV03 {
  /** booth:<数字> 命名空间身份 */
  readonly productId: string;
  readonly title: string | null;
  readonly price: CatalogPriceV03 | null;
  /** 恒等于 imageUrls[0] 或 null;经 vuaimg 缓存协议承载 */
  readonly imageUrl: string | null;
  readonly imageUrls: readonly string[];
  readonly availabilityRaw: string | null;
  readonly availabilityStatus: CatalogAvailabilityStatusV03;
  /** v0.2 诚实空槽:实体存储属 BDL v2 */
  readonly entityCount: 0;
  readonly entityTypes: readonly [];
}

export interface CatalogListResultV03 {
  /** 分页总数(limit/offset 截取前计算) */
  readonly total: number;
  readonly entries: readonly CatalogProductSummaryV03[];
}

export interface CatalogSubproductV03 {
  readonly variationId: string | null;
  readonly name: string | null;
  readonly price: CatalogPriceV03 | null;
  readonly availabilityRaw: string | null;
  readonly availabilityStatus: CatalogAvailabilityStatusV03;
}

export interface CatalogProductDetailV03 {
  readonly productId: string;
  readonly title: string | null;
  readonly price: CatalogPriceV03 | null;
  readonly imageUrl: string | null;
  readonly imageUrls: readonly string[];
  readonly availabilityRaw: string | null;
  readonly availabilityStatus: CatalogAvailabilityStatusV03;
  readonly entityCount: 0;
  readonly entityTypes: readonly [];
  readonly description: string | null;
  readonly shopName: string | null;
  readonly shopUrl: string | null;
  /** 仅显式 BOOTH Adult 徽标为真 */
  readonly adult: boolean;
  readonly videoUrls: readonly string[];
  /** BOOTH 展示分类,无推断 */
  readonly sourceCategory: string | null;
  readonly subproducts: readonly CatalogSubproductV03[];
}

export interface CatalogDetailResultV03 {
  readonly product: CatalogProductDetailV03;
}

export type CatalogHealthV03 = "unknown" | "ok" | "incompatible";

export interface CatalogRevisionV03 {
  /** 观察管线簿记计数器落地前恒 null */
  readonly catalogUpdatedSeq: number | null;
  /** v0.2 = BDL format_version */
  readonly datasetRevision: string;
}

export interface CatalogStatusResultV03 {
  readonly health: CatalogHealthV03;
  readonly revision: CatalogRevisionV03;
}

export type WarehouseArtifactStateV03 = "pending" | "clean" | "quarantined";

export type WarehouseArtifactRoleV03 = "original" | "generated_vpm";

export interface WarehouseArtifactRefV03 {
  readonly relativePath: string;
  /** sha256:<64 位小写十六进制> */
  readonly artifactSha256: string;
  readonly state: WarehouseArtifactStateV03;
  readonly sizeBytes: number;
  /** 副本角色(v0.3):原始包 / 生成 VPM 包 */
  readonly role: WarehouseArtifactRoleV03;
}

/** 条目 kind 闭集(v0.3 收敛);生成 VPM 属 local_vpm 工件族,不新增 kind */
export type WarehouseEntryKindV03 = "imported_material" | "downloaded_material";

export type WarehouseArtifactModeV03 = "use_original_unitypackage" | "generate_vpm";

export interface WarehouseEntryCardV03 {
  /** VUA 生成身份,稳定且不从显示名派生 */
  readonly warehouseItemId: string;
  readonly folderName: string;
  readonly displayName: string;
  readonly kind: WarehouseEntryKindV03;
  readonly createdAt: string;
  readonly artifacts: readonly WarehouseArtifactRefV03[];
  /** 每条目消费偏好覆盖;null = 跟随全局默认 */
  readonly artifactMode: WarehouseArtifactModeV03 | null;
  /** 读取时动态解析:覆盖 ?? 全局默认;只是偏好,不代表 VPM 已存在 */
  readonly effectiveArtifactMode: WarehouseArtifactModeV03;
}

export interface WarehouseListEntriesResultV03 {
  readonly entries: readonly WarehouseEntryCardV03[];
}

export interface WarehouseArtifactFactV03 extends WarehouseArtifactRefV03 {
  readonly suggestedFileName: string | null;
  /** 机械判定时刻;pending 时 null */
  readonly inspectedAt: string | null;
  /** 诚实判定文本;仅 quarantined 非空 */
  readonly rejectionReason: string | null;
  readonly sourceCorrelated: boolean;
  readonly mappedProductIds: readonly string[];
}

export interface WarehouseEntryDetailResultV03 {
  readonly entry: Omit<WarehouseEntryCardV03, "artifacts"> & {
    readonly artifacts: readonly WarehouseArtifactFactV03[];
  };
}

// ---- download.*(下载域命令与意图事件;词表见 download-events v0.1 冻结面
// 与 b-reply-to-f4-download-task-requirements 的形状裁定) ----

/** Main → AMF 批量投递下载事件(at-least-once:重发 + BDL 唯一键去重);
 *  回执为批量级 high-water——收到任一回执即可裁剪整批缓冲 */
export interface DownloadIngestCommandV03 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "download.ingest";
  readonly commandId: string;
  readonly params: {
    readonly schemaVersion: "0.1";
    readonly events: readonly import("./download-events.js").DownloadEventV01[];
  };
}

/** 批量折叠回执:folded = 新折叠数;duplicates = 去重数;rejected = 单条
 *  非法事件(不毒化整批,Main 决定重投或死信) */
export interface DownloadIngestReceiptV03 {
  readonly folded: number;
  readonly duplicates: number;
  readonly rejected: readonly { readonly index: number; readonly code: string; readonly reason: string }[];
}

/** 渲染层"重试"入口(任务级动作):AMF 以冻结重试策略裁决,不可重试时
 *  `vua.download.not_retryable` 拒绝 */
export interface DownloadRetryCommandV03 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "download.retry";
  readonly commandId: string;
  readonly params: { readonly taskId: string };
}

export interface DownloadRetryResultV03 {
  readonly taskId: string;
  readonly decision: "resume" | "retry";
  readonly intentSeq: number;
}

/** AMF → Main 的端口意图事件(经既有 event 帧):Main 按 downloadId 丢弃
 *  intentSeq ≤ lastApplied 的意图,到达序经 applyIntent 串行解释 */
export interface DownloadIntentEventV03 {
  readonly contractVersion: ApplicationContractVersion;
  readonly eventId: string;
  readonly revision: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly kind: "download.intent";
  readonly payload: {
    readonly downloadId: string;
    readonly intent: "abandon" | "resume" | "retry";
    readonly intentSeq: number;
  };
}

export type ApplicationRequestV01 =
  | ApplicationSnapshotQueryV01
  | TaskListQueryV01
  | TaskGetQueryV01
  | TaskCancellationCommandV01
  | EnvironmentSnapshotQueryV01
  | DemoTaskStartCommandV01
  | ProductionStartInspectionCommandV01
  | ProductionGetInspectionQueryV01
  | ProductionRequestPlanCommandV01
  | ProductionGetPlanQueryV01
  | ProductionConfirmPlanCommandV01
  | ProductionRecoverCommandV01
  | ProductionGetBuildRecordQueryV01
  | CatalogListQueryV03
  | CatalogDetailQueryV03
  | CatalogStatusQueryV03
  | WarehouseListEntriesQueryV03
  | WarehouseEntryDetailQueryV03
  | DownloadIngestCommandV03
  | DownloadRetryCommandV03;

export interface TaskListSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly revision: number;
  readonly tasks: readonly TaskSnapshotV01[];
}

export type CancellationOutcomeV01 = "requested" | "already_requested" | "already_terminal";

export interface TaskCancellationResultV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly taskId: string;
  readonly revision: number;
  readonly state: TaskStateV01;
  readonly outcome: CancellationOutcomeV01;
}

/** 环境检测辖区，与 B6 检测 spike 的 Zone 一致 */
export type EnvironmentZoneV01 = "play" | "create";

/**
 * 在场事实，不做严重度裁决：组件缺失是正常发现，不是错误。
 * 缺失是否构成问题、以何种严重度呈现，由消费侧决定。
 */
export type EnvironmentPresenceV01 = "detected" | "not_detected" | "detection_failed";

export interface EnvironmentCheckItemV01 {
  /** 稳定检查 id（如 `steam`、`unity_editors`）；修复计划与表现层按它取键 */
  readonly checkId: string;
  readonly zone: EnvironmentZoneV01;
  readonly presence: EnvironmentPresenceV01;
  /** 仅在 presence === "detection_failed" 时设置 */
  readonly errorCode?: string;
  /** 工程事实（路径、版本、字节数等原始观测）；对契约不透明 */
  readonly facts: Readonly<Record<string, unknown>>;
}

export interface EnvironmentSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly revision: number;
  readonly capturedAt: string;
  readonly items: readonly EnvironmentCheckItemV01[];
}

export interface EnvironmentSnapshotQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "environment.getSnapshot";
  readonly params: Readonly<Record<string, never>>;
}

/**
 * 演示任务命令（F2）：任务体验的端到端演示通道（提交 → 观察 → 取消）。
 * 由操作级 capability（`demo.task`）门控；首个真实用例命令落地后降级为测试夹具。
 * 创建的任务与真实任务走完全相同的九态、事件与取消语义，不携带用户数据。
 */
export interface DemoTaskStartCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "task.startDemo";
  readonly commandId: string;
  readonly params: Readonly<Record<string, never>>;
}

export interface DemoTaskStartedV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly task: TaskSnapshotV01;
}

export type ApplicationSuccessValueV01 =
  | ApplicationSnapshotV01
  | TaskListSnapshotV01
  | TaskSnapshotV01
  | TaskCancellationResultV01
  | EnvironmentSnapshotV01
  | DemoTaskStartedV01
  | CatalogListResultV03
  | CatalogDetailResultV03
  | CatalogStatusResultV03
  | WarehouseListEntriesResultV03
  | WarehouseEntryDetailResultV03;

export type ApplicationResponseV01 =
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly requestId: string;
      readonly ok: true;
      readonly value: ApplicationSuccessValueV01;
    }
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly requestId: string;
      readonly ok: false;
      readonly error: AppErrorV01;
    };

interface TaskEventBaseV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly eventId: string;
  readonly taskId: string;
  readonly revision: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly state: TaskStateV01;
}

export type TaskEventV01 =
  | (TaskEventBaseV01 & {
      readonly kind: "task.accepted" | "task.stateChanged";
      readonly payload: Readonly<Record<string, never>>;
    })
  | (TaskEventBaseV01 & {
      readonly kind: "task.progressed";
      readonly payload: {
        readonly completed: number;
        readonly total?: number;
        readonly messageKey: string;
        readonly params?: Readonly<Record<string, ApplicationParamValueV01>>;
      };
    })
  | (TaskEventBaseV01 & {
      readonly kind: "task.cancellationRequested";
      readonly payload: {
        readonly commandId: string;
        readonly observedRevision?: number;
      };
    })
  | (TaskEventBaseV01 & {
      readonly kind: "task.completed";
      readonly payload: {
        readonly error?: AppErrorV01;
      };
    });

export interface CapabilityChangedEventV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly eventId: string;
  readonly revision: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly kind: "capability.changed";
  readonly payload: CapabilitySnapshotV01;
}

export type ApplicationEventV01 = TaskEventV01 | CapabilityChangedEventV01 | DownloadIntentEventV03;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function isApplicationRequestV01(value: unknown): value is ApplicationRequestV01 {
  if (!isRecord(value) || value.contractVersion !== APPLICATION_CONTRACT_VERSION) return false;
  if (!isIdentifier(value.requestId) || !isIdentifier(value.correlationId) || !isRecord(value.params)) return false;

  if (value.kind === "query" && value.method === "application.getSnapshot") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "task.list") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "task.get") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["taskId"])
      && isIdentifier(value.params.taskId);
  }
  if (value.kind === "command" && value.method === "task.requestCancellation") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])) {
      return false;
    }
    if (!isIdentifier(value.commandId) || !isIdentifier(value.params.taskId)) return false;
    const keys = Object.keys(value.params);
    if (!keys.every((key) => key === "taskId" || key === "observedRevision") || !keys.includes("taskId")) return false;
    return value.params.observedRevision === undefined || isNonNegativeInteger(value.params.observedRevision);
  }
  if (value.kind === "query" && value.method === "environment.getSnapshot") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "command" && value.method === "task.startDemo") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "command" && value.method === "production.startInspection") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["sourceFolder"])
      && isIdentifier(value.params.sourceFolder);
  }
  if (value.kind === "query" && value.method === "production.getInspection") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["inspectionId"])
      && isIdentifier(value.params.inspectionId);
  }
  if (value.kind === "command" && value.method === "production.requestPlan") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["inspectionId"])
      && isIdentifier(value.params.inspectionId);
  }
  if (value.kind === "query" && value.method === "production.getPlan") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["planId"])
      && isIdentifier(value.params.planId);
  }
  if (value.kind === "command" && value.method === "production.confirmPlan") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["planId"])
      && isIdentifier(value.params.planId)
      && (value.params.observedRevision === undefined || isNonNegativeInteger(value.params.observedRevision));
  }
  if (value.kind === "command" && value.method === "production.recover") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["taskId", "decision", "decisionId"])
      && isIdentifier(value.params.taskId)
      && isIdentifier(value.params.decisionId)
      && (value.params.decision === "continue" || value.params.decision === "rollback");
  }
  if (value.kind === "query" && value.method === "production.getBuildRecord") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["buildRecordId"])
      && isIdentifier(value.params.buildRecordId);
  }
  if (value.kind === "query" && value.method === "catalog.list") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])) return false;
    const listParams = value.params as CatalogListQueryV03["params"];
    if (!Object.keys(listParams).every((key) => key === "text" || key === "availabilityStatus" || key === "limit" || key === "offset")) {
      return false;
    }
    if (listParams.text !== undefined && listParams.text !== null
      && (typeof listParams.text !== "string" || listParams.text.length < 1)) return false;
    if (listParams.availabilityStatus !== undefined && listParams.availabilityStatus !== null
      && !(["available", "unavailable", "unknown"] as readonly string[]).includes(listParams.availabilityStatus)) {
      return false;
    }
    if (listParams.limit !== undefined
      && (typeof listParams.limit !== "number" || !Number.isSafeInteger(listParams.limit) || listParams.limit < 1 || listParams.limit > 200)) {
      return false;
    }
    if (listParams.offset !== undefined
      && (typeof listParams.offset !== "number" || !Number.isSafeInteger(listParams.offset) || listParams.offset < 0)) {
      return false;
    }
    return true;
  }
  if (value.kind === "query" && value.method === "catalog.detail") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["productId"])
      && typeof value.params.productId === "string"
      && /^booth:[0-9]+$/.test(value.params.productId);
  }
  if (value.kind === "query" && value.method === "catalog.status") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "warehouse.listEntries") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "warehouse.entryDetail") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["warehouseItemId"])
      && isIdentifier(value.params.warehouseItemId);
  }
  if (value.kind === "command" && value.method === "download.ingest") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      || !isIdentifier(value.commandId)) {
      return false;
    }
    const ingestParams = value.params as { schemaVersion?: unknown; events?: unknown };
    if (ingestParams.schemaVersion !== "0.1" || !Array.isArray(ingestParams.events)) return false;
    return ingestParams.events.every((event) => isDownloadEventV01(event));
  }
  if (value.kind === "command" && value.method === "download.retry") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["taskId"])
      && isIdentifier(value.params.taskId);
  }
  return false;
}
