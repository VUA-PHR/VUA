import type {
  ChangeRequest,
  PackageChangeItem,
  PackageChangeKind,
  PackageChangePreview,
  PackageProject,
  PackageRow,
  PackageSource,
  PackageVersionEntry,
  RepoHealth,
} from "../../gateway/index.ts";

/**
 * 包管理页纯逻辑(S-XVI):筛选、排序、批量能力交集、变更请求聚合、
 * 词表/时间映射。不持有状态、不做版本词法比较(诚实纪律:版本状态
 * 由端口给出);词表外取值一律显式回落,不猜测。
 */

/** 搜索防抖毫秒数(工具栏输入 → 筛选生效) */
export const SEARCH_DEBOUNCE_MS = 200;

/** 破坏性变更确认钮的延迟毫秒数(DelayedButton) */
export const DESTRUCTIVE_CONFIRM_DELAY_MS = 1000;

/** 切换项目时表格区骨架行数(与最终行高一致,防跳动) */
export const SKELETON_ROW_COUNT = 8;

/** 应用结果 toast 的停留毫秒数 */
export const TOAST_DURATION_MS = 4000;

/* ---- 查询与筛选 ---- */

export interface PackageQuery {
  readonly text: string;
  /** "" = 不按来源筛选 */
  readonly source: PackageSource | "";
  /** 预发布版本开关:只影响版本下拉可见项,不影响行与状态 */
  readonly showPrereleases: boolean;
}

export const emptyPackageQuery: PackageQuery = {
  text: "",
  source: "",
  showPrereleases: false,
};

/**
 * 预发布形态判定(仅显示过滤):semver 预发布段 = 核心三段后接连字符标签。
 * 只做字符串形状判断,不参与任何版本状态/兼容性结论(那些由端口给出)。
 */
export function looksPrerelease(version: string): boolean {
  return /^\d+\.\d+\.\d+-/.test(version);
}

/** 文本(名称/包 ID/描述)+ 来源筛选;大小写不敏感 */
export function filterPackages(
  rows: readonly PackageRow[],
  query: PackageQuery,
): PackageRow[] {
  const text = query.text.trim().toLowerCase();
  return rows.filter((row) => {
    if (query.source !== "" && row.source !== query.source) return false;
    if (text === "") return true;
    return (
      row.displayName.toLowerCase().includes(text) ||
      row.id.toLowerCase().includes(text) ||
      (row.description ?? "").toLowerCase().includes(text)
    );
  });
}

/** 行排序:按显示名字典序(不随状态重排,避免列表在阅读时跳动) */
export function sortPackages(rows: readonly PackageRow[]): PackageRow[] {
  return [...rows].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base", numeric: true }),
  );
}

/** 版本下拉分组:兼容组在上,不兼容组在分隔线下方(ALCOM 手法);
 *  预发布条目仅在开关打开时可见。组内顺序保持端口给出顺序,不重排 */
export function versionGroups(
  row: PackageRow,
  showPrereleases: boolean,
): { compatible: PackageVersionEntry[]; incompatible: PackageVersionEntry[] } {
  const visible = row.versions.filter(
    (entry) => showPrereleases || !looksPrerelease(entry.version),
  );
  return {
    compatible: visible.filter((entry) => entry.compatible),
    incompatible: visible.filter((entry) => !entry.compatible),
  };
}

/** 项目列表:收藏置顶,其余按名称字典序;无效项目保留在列表中(禁用+解释) */
export function sortProjects(projects: readonly PackageProject[]): PackageProject[] {
  return [...projects].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  });
}

/* ---- 状态与词表映射(键名与 strings.packages.* 同步,测试强制) ---- */

export type RowStatus = "notInstalled" | "updateAvailable" | "upToDate";

/** 行状态:完全消费端口事实(updateAvailable 由端口计算),不比较版本号 */
export function rowStatus(row: PackageRow): RowStatus {
  if (row.installedVersion === null) return "notInstalled";
  return row.updateAvailable ? "updateAvailable" : "upToDate";
}

/** 来源 → strings.packages.sources 键(恒等映射;显式声明防词表漂移) */
export const sourceTextKeys: Record<PackageSource, PackageSource> = {
  official: "official",
  curated: "curated",
  community: "community",
  local: "local",
};

/** 仓库健康 → strings.packages.repos.health 键 */
export const repoHealthTextKeys: Record<RepoHealth, RepoHealth> = {
  unknown: "unknown",
  ok: "ok",
  stale: "stale",
  unreachable: "unreachable",
};

/** 变更种类 → strings.packages.changes.kinds 键 */
export const changeKindTextKeys: Record<PackageChangeKind, PackageChangeKind> = {
  install: "install",
  upgrade: "upgrade",
  majorUpgrade: "majorUpgrade",
  downgrade: "downgrade",
  remove: "remove",
  reinstall: "reinstall",
};

/** 项目无效原因:词表外键回落 "unknown",诚实降级不崩 */
export type InvalidReasonKey = "folderMissing" | "unknown";

export function invalidReasonKey(key: string | undefined): InvalidReasonKey {
  return key === "folderMissing" ? "folderMissing" : "unknown";
}

/** 迁移建议摘要键:词表外一律 null(表现层不渲染未知卡片,不编造文案) */
export type MigrationSummaryKey = "vpmProject";

export function migrationSummaryKey(key: string): MigrationSummaryKey | null {
  return key === "vpmProject" ? "vpmProject" : null;
}

/** 冲突消息键:词表外回落 generic "unknown" 文案 */
export type ConflictMessageKey = "requiredBy" | "unknown";

export function conflictMessageKey(key: string): ConflictMessageKey {
  return key === "requiredBy" ? "requiredBy" : "unknown";
}

/* ---- A1 移除写面(026 消费批):typed 码/守卫 → 文案键映射 ---- */

/** A1 rejected guard → strings.packages.remove.guards 键;词表外回落
 * "unknown"(诚实降级不崩,guard 三值闭集 preview_drift/
 * package_not_found/execution_failed) */
export type RemoveGuardKey =
  | "preview_drift"
  | "package_not_found"
  | "execution_failed"
  | "unknown";

export function removeGuardKey(guard: string): RemoveGuardKey {
  return guard === "preview_drift" ||
    guard === "package_not_found" ||
    guard === "execution_failed"
    ? guard
    : "unknown";
}

/** A1 信封/受理 typed 错误码 → strings.packages.remove.envelopeErrors
 * 键;词外码回落 "unknown"(原词插值呈现,不猜测语义)。映射闭集 =
 * 026 冻结词面已申报面:复用码 vua.project.project_not_found(未注册
 * 路径)与 vua.packages.package_not_found(包不在已装集合)、通用
 * vua.vpm.capability_missing(引擎后端未声明 remove_packages)、
 * vua.packages.invalid_params(请求形状违规);任务非成功终态的
 * error.code 原词不在此闭集时一律 unknown。 */
export type RemoveEnvelopeErrorKey =
  | "projectNotFound"
  | "packageNotFound"
  | "capabilityMissing"
  | "invalidParams"
  | "unknown";

export function removeEnvelopeErrorKey(code: string): RemoveEnvelopeErrorKey {
  if (code === "vua.project.project_not_found") return "projectNotFound";
  if (code === "vua.packages.package_not_found") return "packageNotFound";
  if (code === "vua.vpm.capability_missing") return "capabilityMissing";
  if (code === "vua.packages.invalid_params") return "invalidParams";
  return "unknown";
}

/* ---- A2 安装/升级写面(026 v0.2 消费批):typed 码映射 ---- */

/** A2 信封/受理 typed 错误码 → strings.packages.install.envelopeErrors
 * 键;词外码回落 "unknown"(原词插值呈现,不猜测语义)。映射闭集 =
 * 026 v0.2 冻结词面已申报面:复用码 vua.project.project_not_found(未注
 * 册路径)、vua.packages.package_not_found(请求包/版本不可得)、通用
 * vua.vpm.capability_missing(引擎后端未声明 preview_install)、
 * vua.packages.invalid_params(请求形状违规)、A2 信封新码
 * vua.packages.preview_failed(预览/查询段失败——仓库解析、IO、外部
 * 失败类);任务非成功终态的 error.code 原词不在此闭集时一律 unknown。 */
export type InstallEnvelopeErrorKey =
  | "projectNotFound"
  | "packageNotFound"
  | "capabilityMissing"
  | "invalidParams"
  | "previewFailed"
  | "unknown";

export function installEnvelopeErrorKey(code: string): InstallEnvelopeErrorKey {
  if (code === "vua.project.project_not_found") return "projectNotFound";
  if (code === "vua.packages.package_not_found") return "packageNotFound";
  if (code === "vua.vpm.capability_missing") return "capabilityMissing";
  if (code === "vua.packages.invalid_params") return "invalidParams";
  if (code === "vua.packages.preview_failed") return "previewFailed";
  return "unknown";
}

/* ---- A3 本地包注册写面(026 v0.3 消费批):typed 码映射 ---- */

/** A3 信封/受理 typed 错误码 → strings.packages.register.envelopeErrors
 * 键;词外码回落 "unknown"(原词插值呈现,不猜测语义)。映射闭集 =
 * 026 v0.3 冻结词面已申报面:通用 vua.vpm.capability_missing(能力门控
 * 在路由层答——register_capabilities 访问器未翻转,绝不进任务)、
 * vua.packages.invalid_params(请求形状违规)。A3 无注册项目检查
 * (project_not_found 复用对本面不适用——注册不触项目)且无 preview 段
 * (preview_failed 对本面不存在),两码均不在闭集,如实缺席。任务非成
 * 功终态的 error.code 原词不在此闭集时一律 unknown。 */
export type RegisterEnvelopeErrorKey =
  | "capabilityMissing"
  | "invalidParams"
  | "unknown";

export function registerEnvelopeErrorKey(code: string): RegisterEnvelopeErrorKey {
  if (code === "vua.vpm.capability_missing") return "capabilityMissing";
  if (code === "vua.packages.invalid_params") return "invalidParams";
  return "unknown";
}

/* ---- A2 批量多选安装(C 面自决,026 v0.2 消费面):批量请求行构造 ---- */

/**
 * 批量多选 → A2 请求行:每行 version null = 解析器选最新稳定版(「安装/
 * 升级到最新」批量语义,与单包「安装最新」入口同语义——A2 词面不立
 * upgrade 动词;钉版本粒度保留目录面板单包入口);行序保持给定顺序
 * (已装表行序 = 服务端 packageId 升序,客户端不重排),空选择返回空
 * 数组(调用方拒发空请求——词面 minItems 1,UI 层不构造违例请求)。
 * 可装性/可升性不预判:批量预览的权威判定在服务端(空变更以 toast
 * 如实反馈,绝不猜测量)。
 */
export function installLatestRequests(
  packageIds: readonly string[],
): { packageId: string; version: null }[] {
  return packageIds.map((packageId) => ({ packageId, version: null }));
}

/* ---- 选择与批量 ---- */

/**
 * Shift 范围选(纯函数):anchor 为上次点击行;anchor 不在当前清单
 * (筛选变化后)时退化为单选 target。返回选中 id 数组(清单顺序)。
 */
export function rangeSelect(
  orderedIds: readonly string[],
  anchorId: string | null,
  targetId: string,
): string[] {
  const target = orderedIds.indexOf(targetId);
  if (target === -1) return [];
  const anchor = anchorId === null ? -1 : orderedIds.indexOf(anchorId);
  if (anchor === -1) return [targetId];
  const [from, to] = anchor < target ? [anchor, target] : [target, anchor];
  return orderedIds.slice(from, to + 1);
}

/** 批量能力交集:只有选中集全部满足才暴露对应批量动作 */
export interface BulkCapabilities {
  readonly updateAll: boolean;
  readonly installAll: boolean;
  readonly removeAll: boolean;
}

export function bulkCapabilities(rows: readonly PackageRow[]): BulkCapabilities {
  return {
    updateAll: rows.length > 0 && rows.every((row) => row.updateAvailable),
    installAll: rows.length > 0 && rows.every((row) => row.installedVersion === null),
    removeAll: rows.length > 0 && rows.every((row) => row.installedVersion !== null),
  };
}

export type BulkAction = keyof BulkCapabilities;

/** 批量动作 → 变更请求聚合(升级到最新合并为一条 bulk-update-latest) */
export function bulkRequests(
  action: BulkAction,
  rows: readonly PackageRow[],
): ChangeRequest[] {
  if (action === "updateAll") {
    return rows.length > 0
      ? [{ kind: "bulk-update-latest", packageIds: rows.map((row) => row.id) }]
      : [];
  }
  if (action === "installAll") {
    return rows.map((row) => ({ kind: "install", packageId: row.id }));
  }
  return rows.map((row) => ({ kind: "remove", packageId: row.id }));
}

/** 版本下拉选值 → 变更请求:未安装为 install,已安装为 update(升降级分类由端口判定) */
export function requestForVersion(row: PackageRow, version: string): ChangeRequest {
  return row.installedVersion === null
    ? { kind: "install", packageId: row.id, version }
    : { kind: "update", packageId: row.id, version };
}

/* ---- 变更预览 ---- */

/** 空预览:无可执行条目也无冲突/移除清单(表现层以 toast 代替对话框) */
export function isEmptyPreview(preview: PackageChangePreview): boolean {
  return (
    preview.items.length === 0 &&
    preview.conflicts.length === 0 &&
    preview.legacyRemovals.length === 0
  );
}

/** 预览条目按种类分组,固定顺序:新装/大版本升级/升级/降级/移除/重装 */
export const changeKindOrder: readonly PackageChangeKind[] = [
  "install",
  "majorUpgrade",
  "upgrade",
  "downgrade",
  "remove",
  "reinstall",
];

export interface PreviewGroup {
  readonly kind: PackageChangeKind;
  readonly items: readonly PackageChangeItem[];
}

export function groupPreviewItems(items: readonly PackageChangeItem[]): PreviewGroup[] {
  return changeKindOrder
    .map((kind) => ({ kind, items: items.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0);
}

/* ---- 仓库相对时间 ---- */

export type RelativeTimeKey = "checkedJustNow" | "checkedMinutesAgo" | "checkedHoursAgo" | "checkedDaysAgo";

/**
 * 上次核对的相对时间(纯函数,便于测试):非法/未来时间回落 null,
 * 表现层显示原文或"从未核对",不编造时间。
 */
export function relativeCheckedTime(
  iso: string | undefined,
  now: number,
): { key: RelativeTimeKey; count: number } | null {
  if (iso === undefined) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then) || then > now) return null;
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return { key: "checkedJustNow", count: 0 };
  if (minutes < 60) return { key: "checkedMinutesAgo", count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: "checkedHoursAgo", count: hours };
  return { key: "checkedDaysAgo", count: Math.floor(hours / 24) };
}
