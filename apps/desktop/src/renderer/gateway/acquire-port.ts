import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * Warehouse 本地轨只读窄端口(C-ACQUIRE;双轨之二,ui-ux §2.10)。
 *
 * 定位(F4-6 条目模型裁决,docs/plans/f4-6-entry-model-proposal_ZH):
 * - 仓库素材以"素材包条目"(warehouse-layout 裁决)为唯一模型:授权下载与
 *   批量导入两条进入路径都由 AMF 落成条目,用户不翻磁盘;ADR-0004 时代的
 *   "用户指定扫描范围"图册视图(scanDirs)整体退役;
 * - 条目内工件以内容身份(artifactSha256)为工件 id,与 BDL 幂等纪律同源;
 * - 诚实纪律:先检查再使用,quarantined 工件绝不自动运行(§2.10),表现层
 *   不提供任何"运行"入口;隔离拒绝理由由 v0.3 读取面(entryDetail 的
 *   rejectionReason)在条目详情如实呈现;
 * - 预览提取未接入:域类型不携带恒空的 previewImageUrls/executables 字段
 *   (升版随检查钩子切片回归);条目工件模式行(覆盖 or 跟随全局)是
 *   F4-9 模式编辑入口的展示位,本端口只读、不含任何写命令。
 */

/** 工件检查状态(material-intake v0.1 词表;与 B4 检查最小集对齐) */
export type WarehouseArtifactState = "pending" | "clean" | "quarantined";

/** 副本角色(v0.3):原始包 / 生成 VPM 包 */
export type WarehouseArtifactRole = "original" | "generated_vpm";

/** 条目进入路径(v0.3 闭集):批量导入拷入 / 授权下载 */
export type WarehouseEntryKind = "imported_material" | "downloaded_material";

/** 产物模式(v0.3):每条目消费偏好;null = 跟随全局默认 */
export type WarehouseArtifactMode = "use_original_unitypackage" | "generate_vpm";

/** 条目内工件(列表视图最小展示单元;artifactSha256 即工件 id) */
export interface WarehouseArtifact {
  /** 内容身份,格式 sha256:<64 位小写十六进制> */
  readonly artifactSha256: string;
  /** 条目文件夹内相对路径 */
  readonly relativePath: string;
  readonly state: WarehouseArtifactState;
  /** 字节大小(BDL 登记面必填;未知大小不出现于条目模型) */
  readonly sizeBytes: number;
  readonly role: WarehouseArtifactRole;
}

/** 素材包条目(warehouse-layout:语义目录树的一个素材包文件夹) */
export interface WarehouseEntry {
  /** VUA 生成身份,稳定且不从显示名派生 */
  readonly warehouseItemId: string;
  /** 本地身份:仓库根下的文件夹名 */
  readonly folderName: string;
  readonly displayName: string;
  readonly kind: WarehouseEntryKind;
  /** 条目落成时刻(ISO) */
  readonly createdAt: string;
  /** 每条目消费偏好覆盖;null = 跟随全局默认(F4-9 的编辑入口读此字段) */
  readonly artifactMode: WarehouseArtifactMode | null;
  /** 读取时动态解析:覆盖 ?? 全局默认;只是偏好,不代表 VPM 已存在 */
  readonly effectiveArtifactMode: WarehouseArtifactMode;
  readonly artifacts: readonly WarehouseArtifact[];
}

/** 工件事实(entryDetail 读取面):在列表工件上叠加检查与来源关联事实 */
export interface WarehouseArtifactFact extends WarehouseArtifact {
  /** 检查建议的规范文件名;未判定为 null */
  readonly suggestedFileName: string | null;
  /** 机械判定时刻(ISO);pending 时 null */
  readonly inspectedAt: string | null;
  /** 诚实判定文本;仅 quarantined 非空,条目详情原样呈现 */
  readonly rejectionReason: string | null;
  /** 是否已关联到目录来源观察 */
  readonly sourceCorrelated: boolean;
  /** 关联到的目录商品(booth:<数字> 命名空间) */
  readonly mappedProductIds: readonly string[];
}

/** 条目详情(entryDetail 读取面):条目 + 工件事实 */
export type WarehouseEntryDetail = Omit<WarehouseEntry, "artifacts"> & {
  readonly artifacts: readonly WarehouseArtifactFact[];
};

export type AcquireEntryDetailView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "not-found" }
  | { schemaVersion: 1; kind: "detail"; entry: WarehouseEntryDetail };

export type AcquireView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "entries"; entries: readonly WarehouseEntry[] };

export interface AcquirePort {
  /** 条目枚举(warehouse.listEntries 投影;空仓库 = 空数组,不是未接入) */
  snapshot(): Promise<AcquireView>;
  /** 条目详情(warehouse.entryDetail 投影;未知条目 not-found,不猜测) */
  entryDetail(warehouseItemId: string): Promise<AcquireEntryDetailView>;
  subscribe(callback: (view: AcquireView) => void): Unsubscribe;
  capability(): Promise<CapabilityReport>;
}
