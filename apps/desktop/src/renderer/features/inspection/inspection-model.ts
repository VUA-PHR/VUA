/**
 * Inspection 页面表现模型(M7 检查切片消费批;设计标准 §8.6「以报告、证据
 * 和下一步为主,明确区分本地估算与官方结论」):
 * 证据束文档 + 摘要行 → 视图投影的纯函数;无 IO、无文案字面量(枚举键与
 * TS 联合一一对应,字符串在 i18n 四表)。
 *
 * 转抄不解释纪律:checks 的 code/severity/message/metrics 与维状态、聚合
 * overallStatus 都是 wire 事实,原样透传呈现——渲染层不重推导聚合、不发明
 * 官方结论(official_sdk_rating 是保留值,016 §3:官方 SDK 交接切片落地前
 * 禁用,本模型按词表外原词透传处理,绝不渲染为「官方结论」)。
 *
 * 色彩纪律(§6.1 同源):异常红(fail/error)、注意琥珀(warn)、缺席灰
 * (unavailable 维——不完整的检查不得读作干净通过)、通过/中性灰阶。
 */
import type {
  InspectionDimensionV01,
  InspectionEvidenceDocumentV01,
  InspectionListEntryV01,
} from "@vua/contracts";
import type { InspectionDetailView, InspectionListView } from "./inspection-port.ts";

export type { InspectionEvidenceDocumentV01, InspectionListEntryV01 };

/** 状态视觉基调(呈现映射):error=阻断/失败,amber=注意,muted=诚实缺席,
 * neutral=通过/无异常 */
export type InspectionStatusTone = "neutral" | "amber" | "error" | "muted";

/** 维状态四态闭集(@vua/contracts InspectionDimensionStatusV01) */
export const inspectionDimensionStatuses = ["pass", "warn", "fail", "unavailable"] as const;

/** 维状态 → 基调(穷尽 switch;unavailable 灰阶=缺席非通过,016 §4) */
export function toneForDimensionStatus(
  status: InspectionDimensionV01["status"],
): InspectionStatusTone {
  switch (status) {
    case "pass":
      return "neutral";
    case "warn":
      return "amber";
    case "fail":
      return "error";
    case "unavailable":
      return "muted";
  }
}

/** 聚合结论三态闭集(pass|warn|fail;unavailable 不是聚合输出) */
export type InspectionEvidenceOverallStatus = "pass" | "warn" | "fail";

export const inspectionOverallStatuses: readonly InspectionEvidenceOverallStatus[] = [
  "pass",
  "warn",
  "fail",
];

export function toneForOverallStatus(
  status: InspectionEvidenceOverallStatus,
): InspectionStatusTone {
  switch (status) {
    case "pass":
      return "neutral";
    case "warn":
      return "amber";
    case "fail":
      return "error";
  }
}

/** 单条发现投影:字段全部原词透传(转抄不解释) */
export interface EvidenceCheckView {
  readonly code: string;
  readonly severity: string;
  readonly message: string;
}

/** 单维投影:kind/status/basis 原词(status/tone 分列——i18n 键映射在组件
 *  侧 strings.inspection.dimensions,词表外 kind 原词透传不猜测) */
export interface EvidenceDimensionView {
  readonly kindRaw: string;
  readonly statusRaw: string;
  readonly tone: InspectionStatusTone;
  readonly basisRaw: string;
  readonly checks: readonly EvidenceCheckView[];
}

/** 证据束详情投影(报告区输入) */
export interface EvidenceDetailModel {
  readonly inspectionId: string;
  readonly avatarLabel: string;
  readonly avatarRefRaw: string;
  readonly performedAt: string;
  readonly overallStatusRaw: string;
  readonly overallTone: InspectionStatusTone;
  /** Bridge 运行环境转抄(原样;operations 数=实际产出的操作事实数) */
  readonly editorVersion: string;
  readonly operationCount: number;
  readonly dimensions: readonly EvidenceDimensionView[];
  readonly notes: string | null;
}

function projectDimension(dimension: InspectionDimensionV01): EvidenceDimensionView {
  return {
    kindRaw: dimension.kind,
    statusRaw: dimension.status,
    tone: toneForDimensionStatus(dimension.status),
    basisRaw: dimension.basis,
    checks: dimension.checks.map((check) => ({
      code: check.code,
      severity: check.severity,
      message: check.message,
    })),
  };
}

export function evidenceDetailModel(
  document: InspectionEvidenceDocumentView,
): EvidenceDetailModel {
  return {
    inspectionId: document.inspectionId,
    avatarLabel: document.avatarRef.label ?? document.avatarRef.ref,
    avatarRefRaw: document.avatarRef.ref,
    performedAt: document.performedAt,
    overallStatusRaw: document.overallStatus,
    overallTone: toneForOverallStatus(document.overallStatus),
    editorVersion: document.bridge.editorVersion,
    operationCount: document.bridge.operations.length,
    dimensions: document.dimensions.map(projectDimension),
    notes: document.notes ?? null,
  };
}

/** 摘要行投影(证据区列表;label 优先,缺 label 显 ref——零猜测合成) */
export interface ListEntryView {
  readonly inspectionId: string;
  readonly avatarLabel: string;
  readonly overallStatusRaw: string;
  readonly overallTone: InspectionStatusTone;
  readonly performedAt: string;
}

export function listEntryModel(entry: InspectionListEntryView): ListEntryView {
  return {
    inspectionId: entry.inspectionId,
    avatarLabel: entry.avatarRef.label ?? entry.avatarRef.ref,
    overallStatusRaw: entry.overallStatus,
    overallTone: toneForOverallStatus(entry.overallStatus),
    performedAt: entry.performedAt,
  };
}

export type InspectionEvidenceDocumentView = InspectionEvidenceDocumentV01;
export type InspectionListEntryView = InspectionListEntryV01;

/** 列表视图状态概括(证据区空态判据):not-connected=读面未接线诚实缺席;
 * available 且零条目=设计空态(尚无检查证据);其余=有内容 */export function listViewKind(view: InspectionListView): "not-connected" | "empty" | "ready" {
  if (view.kind === "not-connected") return "not-connected";
  return view.entries.length === 0 ? "empty" : "ready";
}

/** 详情视图状态概括(报告区判据) */
export function detailViewKind(
  view: InspectionDetailView,
): "not-connected" | "missing" | "ready" {
  if (view.kind === "available") return "ready";
  return view.kind;
}
