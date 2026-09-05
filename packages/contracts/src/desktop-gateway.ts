import type {
  AppErrorV01,
  ApplicationEventV01,
  ApplicationSuccessValueV01,
  CatalogAvailabilityStatusV02,
} from "./application-contract.js";

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

/**
 * Gateway 方法表(v1):Renderer 可见的显式方法面。
 * 每个方法映射到 application-contract v0.1 的对应 Query/Command(见
 * docs/protocols/application-contract-v0.1);映射关系由 Kernel(gateway-router)
 * 持有,Renderer 不接触 Provider 词汇以外的语义。
 * 未知方法在守卫处明确拒绝;新增方法在此登记并同步更新守卫与测试。
 */
export interface AppSnapshotRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "app.snapshot";
  readonly params: Record<string, never>;
}

export interface GatewayTaskListRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.list";
  readonly params: Record<string, never>;
}

export interface GatewayTaskGetRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.get";
  readonly params: {
    readonly taskId: string;
  };
}

export interface GatewayTaskCancellationRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.requestCancellation";
  readonly params: {
    readonly taskId: string;
    readonly commandId: string;
    readonly observedRevision?: number;
  };
}

export interface GatewayEnvironmentSnapshotRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "environment.getSnapshot";
  readonly params: Record<string, never>;
}

export interface GatewayDemoTaskRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.startDemo";
  readonly params: {
    readonly commandId: string;
  };
}

// ---- production.*(production-use-case v0.1 冻结面) ----

export interface ProductionStartInspectionRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.startInspection";
  readonly params: {
    readonly materialRefId: string;
    readonly commandId: string;
  };
}

export interface ProductionGetInspectionRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.getInspection";
  readonly params: { readonly inspectionId: string };
}

export interface ProductionRequestPlanRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.requestPlan";
  readonly params: { readonly inspectionId: string; readonly commandId: string };
}

export interface ProductionGetPlanRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.getPlan";
  readonly params: { readonly planId: string };
}

export interface ProductionConfirmPlanRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.confirmPlan";
  readonly params: {
    readonly planId: string;
    readonly commandId: string;
    readonly observedRevision?: number;
  };
}

export interface ProductionRecoverRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.recover";
  readonly params: {
    /** 原始失败任务(恢复绑定对象) */
    readonly taskId: string;
    readonly decision: "continue" | "rollback";
    readonly commandId: string;
    /** 计划任务 id(continue 必需;rollback 可空) */
    readonly planTaskId?: string;
    /** 恢复上下文:来源与目标项目(rollback 时可空) */
    readonly sourceFolder?: string;
    readonly projectRoot?: string;
    readonly artifactOutputRoot?: string;
    /** 用户确认时刻(ISO);Kernel 生成 userDecisionId 后随请求下发 */
    readonly confirmedAt?: string;
    /** 风险选择(continue 消费) */
    readonly riskChoice?: string;
    /** 会话内记住本次选择 */
    readonly rememberForSession?: boolean;
  };
}

export interface ProductionGetBuildRecordRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.getBuildRecord";
  readonly params: { readonly buildRecordId: string };
}

// ---- catalog.* / warehouse.*(bdl-queries v0.2 冻结面:AMF 从本地 BDL 出的
// 五个只读查询;查询闭集与字段面见 docs/protocols/bdl-queries-v0.2,
// 守卫与操作词表一一对应,协议变更须升版) ----

export interface CatalogListRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "catalog.list";
  readonly params: {
    readonly text?: string | null;
    readonly availabilityStatus?: CatalogAvailabilityStatusV02 | null;
    readonly limit?: number;
    readonly offset?: number;
  };
}

export interface CatalogDetailRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "catalog.detail";
  readonly params: { readonly productId: string };
}

export interface CatalogStatusRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "catalog.status";
  readonly params: Record<string, never>;
}

export interface WarehouseListEntriesRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.listEntries";
  readonly params: Record<string, never>;
}

export interface WarehouseEntryDetailRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.entryDetail";
  readonly params: { readonly warehouseItemId: string };
}

export type DesktopGatewayRequestV1 =
  | AppSnapshotRequestV1
  | GatewayTaskListRequestV1
  | GatewayTaskGetRequestV1
  | GatewayTaskCancellationRequestV1
  | GatewayEnvironmentSnapshotRequestV1
  | GatewayDemoTaskRequestV1
  | ProductionStartInspectionRequestV1
  | ProductionGetInspectionRequestV1
  | ProductionRequestPlanRequestV1
  | ProductionGetPlanRequestV1
  | ProductionConfirmPlanRequestV1
  | ProductionRecoverRequestV1
  | ProductionGetBuildRecordRequestV1
  | CatalogListRequestV1
  | CatalogDetailRequestV1
  | CatalogStatusRequestV1
  | WarehouseListEntriesRequestV1
  | WarehouseEntryDetailRequestV1;

/** 方法 → 应用语义:Kernel 路由用;未知方法返回 undefined */
export const DESKTOP_GATEWAY_METHOD_KINDS = {
  "app.snapshot": "query",
  "task.list": "query",
  "task.get": "query",
  "task.requestCancellation": "command",
  "environment.getSnapshot": "query",
  "task.startDemo": "command",
  "production.startInspection": "command",
  "production.getInspection": "query",
  "production.requestPlan": "command",
  "production.getPlan": "query",
  "production.confirmPlan": "command",
  "production.recover": "command",
  "production.getBuildRecord": "query",
  "catalog.list": "query",
  "catalog.detail": "query",
  "catalog.status": "query",
  "warehouse.listEntries": "query",
  "warehouse.entryDetail": "query",
} as const satisfies Readonly<Record<string, "query" | "command">>;

export type DesktopGatewayMethodV1 = keyof typeof DESKTOP_GATEWAY_METHOD_KINDS;

/**
 * 各方法的成功返回值:应用契约值原样透传,外加 Kernel 派生的 app.snapshot。
 */
export type DesktopGatewaySuccessValueV1 = AppSnapshotV1 | ApplicationSuccessValueV01;

/**
 * Gateway 错误:Kernel 自身的三种失败用 code + messageKey;Provider 的应用
 * 错误原样透传(code = "application"),本地化与重试判定引用 AppErrorV01 原值。
 */
export type DesktopGatewayErrorV1 =
  | {
      readonly code: "invalid_request" | "unsupported_method" | "internal";
      readonly messageKey: string;
    }
  | {
      readonly code: "application";
      readonly application: AppErrorV01;
    };

export type DesktopGatewayResponseV1 =
  | {
      readonly schemaVersion: 1;
      readonly requestId: string;
      readonly ok: true;
      readonly value: DesktopGatewaySuccessValueV1;
    }
  | {
      readonly schemaVersion: 1;
      readonly requestId: string;
      readonly ok: false;
      readonly error: DesktopGatewayErrorV1;
    };

/** 事件订阅面:Provider 的类型化应用事件经 Kernel 广播到全部本地来源窗口 */
export interface DesktopGatewayEventsApiV1 {
  subscribe(listener: (event: ApplicationEventV01) => void): () => void;
}

export interface DesktopGatewayApiV1 {
  readonly version: 1;
  invoke(request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1>;
}

export interface DesktopWindowApiV1 {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
}

/**
 * 素材来源选取对话框(生产用例契约草案"双素材入口":文件选择经 Kernel 的
 * 显式对话框动作完成,Renderer 不持文件系统句柄)。Kernel 保存选取结果并
 * 只回发不透明 refId 与展示名;路径在 Kernel 侧解析后随应用请求交给 Provider。
 */
export type MaterialSourceIntakeV1 = "direct_unity_package" | "local_reusable_vpm";

export interface PickedMaterialSourceV1 {
  /** 不透明引用:Kernel 侧映射到真实路径;Renderer 只透传 */
  readonly refId: string;
  readonly displayName: string;
}

export interface DesktopDialogApiV1 {
  /** 用户取消或无宿主时返回 null */
  pickMaterialSource(intake: MaterialSourceIntakeV1): Promise<PickedMaterialSourceV1 | null>;
}

// ---- 远程内容窄面(F4 隔离浏览):Renderer 只发语义动作,不持任何 Electron
// 对象;远程页面本身无 preload、无 Node、无本地 Gateway(隔离红线见
// docs/architecture/desktop_ZH:Main 持有 Session/WebContentsView,Cookie 与
// 下载令牌永不进渲染层) ----

/** 远程内容视图状态(动作返回值;地址栏/前进后退 UI 的输入) */
export interface RemoteContentViewStateV1 {
  readonly viewId: string;
  readonly url: string;
  readonly visible: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

/** 远程内容事件(Main → 本地渲染层;违规透明上报,不静默吞掉) */
export type RemoteContentEventV1 =
  | { readonly kind: "view-opened"; readonly viewId: string; readonly url: string }
  | {
      readonly kind: "navigated";
      readonly viewId: string;
      readonly url: string;
      readonly canGoBack: boolean;
      readonly canGoForward: boolean;
    }
  | { readonly kind: "view-closed"; readonly viewId: string }
  | {
      readonly kind: "blocked";
      readonly viewId: string;
      readonly url: string;
      readonly reason:
        | "origin_not_allowed"
        | "download_denied"
        | "popup_denied"
        | "permission_denied";
    };

export interface RemoteContentApiV1 {
  /** 打开远程视图并加载 URL;来源不在允许清单时以错误拒绝 */
  open(request: { readonly url: string }): Promise<RemoteContentViewStateV1>;
  navigate(viewId: string, url: string): Promise<RemoteContentViewStateV1>;
  close(viewId: string): Promise<void>;
  setVisible(viewId: string, visible: boolean): Promise<RemoteContentViewStateV1>;
  events: { subscribe(listener: (event: RemoteContentEventV1) => void): () => void };
}

export interface VuaDesktopApiV1 {
  readonly gateway: DesktopGatewayApiV1;
  readonly events: DesktopGatewayEventsApiV1;
  readonly dialog: DesktopDialogApiV1;
  readonly window: DesktopWindowApiV1;
  readonly remoteContent: RemoteContentApiV1;
}

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

const REQUEST_KEYS = ["schemaVersion", "requestId", "method", "params"] as const;

export function isDesktopGatewayRequestV1(value: unknown): value is DesktopGatewayRequestV1 {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== DESKTOP_GATEWAY_VERSION) return false;
  if (typeof value.requestId !== "string" || value.requestId.length < 1 || value.requestId.length > 128) {
    return false;
  }
  if (!isRecord(value.params)) return false;

  switch (value.method) {
    case "app.snapshot":
    case "task.list":
    case "environment.getSnapshot":
      return hasExactKeys(value, REQUEST_KEYS) && hasExactKeys(value.params, []);
    case "task.get":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["taskId"])
        && isIdentifier(value.params.taskId);
    case "task.requestCancellation":
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      if (!hasExactKeys(value.params, ["taskId", "commandId"])) {
        // observedRevision 可选:允许 { taskId, commandId, observedRevision }
        const keys = Object.keys(value.params).sort();
        if (
          keys.length !== 3
          || keys[0] !== "commandId"
          || keys[1] !== "observedRevision"
          || keys[2] !== "taskId"
        ) {
          return false;
        }
      }
      return isIdentifier(value.params.taskId)
        && isIdentifier(value.params.commandId)
        && (value.params.observedRevision === undefined || isNonNegativeInteger(value.params.observedRevision));
    case "task.startDemo":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["commandId"])
        && isIdentifier(value.params.commandId);
    case "production.startInspection":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["materialRefId", "commandId"])
        && isIdentifier(value.params.materialRefId)
        && isIdentifier(value.params.commandId);
    case "production.getInspection":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["inspectionId"])
        && isIdentifier(value.params.inspectionId);
    case "production.requestPlan":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["inspectionId", "commandId"])
        && isIdentifier(value.params.inspectionId)
        && isIdentifier(value.params.commandId);
    case "production.getPlan":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["planId"])
        && isIdentifier(value.params.planId);
    case "production.confirmPlan":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["planId", "commandId", "observedRevision"])
        && isIdentifier(value.params.planId)
        && isIdentifier(value.params.commandId)
        && isNonNegativeInteger(value.params.observedRevision);
    case "production.recover": {
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      const recoveryParams = value.params as Record<string, unknown>;
      if (!isIdentifier(recoveryParams.taskId) || !isIdentifier(recoveryParams.commandId)) {
        return false;
      }
      if (recoveryParams.decision !== "continue" && recoveryParams.decision !== "rollback") {
        return false;
      }
      // 可选上下文字段存在时必须是字符串
      for (const optionalField of ["planTaskId", "sourceFolder", "projectRoot", "artifactOutputRoot", "confirmedAt", "riskChoice"] as const) {
        const fieldValue = recoveryParams[optionalField];
        if (fieldValue !== undefined && typeof fieldValue !== "string") return false;
      }
      if (recoveryParams.rememberForSession !== undefined && typeof recoveryParams.rememberForSession !== "boolean") {
        return false;
      }
      return true;
    }
    case "production.getBuildRecord":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["buildRecordId"])
        && isIdentifier(value.params.buildRecordId);
    case "catalog.list": {
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      const listParams = value.params as CatalogListRequestV1["params"];
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
    case "catalog.detail":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["productId"])
        && typeof value.params.productId === "string"
        && /^booth:[0-9]+$/.test(value.params.productId);
    case "catalog.status":
    case "warehouse.listEntries":
      return hasExactKeys(value, REQUEST_KEYS) && hasExactKeys(value.params, []);
    case "warehouse.entryDetail":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["warehouseItemId"])
        && isIdentifier(value.params.warehouseItemId);
    default:
      return false;
  }
}

export function requestByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
