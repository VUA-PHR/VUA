import type { RecordListEntryV02 } from "@vua/contracts";

/**
 * 出厂页构建记录读面模型(夜间任务 P2):消费 production-use-case v0.2
 * record.list / record.get(核心路由已交付验收;真机数据流随 W25 窗口)。
 *
 * 纪律:
 * - record.get 的 recordDocument 是 build-record v0.3 冻结文档透传——本模型
 *   只做呈现事实收窄(字段存在性核验,照 production-chain-port 先例),
 *   不解释、不猜测、不重算;
 * - 必需身份字段缺失或类型不符 → null(整条不可解释,由 UI 如实呈现);
 * - planDeviations 为 schema 可选字段:缺席 = 0(无偏差记录,文档事实);
 * - evidenceSummary 为 schema 必填字段:缺席 → evidenceIdCount = null,
 *   UI 明示「证据摘要缺席」(缺席即证据,不猜测为 0);
 * - status 词表 = build-record v0.3 冻结六态闭集,词表外 = 不可解释。
 */

export type BuildRecordStatusV03 =
  | "succeeded"
  | "succeeded_with_warnings"
  | "failed"
  | "cancelled"
  | "rolled_back"
  | "recovered";

const RECORD_STATUSES: readonly BuildRecordStatusV03[] = [
  "succeeded",
  "succeeded_with_warnings",
  "failed",
  "cancelled",
  "rolled_back",
  "recovered",
];

export function isBuildRecordStatusV03(value: string): value is BuildRecordStatusV03 {
  return (RECORD_STATUSES as readonly string[]).includes(value);
}

/** 构建记录呈现事实(从 v0.3 文档收窄;全部为文档确定事实) */
export interface BuildRecordFacts {
  readonly buildId: string;
  readonly recipeId: string;
  readonly recipeRevision: number;
  readonly planId: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly status: BuildRecordStatusV03;
  /** jobs 收据转抄计数(按 receipt status 三闭集分计) */
  readonly jobCounts: {
    readonly total: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly rejected: number;
  };
  /** 计划偏差条数(schema 可选字段;缺席 = 0) */
  readonly planDeviationCount: number;
  /** 证据引用条数(schema 必填;缺席 = null → UI 明示「证据摘要缺席」) */
  readonly evidenceIdCount: number | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** record.list 条目呈现行(列表收窄已在端口层;此处仅排序辅助) */
export function sortRecordRowsByFinishedAtDesc(
  entries: readonly RecordListEntryV02[],
): readonly RecordListEntryV02[] {
  return [...entries].sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1));
}

/** build-record v0.3 文档 → 呈现事实;不可解释 = null(UI 如实呈现,不猜测) */
export function narrowBuildRecordFacts(document: unknown): BuildRecordFacts | null {
  if (!isPlainObject(document)) return null;
  const buildId = document.buildId;
  const recipeId = document.recipeId;
  const recipeRevision = document.recipeRevision;
  const planId = document.planId;
  const startedAt = document.startedAt;
  const finishedAt = document.finishedAt;
  const rawStatus = document.status;
  const jobs = document.jobs;
  if (
    !isNonEmptyString(buildId) ||
    !isNonEmptyString(recipeId) ||
    typeof recipeRevision !== "number" ||
    !Number.isInteger(recipeRevision) ||
    recipeRevision < 1 ||
    !isNonEmptyString(planId) ||
    !isNonEmptyString(startedAt) ||
    !isNonEmptyString(finishedAt) ||
    !isNonEmptyString(rawStatus) ||
    !isBuildRecordStatusV03(rawStatus) ||
    !Array.isArray(jobs)
  ) {
    return null;
  }
  // jobs 计数:条目按 receipt status 三闭集分计;条目非对象或 status 词表外
  // = 该收据不可解释 → 整份文档拒绝呈现(不低估、不猜测)
  const counts = { total: 0, succeeded: 0, failed: 0, rejected: 0 };
  for (const job of jobs) {
    if (!isPlainObject(job)) return null;
    const status = job.status;
    if (!isNonEmptyString(status)) return null;
    if (status !== "succeeded" && status !== "failed" && status !== "rejected") return null;
    counts.total += 1;
    if (status === "succeeded") counts.succeeded += 1;
    else if (status === "failed") counts.failed += 1;
    else counts.rejected += 1;
  }
  // planDeviations 可选:缺席 = 0(无偏差记录);在场必须为数组(条目内容
  // 不逐条解释——条数是文档事实,偏差详情属记录本体不在此呈现)
  const deviations = document.planDeviations;
  const planDeviationCount = deviations === undefined ? 0 : Array.isArray(deviations) ? deviations.length : null;
  if (planDeviationCount === null) return null;
  // evidenceSummary schema 必填;缺席如实标注为「摘要缺席」(null),不猜测为 0
  const evidenceSummary = document.evidenceSummary;
  let evidenceIdCount: number | null;
  if (evidenceSummary === undefined) {
    evidenceIdCount = null;
  } else if (isPlainObject(evidenceSummary) && Array.isArray(evidenceSummary.evidenceIds)) {
    evidenceIdCount = evidenceSummary.evidenceIds.length;
  } else {
    return null;
  }
  return {
    buildId,
    recipeId,
    recipeRevision,
    planId,
    startedAt,
    finishedAt,
    status: rawStatus,
    jobCounts: counts,
    planDeviationCount,
    evidenceIdCount,
  };
}

/** 状态徽标色调(展柜色彩纪律 §6.1:异常红,其余中性;recovered 有语义标注) */
export function recordStatusTone(status: BuildRecordStatusV03): "neutral" | "error" {
  return status === "failed" || status === "rolled_back" ? "error" : "neutral";
}

/** 列表行状态投影(record.list 条目 status 为 string;词表外原样呈现,
 *  不猜测为词表内值——诚实纪律) */
export function recordListStatusLabel(
  status: string,
  table: Record<BuildRecordStatusV03, string>,
): string {
  return isBuildRecordStatusV03(status) ? table[status] : status;
}

export function recordListStatusTone(status: string): "neutral" | "error" {
  return isBuildRecordStatusV03(status) ? recordStatusTone(status) : "neutral";
}

/** uuid 短码呈现(列表行用;完整 id 在详情) */
export function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}
