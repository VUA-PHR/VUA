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

/**
 * 任务终态结果载荷（BOARD #22 result 回流增量，2026-09-12）：任务正常完成
 * （succeeded / succeeded_with_warnings）时任务实际交回的 Done payload 原样。
 * 快照面对其内部形状零承诺——形状由产出该任务的操作词表定义并随其演进
 * （project-ops 族载荷自描述 schemaVersion/operation；production 族载荷形状
 * 归 production-use-case 词表），快照面演进与操作词表演进解耦。
 * 与 `task.completed` 事件的 `payload` 同源同值（同一任务存储投影）；
 * failed / cancelled / 非终态 / inspect_required 快照恒不带本字段，
 * 失败事实走既有 `error` 字段。
 */
export interface TaskDonePayloadV01 {
  readonly [key: string]: unknown;
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
  readonly result?: TaskDonePayloadV01;
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

// ---- production.*(amf-production v0.2 登记面:七方法参数/响应/文档面与
// schemas/amf-production/v0.2/methods 七份 Schema 逐字段一致,与 Rust
// provider_host 及固定向量三处同批;路径与项目身份由 Kernel 经
// startInspection 一次性转交,此后不再出现在请求面) ----

/** 风险决策四枚举($defs.riskChoice;B 侧 RiskDecisionChoice 为权威词表) */
export type ProductionRiskChoiceV02 =
  | "snapshot_and_continue"
  | "continue"
  | "cancel"
  | "not_required";

/** 双素材模式($defs.mode;与素材 intake 词表一致,requestPlan 携带) */
export type ProductionModeV02 = "direct_unity_package" | "local_reusable_vpm";

/** 恢复决定($defs.decision) */
export type ProductionDecisionV02 = "continue" | "rollback";

/** 工作流阶段($defs.workflowStage;unity-bridge 词表) */
export type ProductionWorkflowStageV02 =
  | "inspect"
  | "snapshot"
  | "execute"
  | "validate"
  | "completed";

/** 检查发现与计划风险共用形状(kind 闭集 + recoverable/retryable 标注) */
export interface ProductionFindingV02 {
  readonly kind: "compat" | "missing" | "conflict";
  readonly summary: string;
  readonly recoverable: boolean;
  readonly retryable: boolean;
}

/** 可计划性结论(由应用层给出,前端不推断) */
export type ProductionPlannabilityV02 = "plannable" | "needs_attention" | "not_plannable";

/** 检查文档(C1 文档面:get-inspectionResult.inspection) */
export interface InspectionDocumentV02 {
  readonly inspectionId: string;
  readonly inspectedAt: string;
  readonly displayName: string;
  readonly sourceFingerprint: string;
  readonly riskFingerprint: string;
  readonly packages: readonly {
    readonly relativePath: string;
    readonly sizeBytes: number;
    readonly sha256: string;
  }[];
  readonly findings: readonly ProductionFindingV02[];
  readonly plannability: ProductionPlannabilityV02;
}

/** 计划文档(C1 文档面:get-planResult.plan;diffs 条目 Schema 留开) */
export interface PlanDocumentV02 {
  readonly planId: string;
  readonly revision: number;
  readonly inspectionId: string;
  readonly mode: ProductionModeV02;
  readonly projectId: string;
  readonly projectFingerprint: string;
  readonly stages: readonly ProductionWorkflowStageV02[];
  readonly riskDecisionRequired: boolean;
  readonly risks: readonly ProductionFindingV02[];
  readonly diffs: readonly Record<string, unknown>[];
  readonly estimatedDurationMs: number | null;
}

/** 构建记录权威状态五态(build_record v0.2) */
export type BuildRecordStatusV02 =
  | "succeeded"
  | "succeeded_with_warnings"
  | "failed"
  | "cancelled"
  | "recovered";

/** evidenceSummary 四节(快照 / Bridge 作业 / 本地 VPM / 验证;未尝试节 null 锚) */
export interface BuildRecordEvidenceSummaryV02 {
  readonly snapshot: { readonly attempted: boolean; readonly succeeded: boolean | null };
  readonly bridge: {
    readonly jobsRun: number;
    readonly allSucceeded: boolean | null;
    readonly lastOperation: string | null;
  };
  readonly localVpm: {
    readonly attempted: boolean;
    readonly published: boolean | null;
    readonly packageId: string | null;
  };
  readonly validation: { readonly status: "passed" | "failed" | "skipped" };
}

/** 构建记录 v0.2 文档(get-build-recordResult.buildRecord;表现安全投影) */
export interface BuildRecordDocumentV02 {
  readonly recordId: string;
  readonly taskId: string;
  readonly planId: string;
  readonly mode: ProductionModeV02;
  readonly status: BuildRecordStatusV02;
  readonly stages: readonly ProductionWorkflowStageV02[];
  readonly evidenceSummary: BuildRecordEvidenceSummaryV02;
  readonly restoreAttempted: boolean;
  readonly restoreSucceeded: boolean | null;
  readonly startedAt: string;
  readonly finishedAt: string;
}

/** 命令受理回执(与 provider_host 同形:{ contractVersion, task }) */
export interface ProductionTaskStartedV02 {
  readonly contractVersion: ApplicationContractVersion;
  readonly task: TaskSnapshotV01;
}

export interface ProductionStartInspectionCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.startInspection";
  readonly commandId: string;
  readonly params: {
    readonly sourceFolder: string;
    readonly projectRoot: string;
    readonly artifactOutputRoot: string;
    readonly projectId: string;
  };
}

/** startInspection 成功值:任务 + 签发的检查域身份(insp- 前缀) */
export interface ProductionInspectionStartedV02 extends ProductionTaskStartedV02 {
  readonly inspectionId: string;
}

export interface ProductionGetInspectionQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "production.getInspection";
  readonly params: { readonly inspectionId: string };
}

/** 文档查询成功值:任务事实 + 内嵌文档 */
export interface ProductionInspectionViewV02 {
  readonly contractVersion: ApplicationContractVersion;
  readonly taskId: string;
  readonly state: string;
  readonly inspection: InspectionDocumentV02;
}

export interface ProductionRequestPlanCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.requestPlan";
  readonly commandId: string;
  readonly params: {
    readonly inspectionId: string;
    readonly mode: ProductionModeV02;
  };
}

/** requestPlan 成功值:任务 + 计划域身份(plan- 前缀)+ 确认绑定 revision */
export interface ProductionPlanIssuedV02 extends ProductionTaskStartedV02 {
  readonly planId: string;
  readonly revision: number;
}

export interface ProductionGetPlanQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "production.getPlan";
  readonly params: { readonly planId: string };
}

export interface ProductionPlanViewV02 {
  readonly contractVersion: ApplicationContractVersion;
  readonly taskId: string;
  readonly state: string;
  readonly plan: PlanDocumentV02;
}

export interface ProductionConfirmPlanCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.confirmPlan";
  readonly commandId: string;
  readonly params: {
    readonly planId: string;
    readonly observedRevision: number;
    readonly riskChoice: ProductionRiskChoiceV02;
    readonly rememberForSession?: boolean;
  };
}

export interface ProductionRecoverCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "production.recover";
  readonly commandId: string;
  readonly params: {
    readonly taskId: string;
    readonly decision: ProductionDecisionV02;
    readonly decisionId: string;
    readonly planId?: string;
  };
}

export interface ProductionGetBuildRecordQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "production.getBuildRecord";
  readonly params: { readonly buildRecordId: string };
}

export interface ProductionBuildRecordViewV02 {
  readonly contractVersion: ApplicationContractVersion;
  readonly buildRecord: BuildRecordDocumentV02;
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

/** downloads.listCompleted 查询(bdl-queries v0.4,015 §10 仲裁 A 形态):
 *  可采纳的已完成交付(折叠于 TransferDone＋暂存文件在场且尺寸相符),
 *  与 warehouse.importDownloads 采纳守卫同源同函数——行在列即可采纳 */
export interface DownloadsListCompletedQueryV04 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "downloads.listCompleted";
  readonly params: Readonly<Record<string, never>>;
}

/** project.environmentManagers 查询(013 读面第一翼,核心 e720544):只读
 *  VCC/ALCOM/编辑器检测快照(T-B 消费)。快照本体是文档型数据——照
 *  production-use-case 先例以 envelope 强度承载(Record),UI 按需窄化,
 *  契约面不复制快照 Schema(project-inspection v0.2 信封＋
 *  environment-managers v0.1 本体);剩余三查询(listProjects/inspectProject/
 *  lockStatus)待核心接线刀随批登记 */
export interface ProjectEnvironmentManagersQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "project.environmentManagers";
  readonly params: Readonly<Record<string, never>>;
}

/** environmentManagers 结果信封(021 桌面接线批对齐 wire 实际形态,零协议
 *  变更):外层 = project-inspection 查询信封(schemaVersion "0.1" +
 *  operation),内层 result 才是 environment-managers v0.1 快照本体——
 *  envelope 强度透传(字段语义归快照 Schema,UI 按需窄化;桌面此前误读
 *  信封顶层致 editors 呈现恒 '—',021 收敛点 1 如实修正) */
export interface ProjectEnvironmentManagersResultV01 {
  readonly schemaVersion: "0.1";
  readonly operation: "project.environmentManagers";
  readonly result: Record<string, unknown>;
}

/* ---- environment.verifyEditor(021 词表行,核心七点裁决 2026-09-13,
 *    schemas/editor-verify/v0.1,DRAFT 漂移由向量对表测试把守) ----
 * 分型 query(裁决②):带参只读验证,零状态变更、零任务化、同步请求-响应。
 * params 单字段闭集 {path}(裁决③):用户手选路径三形态(exe 文件本身 /
 * 版本化根 / Editor 目录)verbatim 透传,明示不设 maxLength;归一化是
 * 原语(editor_verify)职责,桌面层零本地归一化。 */

/** 信封 schemaVersion(钉子三:const "0.1",照 inspection-get 先例;核心域
 *  自有常量 EDITOR_VERIFY_SCHEMA_VERSION 的 TS 对应面,消费守卫以此钉死) */
export type EditorVerifySchemaVersionV01 = "0.1";

/** 分类四值闭集(核心 EditorClass serde snake_case,与 environment-managers
 *  v0.1 冻结 editorClass 枚举逐字同构,零新发明) */
export type EditorClassV01 =
  | "production_target"
  | "migration_source"
  | "other_unity_version"
  | "tuanjie_family";

/** 拒绝码闭集五码(vua.editor_verify.* 族,原语 codes 模块逐字)。拒绝 =
 *  正常发现,走 result 内态,绝不上浮应用错误信封(钉子一) */
export type EditorVerifyRefusalCodeV01 =
  | "vua.editor_verify.target_missing"
  | "vua.editor_verify.exe_missing"
  | "vua.editor_verify.identity_unreadable"
  | "vua.editor_verify.not_an_editor"
  | "vua.editor_verify.unsupported_platform";

/** 拒绝码闭集运行时面(渲染层收窄与消费测试按此数组对表,不自持字面量) */
export const EDITOR_REFUSAL_CODES_V01: readonly EditorVerifyRefusalCodeV01[] = [
  "vua.editor_verify.target_missing",
  "vua.editor_verify.exe_missing",
  "vua.editor_verify.identity_unreadable",
  "vua.editor_verify.not_an_editor",
  "vua.editor_verify.unsupported_platform",
];

/** 诚实缺席码(裁决⑤):仅路由未接线/原语不可达,绝不复用为验证拒绝。
 *  锚定核心域 pub 常量 ENVIRONMENT_VERIFY_UNAVAILABLE(provider-host 导出),
 *  TS 面以同名常量消费,不自持第二语义 */
export const ENVIRONMENT_VERIFY_UNAVAILABLE = "vua.environment.verify_unavailable";

export interface EnvironmentVerifyEditorQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "environment.verifyEditor";
  readonly params: { readonly path: string };
}

/** verdict:"verified" 分支(与原语 EditorPathIdentity 逐字同构 camelCase):
 *  身份来自可执行文件自身版本资源(门①:绝不信任路径名),editorRoot 仅为
 *  信息性记录 */
export interface EditorVerifyVerifiedV01 {
  readonly verdict: "verified";
  readonly editorRoot: string;
  readonly exePath: string;
  readonly version: string;
  readonly classification: EditorClassV01;
  readonly guidanceCode: string;
  readonly chinaDistribution: boolean;
  readonly schemaVersion: EditorVerifySchemaVersionV01;
}

/** verdict:"refused" 分支(与原语 EditorPathRefusal 逐字同构):detail 资源
 *  原文透传不解释(钉子二:wire 与桌面层均零加工,呈现原语发现) */
export interface EditorVerifyRefusedV01 {
  readonly verdict: "refused";
  readonly exePath: string | null;
  readonly code: EditorVerifyRefusalCodeV01;
  readonly detail: string;
  readonly schemaVersion: EditorVerifySchemaVersionV01;
}

/** 两态 tagged union(verdict 判别,裁决④) */
export type EnvironmentVerifyEditorResultV01 =
  | EditorVerifyVerifiedV01
  | EditorVerifyRefusedV01;

/* ---- 013 读面三查询(核心 5b65550 四查询全 live;envelope 强度承载——
 * projects/associations 本体是文档型数组,UI 按需窄化,契约面不复制
 * 快照 Schema;vuaIdentity 三态随行) ---- */

/** project.listProjects:管理器注册路径全量(缺席语义=诚实空数组) */
export interface ProjectListProjectsQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "project.listProjects";
  readonly params: Readonly<Record<string, never>>;
}

export interface ProjectListProjectsResultV01 {
  readonly schemaVersion: "vua.project-inspection/v0.2";
  readonly projects: readonly unknown[];
  readonly diagnostics: readonly unknown[];
}

/** project.inspectProject:仅对管理器注册路径可查;未注册=
 *  vua.project.project_not_found(messageKey errors.project.projectNotFound) */
export interface ProjectInspectProjectQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "project.inspectProject";
  readonly params: { readonly projectPath: string };
}

export interface ProjectInspectProjectResultV01 {
  readonly schemaVersion: "vua.project-inspection/v0.2";
  readonly path: string;
  readonly associations: readonly unknown[];
}

/** project.lockStatus:锁残留三态纯观察(永不取锁) */
export interface ProjectLockStatusQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "project.lockStatus";
  readonly params: { readonly projectPath: string };
}

export type ProjectLockMutationStatusV01 = "none" | "leftover" | "unreadable";

export interface ProjectLockStatusResultV01 {
  readonly schemaVersion: "vua.project-inspection/v0.2";
  readonly projectPath: string;
  readonly mutationStatus: ProjectLockMutationStatusV01;
}

/* ---- 024 P1 读面(packages-query v0.1,核心冻结批 2026-09-17;三域表态
 *  收敛:桌面 ab02215／环境 62b4989／集成第 70 批)。单方法只读:
 *  packages.listInstalled——已注册项目的已装包集合(VPM manifest＋lock
 *  投影)。projectPath 复用 013 注册身份,未注册 = 复用
 *  vua.project.project_not_found(同事实同码);P1 词面按三域表态刻意
 *  不带 P2 事实字段(source/versions/updateAvailable/latestVersion/
 *  changelogUrl/displayName),降级投影细则归桌面消费批 */

/** packages.listInstalled:单项目已装包清单(诚实空数组=零已装包) */
export interface PackagesListInstalledQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "packages.listInstalled";
  readonly params: { readonly projectPath: string };
}

/** 已装包行:仅 P1 事实源四字段中的三个(id/版本/直接依赖);字段闭集
 *  = 虚假断言防线(updateAvailable 等发明字段在 schema 即非法) */
export interface PackagesInstalledItemV01 {
  readonly packageId: string;
  readonly version: string;
  readonly dependencies: readonly string[];
}

export interface PackagesListInstalledResultV01 {
  readonly schemaVersion: "vua.packages-installed/v0.1";
  readonly projectPath: string;
  /** packageId 升序(冻结的确定性呈现事实);空数组 = 诚实空清单 */
  readonly packages: readonly PackagesInstalledItemV01[];
}

/* ---- 025 P2 读面(packages-repos＋packages-catalog v0.1,核心冻结批
 *  2026-09-17;表态程序收敛:环境提案 64bfe58／集成 7a50ce9／桌面
 *  0031004／核心裁决 bf78368)。两方法只读,按需查询粒度,零分页语义;
 *  全部错误码复用既有闭集,词面零新码。健康面 = P2 非目标(库面无事
 *  实载体);写面(启停/增删/刷新)归 013 R5 逐面独立提案不在此族 */

/** packages.listRepos:仓库订阅清单读面(订阅面为世界 = 用户配置事实,
 *  settings userRepos 数组顺序照实投影)。params 空闭集(全局配置面,
 *  非 per-project) */
export interface PackagesListReposQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "packages.listRepos";
  readonly params: Record<string, never>;
}

/** 订阅行:四标识/定位事实为可空字符串(null = 库面 Option 如实投影,
 *  本地目录仓库 url=null);cached 必带 = 逐仓库缓存命中事实(false =
 *  已订阅未刷新,其自身诚实状态,不隐藏不伪造成空目录)。行闭集 =
 *  虚假断言防线(health/status/lastRefreshed 等发明字段在 schema 即
 *  非法——健康面 P2 非目标) */
export interface PackagesRepoInfoV01 {
  readonly repoId: string | null;
  readonly name: string | null;
  readonly url: string | null;
  readonly localPath: string | null;
  readonly cached: boolean;
}

export interface PackagesListReposResultV01 {
  readonly schemaVersion: "vua.packages-repos/v0.1";
  /** 订阅面自身顺序 = 冻结的确定性呈现事实;空数组 = 诚实零订阅 */
  readonly repos: readonly PackagesRepoInfoV01[];
}

/** packages.packageCatalog:单包目录事实按需查询(选中工程上下文绑定;
 *  无全量目录投影、无分页语义)。packageId 词表外包 = 复用
 *  vua.vpm.no_matching_package(消费端呈现为独立空态非错误页) */
export interface PackagesPackageCatalogQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "packages.packageCatalog";
  readonly params: { readonly projectPath: string; readonly packageId: string };
}

/** 目录版本行:yanked = 仓库缓存携带事实(compatible = 按选中工程
 *  Unity 版本判定,null = 工程版本未知——null 不是不兼容) */
export interface PackagesCatalogVersionV01 {
  readonly version: string;
  readonly yanked: boolean;
  readonly compatible: boolean | null;
}

export interface PackagesPackageCatalogResultV01 {
  readonly schemaVersion: "vua.packages-catalog/v0.1";
  readonly projectPath: string;
  readonly packageId: string;
  /** null 呈现 = packageId 兼任显示名(P1 裁决 3),不冒充字段事实 */
  readonly displayName: string | null;
  /** 二态来源事实;桌面「已装」第三态 = 与 installed 组合,词面不合
   *  并来源与安装两事实 */
  readonly source: "repo" | "local";
  readonly installed: boolean;
  /** 冻结判定结论(存在严格更新的兼容版本);null = 判定未执行(本工
   *  程未安装或工程 Unity 版本未知)——缺席不是「无更新」,null 时消
   *  费端维持 P1 防线(更新 UI 不渲染,不以默认值填充) */
  readonly updateAvailable: boolean | null;
  /** 仓库缓存版本升序;local 来源 = 空数组(诚实空,非错误) */
  readonly versions: readonly PackagesCatalogVersionV01[];
}

/* ---- 025 v0.2 增量(内联裁决 2026-09-17:stale/cacheSourced 披露增
 *  量;收敛面 = 环境形状提案 A＋桌面表态第 5 条披露枝＋核心方向裁决 6)。
 *  v0.2 = 冻结 v0.1 result 恰加一个必带键 cacheSourced,其余零变动;冻
 *  结的 v0.1 词面绝不原地修订——backend 未采纳 v0.2 前继续应答 v0.1 族,
 *  盖戳族常量告知消费端应答的是哪个词面,永不猜测。command 面与 v0.1
 *  逐字节同形(PackagesPackageCatalogQueryV01 不变)。repos 族刻意无此
 *  字段:list_repos 零网络面,该事实恒为常量——恒常量信息字段不是事实,
 *  不设 wire 键 */
export interface PackagesPackageCatalogResultV02 {
  readonly schemaVersion: "vua.packages-catalog/v0.2";
  readonly projectPath: string;
  readonly packageId: string;
  /** null 呈现 = packageId 兼任显示名(P1 裁决 3),不冒充字段事实 */
  readonly displayName: string | null;
  /** 二态来源事实;桌面「已装」第三态 = 与 installed 组合 */
  readonly source: "repo" | "local";
  readonly installed: boolean;
  /** 冻结判定结论;null = 判定未执行——缺席不是「无更新」 */
  readonly updateAvailable: boolean | null;
  /** 仓库缓存版本升序;local 来源 = 空数组(诚实空,非错误) */
  readonly versions: readonly PackagesCatalogVersionV01[];
  /** 必带信息性降级披露事实:true = 本次结果经缓存降级路径(offline→
   *  load_cache,或在线 load 失败降级);false = 在线刷新 load 所得。
   *  信息性非失败:消费端呈现「缓存数据」标注,绝不渲染为失败,也绝不
   *  为无此字段的 v0.1 应答虚构标注 */
  readonly cacheSourced: boolean;
}

/** 单条可采纳下载(bdl-queries v0.4 冻结面镜像):仅传输事实＋采纳关联,
 *  路径永不过 wire;renderer 从不由此推导产品身份 */
export interface DownloadsListCompletedItemV04 {
  readonly downloadId: string;
  readonly sourceUrl: string;
  /** 服务端建议/派生文件名;端口未报告时 null */
  readonly suggestedFileName: string | null;
  readonly receivedBytes: number;
  readonly completedAt: string;
  /** 内容关联本下载的仓储条目(空 = 尚未采纳;写面不阻止重复采纳,呈现
   *  层以此标注已采纳) */
  readonly adoptedWarehouseItemIds: readonly string[];
}

export interface DownloadsListCompletedResultV04 {
  readonly downloads: readonly DownloadsListCompletedItemV04[];
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
  /** BOOTH 年龄限制原词(null = 无标注;与 bdl-queries v0.3 schema required 对齐) */
  readonly ageRestriction: string | null;
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

// ---- warehouse 写命令(bdl-commands v0.1 冻结业务词表的 TS 面,proposal 005;
//      wire 信封 schemaVersion/operation 由应用契约 response 层承载,镜像按
//      既有惯例剥除;稳定错误码词表见 docs/protocols/bdl-commands-v0.1_ZH.md) ----

/** setArtifactMode 的受理载荷即结果:条目级覆盖设置/清除后的查询期生效模式 */
export interface WarehouseSetArtifactModeResultV01 {
  readonly warehouseItemId: string;
  readonly effectiveMode: WarehouseArtifactModeV03;
}
/** setGlobalDefaultMode 的受理载荷即结果(bdl-commands v0.2 全局层,W14):
 *  从 BDL 读回的持久事实,非回显 */
export interface WarehouseSetGlobalDefaultModeResultV02 {
  readonly globalDefaultMode: WarehouseArtifactModeV03;
}
/** warehouse.import 的受理载荷(bdl-commands v0.3,W19):folder 批导入任务
 *  受理;逐 folder 进度与条目落成经任务面/读面,受理即任务身份 */
export interface WarehouseImportAcceptedV03 {
  readonly taskId: string;
  readonly correlationId: string;
}

/** warehouse.importDownloads 的受理载荷(bdl-commands v0.4,IMP-3):下载
 *  采纳任务受理;逐下载进度与 downloaded_material 条目身份经任务面/读面 */
export interface WarehouseImportDownloadsAcceptedV04 {
  readonly taskId: string;
  readonly correlationId: string;
}

/** 任务化维护命令的受理载荷(generateVpm / deleteOriginals 共用) */
export interface WarehouseMaintenanceAcceptedV01 {
  readonly taskId: string;
  readonly correlationId: string;
}

/** generateVpm 完成载荷(经任务面投递;任务面通道由核心 provider-host 登记时接线) */
export interface WarehouseGenerateVpmCompletionV01 {
  readonly correlationId: string;
  readonly warehouseItemId: string;
  readonly packageId: string;
  readonly archiveRelativePath: string;
  /** 发布档案内容身份(sha256:…) */
  readonly archiveSha256: string;
}

/** deleteOriginals 完成载荷(审计性破坏操作;经任务面投递,通道同上) */
export interface WarehouseDeleteOriginalsCompletionV01 {
  readonly correlationId: string;
  readonly warehouseItemId: string;
  readonly deletedCount: number;
  readonly deletedRelativePaths: readonly string[];
  /** 保留的生成副本内容身份(sha256:…),删除守卫依赖它校验后才执行 */
  readonly keptGeneratedSha256: string;
}

export interface WarehouseSetArtifactModeCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "warehouse.setArtifactMode";
  readonly commandId: string;
  readonly params: {
    readonly warehouseItemId: string;
    /** null = 清除条目级覆盖,回落「覆盖 ?? 全局默认」动态解析 */
    readonly mode: WarehouseArtifactModeV03 | null;
  };
}

export interface WarehouseGenerateVpmCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "warehouse.generateVpm";
  readonly commandId: string;
  readonly params: {
    readonly warehouseItemId: string;
    /** v0.3 词表镜像(proposal 010 承诺 6):仅导入编排的自动生成携带;手动
     *  发起恒不携带——渲染层面从不设置该字段,守卫接受 1~2 键 */
    readonly importCorrelationId?: string;
  };
}

export interface WarehouseDeleteOriginalsCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "warehouse.deleteOriginals";
  readonly commandId: string;
  readonly params: { readonly warehouseItemId: string };
}
/** 全局默认产物模式写命令(bdl-commands v0.2 全局层,W14/W15):同步写 BDL
 *  bdl_meta;无 null——全局默认恒有值,缺/null/词表外 = 参数违反 */
export interface WarehouseSetGlobalDefaultModeCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "warehouse.setGlobalDefaultMode";
  readonly commandId: string;
  readonly params: { readonly mode: WarehouseArtifactModeV03 };
}
/** warehouse.import 批量导入命令(bdl-commands v0.3,W19):folder 批一次提交;
 *  非空数组、绝对路径语义由服务端裁决;导入编排内的自动生成挂点在任务内
 *  (010 路径 A) */
export interface WarehouseImportCommandV03 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "warehouse.import";
  readonly commandId: string;
  readonly params: { readonly sourceFolders: readonly string[] };
}

/** warehouse.importDownloads 下载采纳命令(bdl-commands v0.4,IMP-3):只携
 *  带端口下载身份——暂存路径/大小/文件名是 BDL 下载事件日志的服务端事实,
 *  永不是请求字段或客户端断言;采纳=复制落库为 downloaded_material 条目,
 *  非空数组;一次命令=一个采纳任务(逐下载进度) */
export interface WarehouseImportDownloadsCommandV04 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "warehouse.importDownloads";
  readonly commandId: string;
  readonly params: { readonly downloadIds: readonly string[] };
}


// ---- production-use-case v0.2(W20 十方法冻结件,核心 4849958;W24 工作台消费) ----
// 命令/读面词表按冻结 Schema 镜像;文档本体(recipe/plan/record)在 TS 面以
// Record<string, unknown> 承载(UI 内按需窄化,契约面不复制文档 Schema)。

/** production 任务九态(v0.2 冻结枚举) */
export type ProductionTaskStateV02 =
  | "queued"
  | "preparing"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "inspect_required"
  | "blocked"
  | "rejected";

export type PlanStatusV02 = "draft" | "approved" | "superseded";

/** 分页/过滤闭集(011 section 7 收敛决议:catalog.list 先例;词表外 = invalid_params) */
export interface ProductionListQueryV02 {
  readonly text?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface RecipeSaveCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "recipe.save";
  readonly commandId: string;
  readonly params: {
    /** 整文档提交(011 桌面表态);baseRevision 乐观并发,stale = typed conflict */
    readonly recipeDocument: Record<string, unknown>;
    readonly baseRevision: number;
  };
}

export interface RecipeSaveResultV02 {
  readonly recipeId: string;
  readonly revision: number;
}

export interface RecipeGetQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "recipe.get";
  readonly params: { readonly recipeId: string };
}

export interface RecipeGetResultV02 {
  readonly recipeId: string;
  readonly revision: number;
  readonly recipeDocument: Record<string, unknown>;
  readonly updatedAt: string;
}

export interface RecipeListQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "recipe.list";
  readonly params: ProductionListQueryV02;
}

export interface RecipeListEntryV02 {
  readonly recipeId: string;
  readonly revision: number;
  readonly title: string;
  readonly updatedAt: string;
}

export interface RecipeListResultV02 {
  readonly total: number;
  readonly entries: readonly RecipeListEntryV02[];
}

export interface RecipeResolveCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "recipe.resolve";
  readonly commandId: string;
  readonly params: { readonly recipeId: string; readonly revision?: number };
}

export interface ProductionTaskAcceptedV02 {
  readonly taskId: string;
  readonly correlationId: string;
  readonly state: ProductionTaskStateV02;
}

export interface PlanApproveCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "plan.approve";
  readonly commandId: string;
  readonly params: { readonly planId: string };
}

export interface PlanApproveResultV02 {
  readonly planId: string;
  readonly planStatus: PlanStatusV02;
}

export interface PlanGetQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "plan.get";
  readonly params: { readonly planId: string };
}

export interface PlanGetResultV02 {
  readonly planId: string;
  readonly planStatus: PlanStatusV02;
  readonly planDocument: Record<string, unknown>;
}

export interface PlanListQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "plan.list";
  readonly params: ProductionListQueryV02 & { readonly recipeId?: string };
}

export interface PlanListEntryV02 {
  readonly planId: string;
  readonly recipeId: string;
  readonly status: PlanStatusV02;
  readonly approvedAt: string;
}

export interface PlanListResultV02 {
  readonly total: number;
  readonly entries: readonly PlanListEntryV02[];
}

export interface JobExecuteCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "job.execute";
  readonly commandId: string;
  readonly params: { readonly planId: string };
}

export interface JobExecuteResultV02 {
  readonly taskId: string;
  readonly correlationId: string;
  readonly state: ProductionTaskStateV02;
}

export interface RecordGetQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "record.get";
  readonly params: { readonly buildId: string };
}

export interface RecordGetResultV02 {
  readonly buildId: string;
  readonly recordDocument: Record<string, unknown>;
}

export interface RecordListQueryV02 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "record.list";
  readonly params: ProductionListQueryV02 & { readonly recipeId?: string };
}

export interface RecordListEntryV02 {
  readonly buildId: string;
  readonly planId: string;
  readonly status: string;
  readonly finishedAt: string;
}

export interface RecordListResultV02 {
  readonly total: number;
  readonly entries: readonly RecordListEntryV02[];
}


// ---- release.openForHandoff(023 词表行,核心冻结批 2026-09-16:官方 SDK
// 上传交接的 tasked 命令面。交接语义=把用户送到官方 SDK 流程起点——上传
// 本身永不进 VUA(产品边界);桌面表态:方向 a 动作权威,b 回执形状并入结果
// 文档;产线表态:Bridge 命令面以工程已打开为前提,实现域=进程/窗口面,
// unity-bridge v3 零增操作,任务化=统一 task 九态单形态,完成判定=
// Bridge handshake 到达(001 链),聚焦不进契约事实,冻结批不设新真机前置。
// 机器可读面 schemas/release-handoff/v0.1,DRAFT 漂移由向量对表测试把守) ----

/** 词表行信封 schemaVersion(族自有常量,照 editor-verify/inspection-queries
 *  先例;绝不借外族版本) */
export type ReleaseHandoffSchemaVersionV01 = "0.1";

/** 类型化错误码闭集四码(vua.release_handoff.* 族):unavailable=路由/产线
 *  进程窗口 port 未接线(诚实缺席,绝不折叠成伪造受理);invalid_params=
 *  params 闭集违反(形状违反绝不冒充缺席);build_unknown=buildId 无对应
 *  构建记录(受理期校验);editor_unresolved=编辑器身份解析失败(诊断复用
 *  environment.verifyEditor 语义,不另造词)。任务运行期失败(handshake
 *  超时等)走任务面九态,不进本闭集 */
export type ReleaseHandoffErrorCodeV01 =
  | "vua.release_handoff.unavailable"
  | "vua.release_handoff.invalid_params"
  | "vua.release_handoff.build_unknown"
  | "vua.release_handoff.editor_unresolved";

/** 错误码闭集运行时面(渲染层收窄与消费测试按此数组对表,不自持字面量) */
export const RELEASE_HANDOFF_ERROR_CODES_V01: readonly ReleaseHandoffErrorCodeV01[] = [
  "vua.release_handoff.unavailable",
  "vua.release_handoff.invalid_params",
  "vua.release_handoff.build_unknown",
  "vua.release_handoff.editor_unresolved",
];

/** params 单字段闭集 {buildId}(核心冻结裁决,修订 023 §3 草案「buildId＋
 *  工程身份」:工程身份权威在 build-record 面——projectId 已随冻结记录
 *  携带,params 重复携带=双源对账零增益;桌面表态「权威身份在 build-record
 *  面」的最彻底落实。异议随 023 线程重议) */
export interface ReleaseOpenForHandoffCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "release.openForHandoff";
  readonly commandId: string;
  readonly params: { readonly buildId: string };
}

/** 受理回执(tasked 命令 inspection.requestRun 回执形状先例):按 taskId
 *  轮询应用任务面,不再轮询本方法;succeeded 快照 result 携带交接事实
 *  文档(#22/020 result 回流通道) */
export interface ReleaseHandoffAcceptedV01 {
  readonly schemaVersion: ReleaseHandoffSchemaVersionV01;
  readonly operation: "release.openForHandoff";
  readonly taskId: string;
  readonly correlationId: string;
}

/** 编辑器身份事实(exePath 属 editor-verify v0.1 冻结事实族——身份而非
 *  存储路径;storedPath 纪律:产物物理路径永不出现) */
export interface ReleaseHandoffEditorFactV01 {
  readonly exePath: string;
  readonly version: string;
}

/** 交接事实文档(succeeded 快照 result payload):VUA 侧终态事实。
 *  additionalProperties false 由形状钉死诚实纪律 1/2——无上传状态字段,
 *  上传在官方 SDK 中完成,绝非 VUA 可猜事实(负例向量钉死) */
export interface ReleaseHandoffFactV01 {
  readonly schemaVersion: ReleaseHandoffSchemaVersionV01;
  readonly buildId: string;
  readonly projectId: string;
  readonly editor: ReleaseHandoffEditorFactV01;
  readonly occurredAt: string;
}

// ---- overlay.*(017 overlay 表面批 1–2,核心冻结批:任务卡＋生产状态卡＋
// 下载卡的按需轮询读面。一次查询返回 overlay 一屏所需只读投影——对权威面的
// 字段裁剪,不跨源推导;载荷不带查询时刻与聚合 revision——两次查询无变更则
// 观察相同(纯函数纪律)。词表(任务态/plan 态/record 态/下载尝试态)从其属主
// 冻结面原样透传,本面刻意不重列。零 overlay 会话身份:查询面与主线不可区分,
// 语义动作走既有命令面(017 §3)。生产读面未接线 = vua.overlay.unavailable
// 诚实缺席,绝不以空快照伪装) ----

/** 任务卡(常驻主卡):任务存储投影,最旧优先;state 为任务面九态原词 */
export interface OverlayTaskCardV01 {
  readonly taskId: string;
  readonly state: string;
  readonly correlationId: string;
}

/** 当前 plan 摘要(createdAt 最新者;planId/planStatus/createdAt/recipeId
 *  裁剪自 plan 文档,原样透传) */
export interface OverlayPlanSummaryV01 {
  readonly planId: string;
  readonly planStatus: string;
  readonly createdAt: string;
  readonly recipeId: string;
}

/** 最近 Build Record 摘要(finishedAt 最新者;四字段与 record.list 冻结
 *  条目同形) */
export interface OverlayRecordSummaryV01 {
  readonly buildId: string;
  readonly planId: string;
  readonly status: string;
  readonly finishedAt: string;
}

/** 生产状态卡:两半独立可空——权威面无该事实即 null(空态即终态),
 *  绝不合成行 */
export interface OverlayProductionCardV01 {
  readonly currentPlan: OverlayPlanSummaryV01 | null;
  readonly latestRecord: OverlayRecordSummaryV01 | null;
}

/** 进行中下载行(017 批 2):dl- 前缀非终态尝试的字段裁剪投影——
 *  downloadId 即任务面 correlationId(port 分配身份),state 为任务九态
 *  原词,updatedAt 为任务行自身时间戳;无字节进度(进度在任务事件通道,
 *  快照不发明,主线 TaskSnapshot 同基准) */
export interface OverlayDownloadProgressV01 {
  readonly downloadId: string;
  readonly state: string;
  readonly updatedAt: string;
}

/** 下载/导入进度卡(017 批 2,向后兼容可选增量):仅承载进行中下载尝试
 *  (呈现策略=有进行中项时呈现,017 表态 3);完成交付保留其权威消费面
 *  downloads.listCompleted(导入页),不进 overlay 一眼面 */
export interface OverlayDownloadCardV01 {
  readonly activeDownloads: readonly OverlayDownloadProgressV01[];
}

export interface OverlayGetSnapshotQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "overlay.getSnapshot";
  readonly params: Readonly<Record<string, never>>;
}

export interface OverlaySnapshotResultV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly tasks: readonly OverlayTaskCardV01[];
  readonly productionCard: OverlayProductionCardV01;
  /** 017 批 2 增量:批 1 世代的快照无此字段仍有效(向后兼容) */
  readonly downloadCard?: OverlayDownloadCardV01;
}

// ---- inspection-queries v0.1（M7 检查切片；016 仲裁第 2 点独立词表行；
//      数据域草案面＋核心存储/路由实现批——草案态，冻结随实现批验收办理） ----
// 读面 get/list 照 record 先例：get 携 inspectionId 身份寻址、返回证据束
// 文档本体原样透传（细节在文档内，引用不复制）；list 为身份摘要行
// （performedAt 降序＝最新在前，条目绝不内联 dimensions/checks）。
// 写面 requestRun 为任务化驱动命令（回执照 job.execute 形态，taskId 轮询
// 任务面）。聚合规则（fail > warn[含 unavailable] > pass）在
// schemas/inspection-evidence/v0.1 草案内声明。

export type InspectionDimensionKindV01 =
  | "functional"
  | "performance"
  | "dependencies"
  | "lighting"
  | "upload_readiness";

export type InspectionDimensionStatusV01 = "pass" | "warn" | "fail" | "unavailable";

export type InspectionBasisV01 =
  | "bridge_typed_checks"
  | "bridge_local_estimate"
  | "official_sdk_rating"
  | "static_analysis"
  | "none";

export type InspectionCheckSeverityV01 = "error" | "warning" | "info";

/** 单条发现：code 点分命名空间（同 Bridge diagnostics 惯例）；metrics 为
 *  转抄数值（如本地估算四指标），绝不推导 */
export interface InspectionCheckV01 {
  readonly code: string;
  readonly severity: InspectionCheckSeverityV01;
  readonly message: string;
  readonly metrics?: Readonly<Record<string, number | string | boolean | null>>;
}

export interface InspectionDimensionV01 {
  readonly kind: InspectionDimensionKindV01;
  readonly status: InspectionDimensionStatusV01;
  readonly basis: InspectionBasisV01;
  readonly checks: readonly InspectionCheckV01[];
}

export interface InspectionBridgeOperationV01 {
  readonly operation: string;
  readonly commandId: string;
  readonly status: "succeeded" | "failed" | "rejected";
}

export interface InspectionBridgeContextV01 {
  readonly editorVersion: string;
  readonly bridgeSchemaVersion: number;
  readonly operations: readonly InspectionBridgeOperationV01[];
}

/** 检查证据束文档本体（schemas/inspection-evidence/v0.1 草案；读面原样
 *  透传，转抄不解释） */
export interface InspectionEvidenceDocumentV01 {
  readonly schemaVersion: "0.1";
  readonly inspectionId: string;
  readonly avatarRef: { readonly ref: string; readonly label?: string | null };
  readonly performedAt: string;
  readonly bridge: InspectionBridgeContextV01;
  readonly dimensions: readonly InspectionDimensionV01[];
  readonly overallStatus: "pass" | "warn" | "fail";
  readonly notes?: string;
}

export interface InspectionGetQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "inspection.get";
  readonly params: {
    readonly inspectionId: string;
  };
}

export interface InspectionGetResultV01 {
  readonly inspectionId: string;
  readonly inspectionDocument: InspectionEvidenceDocumentV01;
  readonly schemaVersion: "0.1";
}

export interface InspectionListQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "inspection.list";
  readonly params: {
    readonly avatarRef?: string;
    readonly overallStatus?: "pass" | "warn" | "fail";
    readonly limit?: number;
    readonly offset?: number;
  };
}

/** 身份摘要行：刻意窄——无 dimensions、无 checks，细节经 inspection.get
 *  到证据本体（引用不复制，012 evidenceIds 纪律） */
export interface InspectionListEntryV01 {
  readonly inspectionId: string;
  readonly avatarRef: { readonly ref: string; readonly label?: string | null };
  readonly overallStatus: "pass" | "warn" | "fail";
  readonly performedAt: string;
}

export interface InspectionListResultV01 {
  readonly total: number;
  readonly entries: readonly InspectionListEntryV01[];
  readonly schemaVersion: "0.1";
}

/** 检查运行写命令面：驱动 Bridge 五维产出操作（v1 双检查＋v3 三只读检查
 *  操作）并发布证据束；每次运行＝新 uuid-v7 inspectionId＝新观察事实 */
export interface InspectionRunCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "inspection.requestRun";
  readonly params: {
    readonly avatarGlobalObjectId: string;
    readonly avatarRef: { readonly ref: string; readonly label?: string | null };
  };
}

export interface InspectionRunAcceptedV01 {
  readonly schemaVersion: string;
  readonly operation: "inspection.requestRun";
  readonly taskId: string;
  readonly correlationId: string;
}

// ---- project-ops v0.1(014 语义冻结,环境实现;F6 副本导入确认链消费) ----
// project.import-copy 是 VUA 对 ALCOM/VCC 管理的原项目的唯一写路径(1.2.0 U3):
// plan/apply 两段一闭集命令;守卫(七项闭集)在服务端任务内评估;九态任务语义
// 走应用契约任务面,不在本词表。

export type ImportCopyPhaseV01 = "plan" | "apply";

export type ImportCopyGuardV01 =
  | "target_exists"
  | "target_inside_source"
  | "source_not_registered"
  | "source_invalid"
  | "insufficient_disk_space"
  | "plan_drift"
  | "execution_failed";

export type UnityClassificationV01 =
  | "production_target"
  | "migration_source"
  | "other_unity_version"
  | "tuanjie_family";

export type ProjectAssociationV01 = "vcc_registered" | "alcom_registered";

export interface ImportCopyCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "project.import-copy";
  readonly commandId: string;
  readonly params: {
    readonly phase: ImportCopyPhaseV01;
    readonly sourcePath: string;
    readonly targetParentDirectory: string;
    readonly targetProjectName: string;
    /** apply 段必填:plan 段回执的 planDigest,漂移即拒绝(plan_drift) */
    readonly confirmedPlanDigest?: string;
  };
}

export interface ImportCopyPlanV01 {
  readonly kind: "plan";
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly targetProjectName: string;
  readonly estimatedBytes: number;
  readonly excludedEntries: readonly string[];
  readonly sourceTopLevels: readonly string[];
  readonly planDigest: string;
}

export interface ImportCopySourceLinkV01 {
  readonly sourcePath: string;
  readonly sourceAssociations: readonly ProjectAssociationV01[];
  readonly importedAt: string;
  readonly taskCorrelation: string;
}

export interface ImportCopyReInspectionV01 {
  readonly unityVersion: string | null;
  readonly unityClassification: UnityClassificationV01 | null;
  readonly manifestPresent: boolean;
  readonly manifestSchemaOk: boolean;
}

export interface ImportCopyReceiptV01 {
  readonly kind: "receipt";
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly targetProjectName: string;
  readonly copiedTopLevels: readonly string[];
  readonly excludedEntries: readonly string[];
  readonly bytesCopied: number;
  readonly sourceLink: ImportCopySourceLinkV01;
  readonly reInspection: ImportCopyReInspectionV01;
}

export interface ImportCopyRejectedV01 {
  readonly kind: "rejected";
  readonly guard: ImportCopyGuardV01;
  /** vua.project.* 稳定码(七项闭集,冻结 Schema pattern) */
  readonly code: string;
  readonly detail: string;
}

export type ProjectImportCopyResultV01 =
  | ImportCopyPlanV01
  | ImportCopyReceiptV01
  | ImportCopyRejectedV01;

// ---- project-ops v0.2(增量族升版,核心冻结批 0889a1b;D-6 桌面接线消费) ----
// project.setNote:为单个 VUA 原生项目设置(或以 null 清除)用户备注(用户
// 裁决 12:只在项目列表显示;D-6 裁定 A 增加列表行内编辑写路径)。参数身份
// = projectPath(与 013 读面 inspectProject/lockStatus 同一注册路径身份,
// 草案 projectId 在冻结时修正——本词表族无独立项目 id)。守卫闭集十项:
// v0.1 七项 + setNote 三项(project_not_found/not_vua_native/identity_
// unreadable);守卫为服务端任务内事实,拒绝以冻结 rejected 文档承载
// (任务诚实完成,判定即拒绝)。命令为任务化受理:wire 回执携带 taskId/
// correlationId,结果文档随任务 Done payload 走应用契约任务面。

export type ProjectOpsGuardV02 =
  | ImportCopyGuardV01
  | "project_not_found"
  | "not_vua_native"
  | "identity_unreadable";

export interface ProjectSetNoteCommandV02 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "project.setNote";
  readonly commandId: string;
  readonly params: {
    readonly projectPath: string;
    /** null 清除既有备注;非空单行纯文本(冻结 Schema:1..2000 字符,无换行) */
    readonly note: string | null;
  };
}

/** 任务化受理回执 TS 镜像(wire 回执 value 形状;结果文档随 Done payload) */
export interface ProjectTaskAcceptedV02 {
  readonly taskId: string;
  readonly correlationId: string;
}

/** kind=note 完成面:VUA 原生身份的存储后备注态(markedAt/note 字段名与
 *  project-inspection v0.2 vuaIdentity present 投影一致;写备注永不改
 *  markedAt) */
export interface ProjectNoteStoredV02 {
  readonly kind: "note";
  readonly projectPath: string;
  readonly markedAt: string;
  readonly note: string | null;
}

/** kind=rejected 类型化守卫拒绝:guard 值 = code 后缀(v0.1 vua.project.*
 *  映射保持) */
export interface ProjectOpsRejectedV02 {
  readonly kind: "rejected";
  readonly guard: ProjectOpsGuardV02;
  readonly code: string;
  readonly detail: string;
}

export type ProjectSetNoteResultV02 = ProjectNoteStoredV02 | ProjectOpsRejectedV02;

export interface ProjectImportCopyCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "project.import-copy";
  readonly commandId: string;
  readonly params: {
    readonly phase: ImportCopyPhaseV01;
    readonly sourcePath: string;
    readonly targetParentDirectory: string;
    readonly targetProjectName: string;
    readonly confirmedPlanDigest?: string;
  };
}

export type ApplicationRequestV01 =
  | ApplicationSnapshotQueryV01
  | TaskListQueryV01
  | TaskGetQueryV01
  | TaskCancellationCommandV01
  | EnvironmentSnapshotQueryV01
  | DemoTaskStartCommandV01
  | ProductionStartInspectionCommandV02
  | ProductionGetInspectionQueryV02
  | ProductionRequestPlanCommandV02
  | ProductionGetPlanQueryV02
  | ProductionConfirmPlanCommandV02
  | ProductionRecoverCommandV02
  | ProductionGetBuildRecordQueryV02
  | CatalogListQueryV03
  | CatalogDetailQueryV03
  | CatalogStatusQueryV03
  | WarehouseListEntriesQueryV03
  | WarehouseEntryDetailQueryV03
  | DownloadsListCompletedQueryV04
  | EnvironmentVerifyEditorQueryV01
  | ProjectEnvironmentManagersQueryV01
  | ProjectListProjectsQueryV01
  | ProjectInspectProjectQueryV01
  | ProjectLockStatusQueryV01
  | PackagesListInstalledQueryV01
  | PackagesListReposQueryV01
  | PackagesPackageCatalogQueryV01
  | OverlayGetSnapshotQueryV01
  | InspectionGetQueryV01
  | InspectionListQueryV01
  | InspectionRunCommandV01
  | RecipeGetQueryV02
  | RecipeListQueryV02
  | PlanGetQueryV02
  | PlanListQueryV02
  | RecordGetQueryV02
  | RecordListQueryV02
  | DownloadIngestCommandV03
  | DownloadRetryCommandV03
  | WarehouseSetArtifactModeCommandV01
  | WarehouseSetGlobalDefaultModeCommandV02
  | WarehouseImportCommandV03
  | WarehouseImportDownloadsCommandV04
  | RecipeSaveCommandV02
  | ProjectImportCopyCommandV01
  | ProjectSetNoteCommandV02
  | RecipeResolveCommandV02
  | PlanApproveCommandV02
  | JobExecuteCommandV02
  | WarehouseGenerateVpmCommandV01
  | WarehouseDeleteOriginalsCommandV01
  | ReleaseOpenForHandoffCommandV01;

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
  /**
   * 条目级 schema 版本，live wire 逐条携带（引擎 serde u8；操作者 CDP
   * 键集实证 2026-09-17：schemaVersion+checkId+zone+presence+errorCode+facts）。
   * BOARD #36 第二处分歧（逐条 schemaVersion 未声明）由核心账本判定加性
   * 无害（2026-09-18）；桌面投影暂不消费，声明为可选——live 形状测试可
   * 钉死此键，既有 mock/fixture 构造零破坏。
   */
  readonly schemaVersion?: number;
  /** 稳定检查 id（如 `steam`、`unity_editors`）；修复计划与表现层按它取键。
   *  BOARD #36 权威定名（2026-09-18 核心裁决）：wire 面即本键，偏差方为
   *  引擎序列化面（引擎侧 serde rename 已修，wt-2 c9d3d83）。 */
  readonly checkId: string;
  readonly zone: EnvironmentZoneV01;
  readonly presence: EnvironmentPresenceV01;
  /** 仅在 presence === "detection_failed" 时设置；live wire 上缺席时为 null */
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
  | ProductionInspectionStartedV02
  | ProductionInspectionViewV02
  | ProductionPlanIssuedV02
  | ProductionPlanViewV02
  | ProductionBuildRecordViewV02
  | CatalogListResultV03
  | CatalogDetailResultV03
  | CatalogStatusResultV03
  | WarehouseListEntriesResultV03
  | WarehouseEntryDetailResultV03
  | DownloadsListCompletedResultV04
  | EnvironmentVerifyEditorResultV01
  | ProjectEnvironmentManagersResultV01
  | ProjectListProjectsResultV01
  | ProjectInspectProjectResultV01
  | ProjectLockStatusResultV01
  | OverlaySnapshotResultV01
  | WarehouseSetArtifactModeResultV01
  | WarehouseSetGlobalDefaultModeResultV02
  | WarehouseImportAcceptedV03
  | RecipeSaveResultV02
  | RecipeGetResultV02
  | RecipeListResultV02
  | ProductionTaskAcceptedV02
  | PlanApproveResultV02
  | PlanGetResultV02
  | PlanListResultV02
  | JobExecuteResultV02
  | RecordGetResultV02
  | RecordListResultV02
  | ProjectImportCopyResultV01
  | WarehouseMaintenanceAcceptedV01
  | ReleaseHandoffAcceptedV01;

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

/** Schema minLength: 1 的自由文本(路径、项目 id、decisionId 等) */
function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1;
}

/** 域引用身份($defs):前缀 + 16 位小写十六进制 */
const INSPECTION_ID_PATTERN = /^insp-[0-9a-f]{16}$/;
const PLAN_ID_PATTERN = /^plan-[0-9a-f]{16}$/;

function isInspectionId(value: unknown): value is string {
  return typeof value === "string" && INSPECTION_ID_PATTERN.test(value);
}

function isPlanId(value: unknown): value is string {
  return typeof value === "string" && PLAN_ID_PATTERN.test(value);
}

const PRODUCTION_MODES_V02: readonly string[] = ["direct_unity_package", "local_reusable_vpm"];
const PRODUCTION_RISK_CHOICES_V02: readonly string[] = [
  "snapshot_and_continue",
  "continue",
  "cancel",
  "not_required",
];

function isProductionMode(value: unknown): boolean {
  return typeof value === "string" && PRODUCTION_MODES_V02.includes(value);
}

function isProductionRiskChoice(value: unknown): boolean {
  return typeof value === "string" && PRODUCTION_RISK_CHOICES_V02.includes(value);
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
  // 021 词表行(核心七点裁决):单字段闭集 {path},minLength 1,词表外键拒绝
  if (value.kind === "query" && value.method === "environment.verifyEditor") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["path"])
      && isNonEmptyText(value.params.path);
  }
  if (value.kind === "command" && value.method === "task.startDemo") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "command" && value.method === "production.startInspection") {
    // v0.2 四元组:路径与项目身份由 Kernel 一次性转交,Schema 只要求非空字符串
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["sourceFolder", "projectRoot", "artifactOutputRoot", "projectId"])
      && isNonEmptyText(value.params.sourceFolder)
      && isNonEmptyText(value.params.projectRoot)
      && isNonEmptyText(value.params.artifactOutputRoot)
      && isNonEmptyText(value.params.projectId);
  }
  if (value.kind === "query" && value.method === "production.getInspection") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["inspectionId"])
      && isInspectionId(value.params.inspectionId);
  }
  if (value.kind === "command" && value.method === "production.requestPlan") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["inspectionId", "mode"])
      && isInspectionId(value.params.inspectionId)
      && isProductionMode(value.params.mode);
  }
  if (value.kind === "query" && value.method === "production.getPlan") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["planId"])
      && isPlanId(value.params.planId);
  }
  if (value.kind === "command" && value.method === "production.confirmPlan") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      || !isIdentifier(value.commandId)) {
      return false;
    }
    // v0.2:observedRevision 与 riskChoice 必填(确认纪律 + 风险决策 UI 义务),
    // rememberForSession 可选;词表外参数拒绝
    const confirmKeys = Object.keys(value.params).sort();
    const confirmExpected = ["observedRevision", "planId", "rememberForSession", "riskChoice"];
    if (confirmKeys.length !== 3 && confirmKeys.length !== 4) return false;
    if (!confirmKeys.every((key) => confirmExpected.includes(key))) return false;
    if (!isPlanId(value.params.planId)) return false;
    if (typeof value.params.observedRevision !== "number"
      || !Number.isSafeInteger(value.params.observedRevision)
      || value.params.observedRevision < 1) return false;
    if (!isProductionRiskChoice(value.params.riskChoice)) return false;
    return value.params.rememberForSession === undefined
      || typeof value.params.rememberForSession === "boolean";
  }
  if (value.kind === "command" && value.method === "production.recover") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      || !isIdentifier(value.commandId)) {
      return false;
    }
    const recoverKeys = Object.keys(value.params).sort();
    const recoverExpected = ["decision", "decisionId", "planId", "taskId"];
    if (recoverKeys.length !== 3 && recoverKeys.length !== 4) return false;
    if (!recoverKeys.every((key) => recoverExpected.includes(key))) return false;
    if (!isIdentifier(value.params.taskId) || !isNonEmptyText(value.params.decisionId)) return false;
    if (value.params.decision !== "continue" && value.params.decision !== "rollback") return false;
    return value.params.planId === undefined || isPlanId(value.params.planId);
  }
  if (value.kind === "query" && value.method === "production.getBuildRecord") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["buildRecordId"])
      && typeof value.params.buildRecordId === "string"
      && /^[A-Za-z0-9_-]{1,128}$/.test(value.params.buildRecordId);
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
  // bdl-queries v0.4(015 §10):可采纳已完成交付列表,params 闭集 = 空
  if (value.kind === "query" && value.method === "downloads.listCompleted") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  // 013 读面(核心 e720544/5b65550 四查询全 live):params 闭集照冻结面
  if (value.kind === "query" && value.method === "project.environmentManagers") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "project.listProjects") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "project.inspectProject") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["projectPath"])
      && isIdentifier(value.params.projectPath);
  }
  if (value.kind === "query" && value.method === "project.lockStatus") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["projectPath"])
      && isIdentifier(value.params.projectPath);
  }
  // 024 P1 读面(核心冻结批 2026-09-17):params 闭集 = 单键 projectPath
  if (value.kind === "query" && value.method === "packages.listInstalled") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["projectPath"])
      && isIdentifier(value.params.projectPath);
  }
  // 025 P2 读面(核心冻结批 2026-09-17):listRepos = 空闭集(全局配置
  // 面);packageCatalog = 双键闭集(projectPath 013 身份 + packageId)
  if (value.kind === "query" && value.method === "packages.listRepos") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "packages.packageCatalog") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["projectPath", "packageId"])
      && isIdentifier(value.params.projectPath)
      && isIdentifier(value.params.packageId);
  }
  // 017 overlay 读面批 1:params 闭集 = 空
  if (value.kind === "query" && value.method === "overlay.getSnapshot") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  // M7 检查切片:inspection.get(身份寻址,闭集单键)/inspection.list
  // (闭集可选键:avatarRef 精确匹配、overallStatus 三值闭集、有界分页)/
  // inspection.requestRun(任务化驱动写命令)
  if (value.kind === "query" && value.method === "inspection.get") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["inspectionId"])
      && isIdentifier(value.params.inspectionId);
  }
  if (value.kind === "query" && value.method === "inspection.list") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])) return false;
    for (const key of Object.keys(value.params)) {
      switch (key) {
        case "avatarRef":
          if (typeof value.params[key] !== "string" || (value.params[key] as string).length === 0) return false;
          break;
        case "overallStatus":
          if (value.params[key] !== "pass" && value.params[key] !== "warn" && value.params[key] !== "fail") return false;
          break;
        case "limit":
        case "offset":
          if (typeof value.params[key] !== "number" || !Number.isInteger(value.params[key])) return false;
          break;
        default:
          return false;
      }
    }
    return true;
  }
  if (value.kind === "command" && value.method === "inspection.requestRun") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      || !hasExactKeys(value.params, ["avatarGlobalObjectId", "avatarRef"])) {
      return false;
    }
    if (!isIdentifier(value.params.avatarGlobalObjectId)) return false;
    const avatarRef = value.params.avatarRef as { ref?: unknown; label?: unknown };
    if (!isRecord(avatarRef) || typeof avatarRef.ref !== "string" || avatarRef.ref.length === 0) return false;
    return avatarRef.label === undefined || avatarRef.label === null || typeof avatarRef.label === "string";
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
  // bdl-commands v0.1 写命令(proposal 005):params 闭集 + 模式词表闭集
  if (value.kind === "command" && value.method === "warehouse.setArtifactMode") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["warehouseItemId", "mode"])
      && isIdentifier(value.params.warehouseItemId)
      && (value.params.mode === null
        || value.params.mode === "use_original_unitypackage"
        || value.params.mode === "generate_vpm");
  }
  if (value.kind === "command" && value.method === "warehouse.deleteOriginals") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["warehouseItemId"])
      && isIdentifier(value.params.warehouseItemId);
  }
  // generateVpm:v0.3 词表可选携带 importCorrelationId(导入编排自动生成;
  // 手动发起恒不携带)——params 闭集 = warehouseItemId ± importCorrelationId
  if (value.kind === "command" && value.method === "warehouse.generateVpm") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      || !isIdentifier(value.commandId)
      || !isIdentifier(value.params.warehouseItemId)) return false;
    const keys = Object.keys(value.params).sort();
    return keys.length === 1
      || (keys.length === 2
        && keys.includes("importCorrelationId")
        && typeof value.params.importCorrelationId === "string"
        && value.params.importCorrelationId.length > 0);
  }
  // bdl-commands v0.2 全局层(W14):params 闭集 = mode,词表闭集无 null
  if (value.kind === "command" && value.method === "warehouse.setGlobalDefaultMode") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["mode"])
      && (value.params.mode === "use_original_unitypackage"
        || value.params.mode === "generate_vpm");
  }
  // bdl-commands v0.3 导入(W19):params 闭集 = sourceFolders,非空字符串数组
  if (value.kind === "command" && value.method === "warehouse.import") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["sourceFolders"])
      && Array.isArray(value.params.sourceFolders)
      && value.params.sourceFolders.length > 0
      && value.params.sourceFolders.every(
        (folder: unknown) => typeof folder === "string" && folder.length > 0);
  }
  // bdl-commands v0.4 下载采纳(IMP-3):params 闭集 = downloadIds,非空字符串
  // 数组(仅身份——路径/大小/文件名是服务端事实,词表外字段即契约违反)
  if (value.kind === "command" && value.method === "warehouse.importDownloads") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["downloadIds"])
      && Array.isArray(value.params.downloadIds)
      && value.params.downloadIds.length > 0
      && value.params.downloadIds.every(
        (downloadId: unknown) => typeof downloadId === "string" && downloadId.length > 0);
  }
  // production-use-case v0.2(W20 ten-method freeze): required-key closed sets
  if (value.kind === "command" && value.method === "recipe.save") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["recipeDocument", "baseRevision"])
      && typeof value.params.baseRevision === "number"
      && typeof value.params.recipeDocument === "object"
      && value.params.recipeDocument !== null;
  }
  if (value.kind === "command" && value.method === "recipe.resolve") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])) return false;
      if (!isIdentifier(value.commandId)) return false;
    const keys = Object.keys(value.params).sort();
    if (keys.length !== 1 && keys.length !== 2) return false;
    if (!keys.includes("recipeId") || typeof value.params.recipeId !== "string") return false;
    if (keys.length === 2 && (keys[1] !== "revision" || typeof value.params.revision !== "number")) return false;
    return true;
  }
  if (value.kind === "command" && (value.method === "plan.approve" || value.method === "job.execute")) {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["planId"])
      && typeof value.params.planId === "string";
  }
  if (value.kind === "query" && (value.method === "recipe.get" || value.method === "plan.get")) {
    const idKey = value.method === "recipe.get" ? "recipeId" : "planId";
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, [idKey])
      && typeof (value.params as Record<string, unknown>)[idKey] === "string";
  }
  // project-ops v0.1(014):plan/apply 两段闭集;apply 必带 confirmedPlanDigest
  if (value.kind === "command" && value.method === "project.import-copy") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])) return false;
      if (!isIdentifier(value.commandId)) return false;
    const p = value.params as Record<string, unknown>;
    const keys = Object.keys(p).sort();
    if (!keys.includes("phase") || !keys.includes("sourcePath") || !keys.includes("targetParentDirectory") || !keys.includes("targetProjectName")) return false;
    if (p.phase !== "plan" && p.phase !== "apply") return false;
    if (typeof p.sourcePath !== "string" || p.sourcePath.length === 0) return false;
    if (typeof p.targetParentDirectory !== "string" || p.targetParentDirectory.length === 0) return false;
    if (typeof p.targetProjectName !== "string" || p.targetProjectName.length === 0) return false;
    if (p.phase === "apply") {
      if (keys.length !== 5 || !keys.includes("confirmedPlanDigest")) return false;
      if (typeof p.confirmedPlanDigest !== "string" || p.confirmedPlanDigest.length === 0) return false;
    } else if (keys.length !== 4) return false;
    return true;
  }
  // production-use-case v0.2 读面闭集(011 section 7:catalog.list 先例)
  if (value.kind === "query" && (value.method === "record.get")) {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["buildId"])
      && typeof value.params.buildId === "string";
  }
  if (value.kind === "query" && (value.method === "recipe.list" || value.method === "plan.list" || value.method === "record.list")) {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])) return false;
    const keys = Object.keys(value.params).sort();
    const allowed = value.method === "recipe.list"
      ? ["limit", "offset", "text"]
      : ["limit", "offset", "recipeId", "text"];
    for (const key of keys) {
      if (!allowed.includes(key)) return false;
      if ((key === "limit" || key === "offset") && typeof value.params[key] !== "number") return false;
      if (key !== "limit" && key !== "offset" && typeof value.params[key] !== "string") return false;
    }
    return true;
  }
  // 023 词表行(核心冻结批 2026-09-16):params 单字段闭集 {buildId},
  // 词表外键拒绝(形状违反=invalid_params,绝不冒充缺席)
  if (value.kind === "command" && value.method === "release.openForHandoff") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])
      && isIdentifier(value.commandId)
      && hasExactKeys(value.params, ["buildId"])
      && isNonEmptyText(value.params.buildId);
  }
  return false;
}

/** 交接事实文档运行时守卫(023 冻结批):形状即诚实纪律——闭集键外任何
 *  字段(尤其上传状态类)拒绝;消费测试负例钉死 */
export function isReleaseHandoffFactV01(value: unknown): value is ReleaseHandoffFactV01 {
  if (!isRecord(value)) return false;
  if (!hasExactKeys(value, ["schemaVersion", "buildId", "projectId", "editor", "occurredAt"])) return false;
  if (value.schemaVersion !== "0.1") return false;
  if (!isNonEmptyText(value.buildId) || !isNonEmptyText(value.projectId) || !isNonEmptyText(value.occurredAt)) {
    return false;
  }
  if (!isRecord(value.editor)) return false;
  return hasExactKeys(value.editor, ["exePath", "version"])
    && isNonEmptyText(value.editor.exePath)
    && isNonEmptyText(value.editor.version);
}
