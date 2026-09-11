import type { WorkshopView } from "../features/workshop/track-model.ts";
import type { AssetRecord, RecipeSourceRef } from "./refs.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";
import type { WorkflowRunState, WorkflowStage } from "./workflow.ts";

/**
 * 模型生产领域窄端口(M0 ModelProductionPort):车间轨道/生产流程视图,
 * 以及 Recipe 图谱与分享码(G3 自审冻结签名,C-RECIPE 实现 UI 本体)。
 *
 * 图谱与分享码只有签名与状态枚举:中台 P0 交付 Recipe 领域模型与
 * vuar1. 分享码编解码后,由其按本签名实现;UI 本体在 C-RECIPE 落地。
 *
 * 契约红线(导入安全,见 C-RECIPE 验收):importShareCode 只做解析与预览,
 * 绝不触碰文件系统与 Unity;预览确认前不产生任何副作用。
 */

/** 当前配方占位 id:多配方管理进场前,图谱/导出查询以 "current" 指代当前配方 */
export const CURRENT_RECIPE_ID = "current";

/* ---- Recipe 图谱(冻结形状) ---- */

/** 图谱节点状态:ready=素材齐备;conflict=与其他节点冲突;missing=本地缺失;
 *  unresolved=仅有商品引用、未解析出实体(显示卖家原文,见 displayFallback);
 *  expected=库文档期望态(BG-1,015 §13 语义约束:description 钉死「期望态
 *  描述,非已验证的本地状态」——文档确定事实,非检查结果;呈现必须随附
 *  该语义标注,检查事实产生后由服务侧投影演进替代) */
export type RecipeNodeState =
  | "ready"
  | "conflict"
  | "missing"
  | "unresolved"
  | "expected";

/** 图谱节点(素材):asset 与 sourceRef 至少其一;
 *  仅 sourceRef 时 state 必为 unresolved,展示用 displayFallback 原文;
 *  合成依赖节点(id 前缀 "dep:",依赖包非素材资产)state 恒 unresolved,
 *  语义为"安装状态未核实",不得显示为已安装 */
export interface RecipeGraphNode {
  readonly id: string;
  readonly asset?: AssetRecord;
  readonly sourceRef?: RecipeSourceRef;
  readonly state: RecipeNodeState;
  /** 素材角色(Recipe v1 asset.role),驱动语义分层;合成依赖节点无 */
  readonly role?: string;
}

/** 图谱边(素材间关系);kind 词表(v0.4.0 §6.3):composition=实线组成、
 *  wardrobe=虚线换装可选、dependency=点线依赖包 */
export interface RecipeGraphEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: string;
}

/** 冲突条目:涉及的节点 id 组 + 说明(数据负载,由应用层提供) */
export interface RecipeConflict {
  readonly nodeIds: readonly string[];
  readonly description: string;
}

export type RecipeGraphView =
  | { schemaVersion: 1; kind: "not-connected" }
  | {
      schemaVersion: 1;
      kind: "graph";
      recipeId: string;
      nodes: readonly RecipeGraphNode[];
      edges: readonly RecipeGraphEdge[];
      selectedNodeId: string | null;
      conflicts: readonly RecipeConflict[];
      /** 本地缺失素材的节点 id 列表(与节点 state 冗余,供列表化提示) */
      missing: readonly string[];
    };

/* ---- 分享码(冻结签名) ---- */

/** 导入拒绝原因:畸形 / 版本不受支持 / 超限(节点数、嵌套深度、未知字段);
 *  G9 验收含版本、大小、深度、未知字段与预览确认 */
export type ShareCodeRejectReason = "malformed" | "unsupported_version" | "too_large";

export type ShareCodeImportResult =
  | { kind: "unavailable" }
  | { kind: "rejected"; reason: ShareCodeRejectReason }
  | { kind: "preview"; preview: RecipeGraphView };

export type ShareCodeExportResult =
  | { kind: "unavailable" }
  | { kind: "code"; code: string };

/* ---- Release 项目卡片墙(C-RECIPE-3) ---- */

/**
 * 出厂项目健康(development-plan-detail §Release:健康/漂移/缺依赖):
 * healthy=与配方目标一致;drifted=与配方有差异;missing-deps=依赖缺失。
 * 未知不猜测——无检测证据时 lastInspection 缺省,健康字段同样缺省。
 */
export type ReleaseProjectHealth = "healthy" | "drifted" | "missing-deps";

/** 最近一次 Inspection 结论;at 为 ISO 8601 时间戳 */
export interface ReleaseInspection {
  readonly state: "passed" | "failed";
  readonly at: string;
}

/** 出厂项目卡(ProjectRecord 展示面):只携带可核实事实,操作入口另由
 *  后续切片接入(恢复快照/重新派生/上传交接) */
export interface ReleaseProject {
  readonly id: string;
  readonly title: string;
  /** 派生来源配方;未知则缺省(不猜测) */
  readonly recipeId?: string;
  readonly recipeTitle?: string;
  readonly unityVersion?: string;
  readonly performanceTarget?: string;
  readonly platforms: readonly string[];
  readonly lastInspection?: ReleaseInspection;
  readonly health?: ReleaseProjectHealth;
  readonly snapshotCount: number;
  /** ISO 8601;卡片"最近更新"行 */
  readonly updatedAt: string;
  /**
   * 烘焙转盘预览定位(T1/T2 预览体系 T2,Release 详情):
   * Unity 工程根 + build_preview 命令 id,产物在
   * <projectRoot>/.vrcua/bridge/preview/<commandId>/(manifest v1)。
   * 当前仅 DEV fixture 携带并经 vite /@fs/ 读取;正式实现经资产协议接入后
   * 替换本字段的寻址方式,UI 不变。无烘焙产物时缺省,卡片/详情渲染诚实占位。
   */
  readonly bakePreview?: {
    readonly projectRoot: string;
    readonly commandId: string;
  };
}

export type ReleaseWallView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "wall"; projects: readonly ReleaseProject[] };

/* ---- F3 生产纵向流程(production-use-case v0.1〔M3 冻结〕的渲染层端口面) ----
 *
 * 值语义:判别联合 + schemaVersion: 1,查询面带 not-connected 退路;
 * 意图方法返回"已创建任务 + 当前快照"。v0.1 已随 M3 验收冻结(注意:现行的
 * production-use-case v0.2 是 M5 配方链词表,与本文档消费的 M3 素材直产链
 * 是不同的用例面);冻结面字段级调整走词表升版纪律,调整集中在本文档,
 * 视图与纯模型不动。
 */

/** 双素材入口(material-intake v0.1):.unitypackage 直接导入 / 本地 VPM 包经包管理器安装 */
/** 与素材 intake 协议 schema 词表一致(B 线权威,2026-09-04 对齐) */
export type SourceIntake = "direct_unity_package" | "local_reusable_vpm";

/** 全集:与 strings.productionFlow.material.intake 一一对应(奇偶测试约束) */
export const sourceIntakes: readonly SourceIntake[] = [
  "direct_unity_package",
  "local_reusable_vpm",
];

/** 素材引用:Renderer 不持文件系统句柄,由 Kernel 侧解析后传给 Provider(草案双素材入口) */
export interface MaterialRef {
  readonly materialId: string;
  readonly intake: SourceIntake;
  /** 展示名(数据负载,由应用层提供) */
  readonly displayName: string;
}

/** 检查发现词表(material-intake):兼容声明 / 缺失素材 / 依赖冲突 */
export type InspectionFindingKind = "compat" | "missing" | "conflict";

/** 全集:与 strings.productionFlow.inspection.findingKind 一一对应 */
export const inspectionFindingKinds: readonly InspectionFindingKind[] = [
  "compat",
  "missing",
  "conflict",
];

export interface InspectionFinding {
  readonly id: string;
  readonly kind: InspectionFindingKind;
  /** 发现摘要(数据负载) */
  readonly summary: string;
  /** 可恢复 / 可重试标注(草案值语义) */
  readonly recoverable: boolean;
  readonly retryable: boolean;
}

/** 可计划性结论:由应用层给出,前端不推断 */
export type Plannability = "plannable" | "needs_attention" | "not_plannable";

/** 全集:与 strings.productionFlow.inspection.plannability 一一对应 */
export const plannabilityStates: readonly Plannability[] = [
  "plannable",
  "needs_attention",
  "not_plannable",
];

/** 检查结果负载(getInspection 查询面与运行视图内嵌共用) */
export interface InspectionReport {
  readonly inspectionId: string;
  readonly source: MaterialRef;
  readonly findings: readonly InspectionFinding[];
  readonly plannability: Plannability;
  /** ISO 8601 */
  readonly inspectedAt: string;
}

/** 计划风险(v0.2 计划文档;与检查发现同形,无独立 id) */
export interface PlanRisk {
  readonly kind: InspectionFindingKind;
  /** 风险摘要(数据负载) */
  readonly summary: string;
  readonly recoverable: boolean;
  readonly retryable: boolean;
}

/**
 * 风险决策四枚举(amf-production v0.2 $defs.riskChoice;B 侧
 * RiskDecisionChoice 权威词表):计划审阅的风险决策控件呈现,
 * rememberForSession 为可选的会话内记忆。
 */
export type PlanRiskChoice = "snapshot_and_continue" | "continue" | "cancel" | "not_required";

/** 全集:与 strings.productionFlow.plan.riskChoice 一一对应 */
export const planRiskChoices: readonly PlanRiskChoice[] = [
  "snapshot_and_continue",
  "continue",
  "cancel",
  "not_required",
];

/** 计划 vs 检查结论的结构化差异种类(草案:差异以结构化字段表达,不由前端推断) */
export type PlanDiffKind = "added" | "changed" | "resolved";

/** 全集:与 strings.productionFlow.plan.diffKind 一一对应 */
export const planDiffKinds: readonly PlanDiffKind[] = ["added", "changed", "resolved"];

export interface PlanDiff {
  readonly id: string;
  readonly kind: PlanDiffKind;
  /** 差异说明(数据负载) */
  readonly summary: string;
}

/**
 * 执行计划负载(getPlan 查询面与运行视图内嵌共用;amf-production v0.2
 * 计划文档面):阶段引用工作流阶段词表,风险带 recoverable/retryable 标注。
 */
export interface ProductionPlan {
  readonly planId: string;
  /** 确认绑定:计划变化即 revision 递增,旧 revision 的确认失效(草案确认纪律) */
  readonly revision: number;
  /** 本计划基于的检查结果 */
  readonly inspectionId: string;
  /** 双素材模式(用户在素材入口做出的真实决策) */
  readonly mode: SourceIntake;
  /** 项目身份(VUA 管辖的执行上下文) */
  readonly projectId: string;
  readonly projectFingerprint: string;
  /** 将执行的工作流阶段(unity-bridge 词表) */
  readonly stages: readonly WorkflowStage[];
  /** 该计划是否要求用户做出风险决策(驱动审阅卡的风险决策控件) */
  readonly riskDecisionRequired: boolean;
  /** 风险清单(数据负载) */
  readonly risks: readonly PlanRisk[];
  /** 预估时长(ms);无真实总量来源时为 null,界面不得注水(§6.3) */
  readonly estimatedDurationMs: number | null;
  readonly diffs: readonly PlanDiff[];
}

/**
 * B 权威状态词表(build_record.rs v0.1 五态):契约事实,显示裁决由投影承担。
 * 2026-09-04 B 线回复对齐(见 docs/plans/b-line-reply-to-f-line-requirements_ZH.md)。
 */
export type BuildRecordAuthorityStatus =
  | "succeeded"
  | "succeeded_with_warnings"
  | "failed"
  | "cancelled"
  | "recovered";

/**
 * 显示投影四态:"aborted" = 检查后未执行即中止(未尝试恢复突变)。
 * 全集:与 strings.productionFlow.record.status 一一对应。
 */
export type BuildRecordDisplayStatus =
  | "completed"
  | "aborted"
  | "rolled_back"
  | "rollback_failed";

export const buildRecordDisplayStatuses: readonly BuildRecordDisplayStatus[] = [
  "completed",
  "aborted",
  "rolled_back",
  "rollback_failed",
];

/**
 * evidenceSummary 四节(v0.2 表现安全投影;快照 / Bridge 作业 / 本地 VPM /
 * 验证):attempted 为 false 的节其余字段为 null 锚——未尝试即无事实,
 * 界面如实呈现空槽。
 */
export interface BuildRecordEvidenceSummary {
  readonly snapshot: { readonly attempted: boolean; readonly succeeded: boolean | null };
  readonly bridge: {
    readonly jobsRun: number;
    readonly allSucceeded: boolean | null;
    readonly lastOperation: string | null;
  };
  readonly localVpm: {
    readonly attempted: boolean;
    readonly published: boolean | null;
    /** 保留字段:现无跳转目标(Release 详情属后续切片),不作链接 */
    readonly packageId: string | null;
  };
  readonly validation: { readonly status: "passed" | "failed" | "skipped" };
}

/** Build Record 负载(v0.2:结果、阶段、evidenceSummary、恢复字段) */
export interface BuildRecord {
  readonly recordId: string;
  /** 产生记录的执行/恢复任务 */
  readonly taskId: string;
  /** 记录归属的计划 */
  readonly planId: string;
  readonly mode: SourceIntake;
  /** B 权威状态(五态);显示状态经 projectBuildRecordDisplayStatus 投影 */
  readonly status: BuildRecordAuthorityStatus;
  /** 实际执行过的工作流阶段 */
  readonly stages: readonly WorkflowStage[];
  readonly evidenceSummary: BuildRecordEvidenceSummary;
  /** 恢复证据:是否尝试过回滚/恢复突变(决定 failed/cancelled 的显示分流) */
  readonly restoreAttempted: boolean;
  /** 仅 restoreAttempted 时非 null:回滚突变本身是否成功 */
  readonly restoreSucceeded: boolean | null;
  /** ISO 8601 */
  readonly startedAt: string;
  readonly finishedAt: string;
}

/**
 * B 五态 + 恢复证据 → 显示四态(B 线回复映射表,2026-09-04):
 * - succeeded / succeeded_with_warnings / recovered → completed;
 * - failed / cancelled:未尝试恢复突变 → aborted;
 *   已尝试 → restoreSucceeded ? rolled_back : rollback_failed。
 */
export function projectBuildRecordDisplayStatus(
  status: BuildRecordAuthorityStatus,
  restoreAttempted: boolean,
  restoreSucceeded: boolean | null,
): BuildRecordDisplayStatus {
  if (status === "succeeded" || status === "succeeded_with_warnings" || status === "recovered") {
    return "completed";
  }
  if (!restoreAttempted) return "aborted";
  return restoreSucceeded === true ? "rolled_back" : "rollback_failed";
}

/** 恢复决定种类(草案:continue / rollback) */
export type RecoverDecisionKind = "continue" | "rollback";

/** 全集:与 strings.productionFlow.recover.decision 一一对应 */
export const recoverDecisionKinds: readonly RecoverDecisionKind[] = ["continue", "rollback"];

/** 恢复决定:只携带语义选择。用户决定 ID 是 Kernel 侧概念——受理时生成并与
 *  taskId + revision + decision 绑定(可审计、幂等、单次消费),渲染层不可见
 *  也不传;用户同意来自确认界面与校验链,不来自 ID 的存在 */
export interface RecoverDecision {
  readonly kind: RecoverDecisionKind;
}

/** production.getInspection 查询面;未接入(或引用不存在)时 not-connected,不返回猜测结果 */
export type InspectionView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "inspection"; report: InspectionReport };

export type PlanView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "plan"; plan: ProductionPlan };

export type BuildRecordView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "record"; record: BuildRecord };

/**
 * 当前生产运行(随 snapshot/subscribe 通道下发)。
 * runState 为工作流冻结词表(gateway/workflow.ts);inspection/plan/buildRecord
 * 内嵌当前文档,免去逐卡查询;not-connected = 生产流程未接入或尚无运行。
 */
export type ProductionRunView =
  | { schemaVersion: 1; kind: "not-connected" }
  | {
      schemaVersion: 1;
      kind: "run";
      runId: string;
      /** 当前生产命令的任务 id(任务中心可见,originPage=workshop) */
      taskId: string;
      runState: WorkflowRunState;
      /** 取消是任务事实而非工作流状态(草案:取消语义与全局任务契约一致);
       *  true 时 runState 保留取消发生的最后阶段,界面呈现"已取消" */
      cancelled: boolean;
      source: MaterialRef;
      /** 检查结果;inspect 完成前为 null */
      inspection: InspectionReport | null;
      /** 执行计划;requestPlan 完成前为 null */
      plan: ProductionPlan | null;
      /** 最小 Build Record;执行/恢复结案前为 null */
      buildRecord: BuildRecord | null;
    };

/** 意图方法拒绝原因:stale_revision=确认绑定的 revision 已过期;
 *  not_recoverable=当前运行不可恢复;invalid_state=当前状态不接受该意图;
 *  unknown_ref=引用的检查/计划/任务不存在 */
export type ProductionRejectReason =
  | "stale_revision"
  | "not_recoverable"
  | "invalid_state"
  | "unknown_ref";

/** 全集:与 strings.productionFlow.rejected 一一对应 */
export const productionRejectReasons: readonly ProductionRejectReason[] = [
  "stale_revision",
  "not_recoverable",
  "invalid_state",
  "unknown_ref",
];

/** 意图方法统一返回(草案:意图方法均返回"已创建任务 + 当前快照");
 *  rejected/unavailable 也尽量携带当前运行快照供界面如实呈现 */
export type ProductionIntentResult =
  | { kind: "unavailable" }
  | { kind: "ok"; taskId: string; run: ProductionRunView }
  | { kind: "rejected"; reason: ProductionRejectReason; run: ProductionRunView };

/** 领域能力报告:overall=既有面(车间/图谱/分享码/卡片墙);
 *  production=F3 生产纵向七方法,非 ready 时素材入口不出现(§2.6) */
export interface ModelProductionCapabilities {
  readonly overall: CapabilityReport;
  readonly production: CapabilityReport;
}

export interface ModelProductionView {
  schemaVersion: 1;
  workshop: WorkshopView;
  /** F3 生产纵向流程当前运行;未接入或尚无运行时 not-connected */
  productionRun: ProductionRunView;
}

export interface ModelProductionPort {
  snapshot(): Promise<ModelProductionView>;
  subscribe(callback: (view: ModelProductionView) => void): Unsubscribe;
  /** Recipe 图谱查询(G9);未接入时返回 not-connected,不返回猜测图谱 */
  recipeGraph(recipeId: string): Promise<RecipeGraphView>;
  /** 分享码导入(G9):只解析与预览,绝不触碰文件系统与 Unity */
  importShareCode(code: string): Promise<ShareCodeImportResult>;
  /** 分享码导出(G9):生成 vuar1. 编码 */
  exportShareCode(recipeId: string): Promise<ShareCodeExportResult>;
  /** Release 项目卡片墙(C-RECIPE-3);未接入时返回 not-connected */
  releaseWall(): Promise<ReleaseWallView>;
  /**
   * F3 素材文件选择:正式实现为 Kernel 显式文件对话框 preload 面
   * (草案双素材入口;对话框未实现前返回 null);fixture 模拟返回合成 MaterialRef。
   * null = 用户取消或能力未接入。
   */
  pickMaterial(intake: SourceIntake): Promise<MaterialRef | null>;
  /** F3:对素材 + 目标组合启动 Inspect,产出兼容/缺失/冲突证据(创建任务) */
  startInspection(source: MaterialRef): Promise<ProductionIntentResult>;
  /** F3:读取一份检查结果(证据、可计划性结论) */
  getInspection(inspectionId: string): Promise<InspectionView>;
  /**
   * F3:基于检查结果生成执行计划(阶段、风险、预估;创建任务)。
   * v0.2:mode 携带双素材入口的真实用户决策(live 端口从运行已选素材的
   * intake 内取,调用方不重复传递)。
   */
  requestPlan(inspectionId: string): Promise<ProductionIntentResult>;
  /** F3:读取一份计划供审阅 */
  getPlan(planId: string): Promise<PlanView>;
  /**
   * F3:确认计划(绑定 revision;过期返回 rejected/stale_revision;创建执行任务)。
   * v0.2:riskChoice 必填(计划审阅的风险决策控件),rememberForSession
   * 可选勾选。
   */
  confirmPlan(
    planId: string,
    revision: number,
    riskChoice: PlanRiskChoice,
    rememberForSession?: boolean,
  ): Promise<ProductionIntentResult>;
  /** F3:对 failed_recoverable / expired 运行执行恢复(携带用户决定 ID;创建任务) */
  recover(taskId: string, decision: RecoverDecision): Promise<ProductionIntentResult>;
  /** F3:读取最小 Build Record(结果、阶段、证据) */
  getBuildRecord(recordId: string): Promise<BuildRecordView>;
  capability(): Promise<ModelProductionCapabilities>;
}
