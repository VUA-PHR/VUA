import type {
  AppErrorV01,
  ApplicationEventV01,
  ApplicationSuccessValueV01,
  CatalogAvailabilityStatusV03,
  ProductionModeV02,
  ProductionRiskChoiceV02,
  WarehouseArtifactModeV03,
  ImportCopyPhaseV01,
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

// ---- production.*(amf-production v0.2 登记面:渲染层面不变的部分保持原样;
// requestPlan 增 mode、confirmPlan 增 riskChoice/rememberForSession、recover
// 瘦身为语义选择——路径与项目身份由 Kernel 经 startInspection 一次性转交,
// decisionId 由 Kernel 受理时生成,渲染层均不可见) ----

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
  readonly params: {
    readonly inspectionId: string;
    readonly commandId: string;
    /** 双素材入口的真实用户决策(渲染层从已选素材的 intake 透传) */
    readonly mode: ProductionModeV02;
  };
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
    readonly observedRevision: number;
    /** 风险决策(v0.2 必填:计划审阅的风险决策控件) */
    readonly riskChoice: ProductionRiskChoiceV02;
    readonly rememberForSession?: boolean;
  };
}

export interface ProductionRecoverRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "production.recover";
  readonly params: {
    /** 原始失败任务(恢复绑定对象) */
    readonly taskId: string;
    /** 只携带语义选择;decisionId 由 Kernel 受理时生成并绑定 */
    readonly decision: "continue" | "rollback";
    readonly commandId: string;
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
    readonly availabilityStatus?: CatalogAvailabilityStatusV03 | null;
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

/** 渲染层"重试"入口(任务级动作):AMF 以冻结重试策略裁决 */
export interface DownloadRetryRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "download.retry";
  readonly params: { readonly taskId: string; readonly commandId: string };
}

/** 产物模式三命令入口(bdl-commands v0.1,proposal 005):任务级动作经 AMF */
export interface WarehouseSetArtifactModeRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.setArtifactMode";
  readonly params: {
    readonly warehouseItemId: string;
    /** null = 清除条目级覆盖,回落「覆盖 ?? 全局默认」动态解析 */
    readonly mode: WarehouseArtifactModeV03 | null;
    readonly commandId: string;
  };
}

export interface WarehouseGenerateVpmRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.generateVpm";
  readonly params: { readonly warehouseItemId: string; readonly commandId: string };
}

export interface WarehouseDeleteOriginalsRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.deleteOriginals";
  readonly params: { readonly warehouseItemId: string; readonly commandId: string };
}
/** 全局默认产物模式写入口(bdl-commands v0.2 全局层,W14/W15) */
export interface WarehouseSetGlobalDefaultModeRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.setGlobalDefaultMode";
  readonly params: { readonly mode: WarehouseArtifactModeV03; readonly commandId: string };
}
// ---- production-use-case v0.2 (W20 ten-method freeze, W24 workbench; document
// bodies carried as Record<string, unknown>, contract face does not duplicate
// document schemas) ----
export interface RecipeSaveRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "recipe.save";
  readonly params: { readonly recipeDocument: Record<string, unknown>; readonly baseRevision: number };
}

export interface RecipeGetRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "recipe.get";
  readonly params: { readonly recipeId: string };
}

export interface RecipeListRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "recipe.list";
  readonly params: ProductionListParamsV1;
}

export interface RecipeResolveRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "recipe.resolve";
  readonly params: { readonly recipeId: string; readonly revision?: number };
}

export interface PlanApproveRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "plan.approve";
  readonly params: { readonly planId: string };
}

export interface PlanGetRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "plan.get";
  readonly params: { readonly planId: string };
}

export interface PlanListRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "plan.list";
  readonly params: ProductionListParamsV1 & { readonly recipeId?: string };
}

export interface JobExecuteRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "job.execute";
  readonly params: { readonly planId: string };
}

export interface RecordGetRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "record.get";
  readonly params: { readonly buildId: string };
}

export interface RecordListRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "record.list";
  readonly params: ProductionListParamsV1 & { readonly recipeId?: string };
}
/** project.import-copy 副本导入入口(014 语义冻结;F6 确认链;plan/apply 两段) */
export interface ProjectImportCopyRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "project.import-copy";
  readonly params: {
    readonly phase: ImportCopyPhaseV01;
    readonly sourcePath: string;
    readonly targetParentDirectory: string;
    readonly targetProjectName: string;
    readonly confirmedPlanDigest?: string;
  };
}
/** warehouse.import 批量导入入口(bdl-commands v0.3,W19) */
/** production-use-case v0.2 read-face pagination/filter closed set (011 section 7) */
export interface ProductionListParamsV1 {
  readonly text?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly recipeId?: string;
}
export interface WarehouseImportRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.import";
  readonly params: { readonly sourceFolders: readonly string[]; readonly commandId: string };
}

/** warehouse.importDownloads 下载采纳入口(bdl-commands v0.4,IMP-3):仅身份 */
export interface WarehouseImportDownloadsRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "warehouse.importDownloads";
  readonly params: { readonly downloadIds: readonly string[]; readonly commandId: string };
}

/** downloads.listCompleted 可采纳下载列表查询(bdl-queries v0.4,IMP-2 批 B) */
export interface DownloadsListCompletedRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "downloads.listCompleted";
  readonly params: Readonly<Record<string, never>>;
}

/** project.environmentManagers 查询入口(013 读面第一翼,核心 e720544);
 *  快照本体以 envelope 强度透传(UI 按需窄化) */
export interface ProjectEnvironmentManagersRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "project.environmentManagers";
  readonly params: Readonly<Record<string, never>>;
}

export interface ProjectListProjectsRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "project.listProjects";
  readonly params: Readonly<Record<string, never>>;
}

export interface ProjectInspectProjectRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "project.inspectProject";
  readonly params: { readonly projectPath: string };
}

export interface ProjectLockStatusRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "project.lockStatus";
  readonly params: { readonly projectPath: string };
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
  | WarehouseEntryDetailRequestV1
  | DownloadRetryRequestV1
  | WarehouseSetArtifactModeRequestV1
  | WarehouseGenerateVpmRequestV1
  | WarehouseDeleteOriginalsRequestV1
  | WarehouseSetGlobalDefaultModeRequestV1
  | WarehouseImportRequestV1
  | WarehouseImportDownloadsRequestV1
  | DownloadsListCompletedRequestV1
  | ProjectEnvironmentManagersRequestV1
  | ProjectListProjectsRequestV1
  | ProjectInspectProjectRequestV1
  | ProjectLockStatusRequestV1
  | RecipeSaveRequestV1
  | RecipeGetRequestV1
  | RecipeListRequestV1
  | RecipeResolveRequestV1
  | PlanApproveRequestV1
  | PlanGetRequestV1
  | PlanListRequestV1
  | JobExecuteRequestV1
  | RecordGetRequestV1
  | RecordListRequestV1
  | ProjectImportCopyRequestV1;

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
  "downloads.listCompleted": "query",
  "project.environmentManagers": "query",
  "project.listProjects": "query",
  "project.inspectProject": "query",
  "project.lockStatus": "query",
  "download.retry": "command",
  "warehouse.setArtifactMode": "command",
  "warehouse.generateVpm": "command",
  "warehouse.deleteOriginals": "command",
  "warehouse.setGlobalDefaultMode": "command",
  "warehouse.import": "command",
  "warehouse.importDownloads": "command",
  "recipe.save": "command",
  "recipe.resolve": "command",
  "plan.approve": "command",
  "job.execute": "command",
  "recipe.get": "query",
  "recipe.list": "query",
  "plan.get": "query",
  "plan.list": "query",
  "record.get": "query",
  "record.list": "query",
  "project.import-copy": "command",
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
  /** 仓储导入文件夹多选(W18,bdl-commands v0.3 warehouse.import 的本地拾取面):
   *  openDirectory + multiSelections;用户取消或空选返回 null;本进程不做任何
   *  文件操作,路径交渲染层经 warehouse.import 提交 */
  pickWarehouseFolders(): Promise<readonly string[] | null>;
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
  /** 视图内导航历史动作(内嵌固定导航条;未知视图以错误拒绝):后退/前进
   *  仅在历史可走时移动,刷新重载当前地址。历史成员在此前导航时已经过
   *  Main 侧导航策略,本面不做二次来源裁决 */
  goBack(viewId: string): Promise<RemoteContentViewStateV1>;
  goForward(viewId: string): Promise<RemoteContentViewStateV1>;
  reload(viewId: string): Promise<RemoteContentViewStateV1>;
  close(viewId: string): Promise<void>;
  setVisible(viewId: string, visible: boolean): Promise<RemoteContentViewStateV1>;
  events: { subscribe(listener: (event: RemoteContentEventV1) => void): () => void };
}

/** 壳能力自报(桌面壳静态声明;proposal 015 §11 仲裁方案 a):能力拥有者
 *  (Electron 壳)自报,不经 provider 转述——远程 web 内容隔离于桌面壳内,
 *  其能力报告不属于 provider capability 面。 */
export interface DesktopCapabilitiesV1 {
  /** Main 基座(remote-content + U9 四分法导航策略)在位;内嵌浏览呈现
   *  两态判据据此驱动(端到端可用才翻转呈现,desktop 架构 1.1.0) */
  readonly remoteBrowser: boolean;
}

/** 导航确认缘由(U9 四分法):清单外 http/https 页(提示后放行转内嵌视图)
 *  与外部协议(确认后交系统打开)——确认层唯一两个进入点 */
export type NavConfirmReasonV1 = "origin_not_allowed" | "external_protocol";

/** 导航确认请求(Main → 渲染层;U9(1)/(3) 确认前在,015 §12 对接设计):
 *  confirmId 由 Main 生成,渲染层只能回应已发出的确认 */
export interface NavigationConfirmRequestV1 {
  readonly confirmId: string;
  readonly url: string;
  readonly reason: NavConfirmReasonV1;
}

export interface DesktopNavigationConfirmApiV1 {
  /** 对已发出的确认作答;未知 confirmId 与重复作答被 Main 忽略 */
  respond(confirmId: string, approved: boolean): Promise<void>;
  events: {
    subscribe(listener: (request: NavigationConfirmRequestV1) => void): () => void;
  };
}

export interface VuaDesktopApiV1 {
  readonly gateway: DesktopGatewayApiV1;
  readonly events: DesktopGatewayEventsApiV1;
  readonly dialog: DesktopDialogApiV1;
  readonly window: DesktopWindowApiV1;
  readonly remoteContent: RemoteContentApiV1;
  readonly capabilities: DesktopCapabilitiesV1;
  readonly navigationConfirm: DesktopNavigationConfirmApiV1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** production-use-case v0.2 列表参数闭集(011 §7:可选键 text/limit/offset/
 *  recipeId;词表外键或类型不符 = invalid_params 同源判定) */
function isProductionListParamsV1(params: Record<string, unknown>): boolean {
  for (const key of Object.keys(params)) {
    if (key === "text") {
      if (typeof params.text !== "string") return false;
    } else if (key === "limit" || key === "offset") {
      if (typeof params[key] !== "number") return false;
    } else if (key === "recipeId") {
      if (typeof params.recipeId !== "string" || params.recipeId.length < 1) return false;
    } else {
      return false;
    }
  }
  return true;
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

const PRODUCTION_MODES_V02: readonly string[] = ["direct_unity_package", "local_reusable_vpm"];
const PRODUCTION_RISK_CHOICES_V02: readonly string[] = [
  "snapshot_and_continue",
  "continue",
  "cancel",
  "not_required",
];

function isProductionModeV02(value: unknown): boolean {
  return typeof value === "string" && PRODUCTION_MODES_V02.includes(value);
}

function isProductionRiskChoiceV02(value: unknown): boolean {
  return typeof value === "string" && PRODUCTION_RISK_CHOICES_V02.includes(value);
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
        && hasExactKeys(value.params, ["inspectionId", "commandId", "mode"])
        && isIdentifier(value.params.inspectionId)
        && isIdentifier(value.params.commandId)
        && isProductionModeV02(value.params.mode);
    case "production.getPlan":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["planId"])
        && isIdentifier(value.params.planId);
    case "production.confirmPlan": {
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      const confirmParams = value.params as Record<string, unknown>;
      const confirmKeys = Object.keys(confirmParams).sort();
      const confirmExpected = ["commandId", "observedRevision", "planId", "rememberForSession", "riskChoice"];
      if (confirmKeys.length !== 4 && confirmKeys.length !== 5) return false;
      if (!confirmKeys.every((key) => confirmExpected.includes(key))) return false;
      if (!isIdentifier(confirmParams.planId) || !isIdentifier(confirmParams.commandId)) return false;
      if (typeof confirmParams.observedRevision !== "number"
        || !Number.isSafeInteger(confirmParams.observedRevision)
        || confirmParams.observedRevision < 1) {
        return false;
      }
      if (!isProductionRiskChoiceV02(confirmParams.riskChoice)) return false;
      return confirmParams.rememberForSession === undefined
        || typeof confirmParams.rememberForSession === "boolean";
    }
    case "production.recover":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["taskId", "decision", "commandId"])
        && isIdentifier(value.params.taskId)
        && isIdentifier(value.params.commandId)
        && (value.params.decision === "continue" || value.params.decision === "rollback");
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
    case "downloads.listCompleted":
    case "project.environmentManagers":
      return hasExactKeys(value, REQUEST_KEYS) && hasExactKeys(value.params, []);
    case "project.listProjects":
      return hasExactKeys(value, REQUEST_KEYS) && hasExactKeys(value.params, []);
    case "project.inspectProject":
    case "project.lockStatus":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["projectPath"])
        && isIdentifier(value.params.projectPath);
    case "warehouse.entryDetail":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["warehouseItemId"])
        && isIdentifier(value.params.warehouseItemId);
    case "download.retry":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["taskId", "commandId"])
        && isIdentifier(value.params.taskId)
        && isIdentifier(value.params.commandId);
    case "warehouse.setArtifactMode":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["warehouseItemId", "mode", "commandId"])
        && isIdentifier(value.params.warehouseItemId)
        && (value.params.mode === null
          || value.params.mode === "use_original_unitypackage"
          || value.params.mode === "generate_vpm")
        && isIdentifier(value.params.commandId);
    case "warehouse.generateVpm":
    case "warehouse.deleteOriginals":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["warehouseItemId", "commandId"])
        && isIdentifier(value.params.warehouseItemId)
        && isIdentifier(value.params.commandId);
    // bdl-commands v0.2 全局层(W14):同步写面,回执为 BDL 读回事实
    case "warehouse.setGlobalDefaultMode":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["mode", "commandId"])
        && (value.params.mode === "use_original_unitypackage"
          || value.params.mode === "generate_vpm")
        && isIdentifier(value.params.commandId);
    // bdl-commands v0.3 导入(W19):非空字符串数组
    case "warehouse.import":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["sourceFolders", "commandId"])
        && Array.isArray(value.params.sourceFolders)
        && value.params.sourceFolders.length > 0
        && value.params.sourceFolders.every(
          (folder: unknown) => typeof folder === "string" && folder.length > 0)
        && isIdentifier(value.params.commandId);
    // bdl-commands v0.4 下载采纳(IMP-3):仅身份,非空字符串数组
    case "warehouse.importDownloads":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["downloadIds", "commandId"])
        && Array.isArray(value.params.downloadIds)
        && value.params.downloadIds.length > 0
        && value.params.downloadIds.every(
          (downloadId: unknown) => typeof downloadId === "string" && downloadId.length > 0)
        && isIdentifier(value.params.commandId);
    // production-use-case v0.2(W20 十方法冻结件):文档本体以 object 承载,
    // 词表闭集照冻结面
    case "recipe.save":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["recipeDocument", "baseRevision"])
        && typeof value.params.recipeDocument === "object"
        && value.params.recipeDocument !== null
        && typeof value.params.baseRevision === "number";
    case "recipe.get":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["recipeId"])
        && isIdentifier(value.params.recipeId);
    case "recipe.list":
    case "plan.list":
    case "record.list":
      return hasExactKeys(value, REQUEST_KEYS) && isProductionListParamsV1(value.params);
    case "recipe.resolve":
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      if (!hasExactKeys(value.params, ["recipeId"])) {
        const keys = Object.keys(value.params).sort();
        if (keys.length !== 2 || keys[1] !== "revision") return false;
      }
      return isIdentifier(value.params.recipeId)
        && (value.params.revision === undefined || typeof value.params.revision === "number");
    case "plan.approve":
    case "plan.get":
    case "job.execute":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["planId"])
        && isIdentifier(value.params.planId);
    case "record.get":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["buildId"])
        && isIdentifier(value.params.buildId);
    // 014 副本导入(F6 确认链;plan/apply 两段;apply 强制 confirmedPlanDigest)
    case "project.import-copy":
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      if (!hasExactKeys(value.params, ["phase", "sourcePath", "targetParentDirectory", "targetProjectName"])) {
        const keys = Object.keys(value.params).sort();
        if (keys.length !== 5 || keys[0] !== "confirmedPlanDigest") return false;
      }
      return (value.params.phase === "plan" || value.params.phase === "apply")
        && isIdentifier(value.params.sourcePath)
        && isIdentifier(value.params.targetParentDirectory)
        && isIdentifier(value.params.targetProjectName)
        && (value.params.confirmedPlanDigest === undefined
          || isIdentifier(value.params.confirmedPlanDigest));
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
