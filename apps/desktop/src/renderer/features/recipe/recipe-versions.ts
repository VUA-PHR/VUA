import { storageKeys } from "../../app/storage-keys.ts";
import { GRAPH_WORLD_LIMIT } from "./recipe-layout-model.ts";
import type { GraphPoint } from "./recipe-model.ts";

/**
 * 配方版本管理器存储(S-IX-4):本地快照,版本化 schema,按 recipeId 分桶。
 * - 每桶 ≤20 条,超出淘汰最旧;
 * - 宽容解析:损坏 JSON / 未知版本 / 畸形条目一律回退空
 *   (本地缓存永远不是事实来源,同 recipe-layout-model 纪律);
 *   v1(格点 cells)随 S-XI 自由点迁移废弃,回退空 = 从零开始记版本;
 * - 诚实边界:版本记录布局快照 + 结构摘要(节点数/缺失数);
 *   配方内容编辑与分享码接入前,不含文档本体。
 */

export interface RecipeVersionEntry {
  readonly id: string;
  /** ISO 8601 */
  readonly savedAt: string;
  readonly note: string | null;
  readonly nodeCount: number;
  readonly missingCount: number;
  /** nodeId → 自由点(恢复时经 mergePoints 吸收图谱漂移) */
  readonly points: Readonly<Record<string, GraphPoint>>;
}

export interface StoredRecipeVersionsV2 {
  readonly version: 2;
  readonly byRecipe: Readonly<Record<string, readonly RecipeVersionEntry[]>>;
}

export const emptyRecipeVersions: StoredRecipeVersionsV2 = { version: 2, byRecipe: {} };

/** 每桶版本容量:超出淘汰最旧(确定性,不按访问频度) */
export const RECIPE_VERSIONS_CAP = 20;

function isValidPoint(value: unknown): value is GraphPoint {
  const point = value as { x?: unknown; y?: unknown };
  return (
    typeof point?.x === "number" &&
    typeof point?.y === "number" &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Math.abs(point.x) <= GRAPH_WORLD_LIMIT &&
    Math.abs(point.y) <= GRAPH_WORLD_LIMIT
  );
}

function parseEntry(value: unknown): RecipeVersionEntry | null {
  const entry = value as Partial<RecipeVersionEntry> | null;
  if (typeof entry !== "object" || entry === null) return null;
  if (typeof entry.id !== "string" || entry.id === "") return null;
  if (typeof entry.savedAt !== "string" || entry.savedAt === "") return null;
  if (entry.note !== null && typeof entry.note !== "string") return null;
  if (
    typeof entry.nodeCount !== "number" ||
    !Number.isInteger(entry.nodeCount) ||
    entry.nodeCount < 0 ||
    typeof entry.missingCount !== "number" ||
    !Number.isInteger(entry.missingCount) ||
    entry.missingCount < 0 ||
    typeof entry.points !== "object" ||
    entry.points === null
  ) {
    return null;
  }
  const points: Record<string, GraphPoint> = {};
  for (const [nodeId, point] of Object.entries(entry.points as Record<string, unknown>)) {
    if (isValidPoint(point)) points[nodeId] = { x: Math.round(point.x), y: Math.round(point.y) };
  }
  return {
    id: entry.id,
    savedAt: entry.savedAt,
    note: entry.note,
    nodeCount: entry.nodeCount,
    missingCount: entry.missingCount,
    points,
  };
}

/** 宽容解析:非法 JSON、未知版本(含已废弃的 v1)、畸形条目一律回退为空 */
export function parseStoredVersions(raw: string | null): StoredRecipeVersionsV2 {
  if (raw === null) return emptyRecipeVersions;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyRecipeVersions;
  }
  if (typeof parsed !== "object" || parsed === null) return emptyRecipeVersions;
  const candidate = parsed as { version?: unknown; byRecipe?: unknown };
  if (candidate.version !== 2 || typeof candidate.byRecipe !== "object" || candidate.byRecipe === null) {
    return emptyRecipeVersions;
  }
  const byRecipe: Record<string, RecipeVersionEntry[]> = {};
  for (const [recipeId, list] of Object.entries(candidate.byRecipe as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const entries = list.map(parseEntry).filter((entry): entry is RecipeVersionEntry => entry !== null);
    if (entries.length > 0) byRecipe[recipeId] = entries.slice(-RECIPE_VERSIONS_CAP);
  }
  return { version: 2, byRecipe };
}

export function loadRecipeVersions(): StoredRecipeVersionsV2 {
  try {
    return parseStoredVersions(localStorage.getItem(storageKeys.recipeVersions));
  } catch {
    return emptyRecipeVersions;
  }
}

/** localStorage 不可用时仅本次会话生效(与壳层同一策略) */
export function saveRecipeVersions(stored: StoredRecipeVersionsV2): void {
  try {
    localStorage.setItem(storageKeys.recipeVersions, JSON.stringify(stored));
  } catch {
    /* 仅本次会话生效 */
  }
}

/** 追加新版本;超出容量淘汰最旧 */
export function appendVersion(
  stored: StoredRecipeVersionsV2,
  recipeId: string,
  entry: RecipeVersionEntry,
): StoredRecipeVersionsV2 {
  const list = [...(stored.byRecipe[recipeId] ?? []), entry].slice(-RECIPE_VERSIONS_CAP);
  return { version: 2, byRecipe: { ...stored.byRecipe, [recipeId]: list } };
}

/** 删除版本;空桶即移除记录,不留墓碑 */
export function removeVersion(
  stored: StoredRecipeVersionsV2,
  recipeId: string,
  versionId: string,
): StoredRecipeVersionsV2 {
  const list = (stored.byRecipe[recipeId] ?? []).filter((entry) => entry.id !== versionId);
  const byRecipe = { ...stored.byRecipe };
  if (list.length === 0) {
    delete byRecipe[recipeId];
  } else {
    byRecipe[recipeId] = list;
  }
  return { version: 2, byRecipe };
}

/** 布局与快照是否逐点一致(决定"当前"徽标;图谱漂移后自动失效,不谎报) */
export function pointsMatchSnapshot(
  points: ReadonlyMap<string, GraphPoint>,
  snapshot: Readonly<Record<string, GraphPoint>>,
): boolean {
  const keys = Object.keys(snapshot);
  if (keys.length !== points.size) return false;
  for (const [nodeId, point] of Object.entries(snapshot)) {
    const current = points.get(nodeId);
    if (!current || current.x !== point.x || current.y !== point.y) return false;
  }
  return true;
}
