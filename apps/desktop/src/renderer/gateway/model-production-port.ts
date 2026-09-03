import type { WorkshopView } from "../features/workshop/track-model.ts";
import type { AssetRecord, RecipeSourceRef } from "./refs.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

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
 *  unresolved=仅有商品引用、未解析出实体(显示卖家原文,见 displayFallback) */
export type RecipeNodeState = "ready" | "conflict" | "missing" | "unresolved";

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

export interface ModelProductionView {
  schemaVersion: 1;
  workshop: WorkshopView;
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
  capability(): Promise<CapabilityReport>;
}
