import { storageKeys } from "../../app/storage-keys.ts";
import type { GraphPoint } from "./recipe-model.ts";

/**
 * Recipe 图谱布局操作与持久化(C-RECIPE-2,ui-ux §6.2 非拖动替代;S-XI 自由点):
 * - 全部操作落在整数自由点(GraphPoint,世界坐标,中心为 0,0);拖拽钉住、
 *   键盘方向键、按钮三个入口共用同一组纯函数,语义一致;
 * - 力导图允许节点靠近/重叠(Obsidian 语义),不做占用消解;
 * - 持久化:版本化 localStorage(v2),按 recipeId 分桶;v1(列/环格点)
 *   已废弃,解析回退空 = 回到自动布局(本地缓存永远不是事实来源);
 * - 恢复自动布局 = 清空本配方桶,回到 basePoints 力导布局。
 */

/** 世界坐标钳制上限:防误拖/脏数据把节点丢到不可达远处 */
export const GRAPH_WORLD_LIMIT = 2400;

/** 版本化存储形态:v2(自由点)。演进时新增版本号并在解析层迁移 */
export interface StoredRecipeLayoutsV2 {
  readonly version: 2;
  /** recipeId → nodeId → 自由点 */
  readonly byRecipe: Readonly<Record<string, Readonly<Record<string, GraphPoint>>>>;
}

export const emptyRecipeLayouts: StoredRecipeLayoutsV2 = { version: 2, byRecipe: {} };

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

/** 宽容解析:非法 JSON、未知版本(含已废弃的 v1)、畸形条目一律回退为空 */
export function parseStoredLayouts(raw: string | null): StoredRecipeLayoutsV2 {
  if (raw === null) return emptyRecipeLayouts;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyRecipeLayouts;
  }
  if (typeof parsed !== "object" || parsed === null) return emptyRecipeLayouts;
  const candidate = parsed as { version?: unknown; byRecipe?: unknown };
  if (candidate.version !== 2 || typeof candidate.byRecipe !== "object" || candidate.byRecipe === null) {
    return emptyRecipeLayouts;
  }
  const byRecipe: Record<string, Record<string, GraphPoint>> = {};
  for (const [recipeId, points] of Object.entries(candidate.byRecipe as Record<string, unknown>)) {
    if (typeof points !== "object" || points === null) continue;
    const bucket: Record<string, GraphPoint> = {};
    for (const [nodeId, point] of Object.entries(points as Record<string, unknown>)) {
      if (isValidPoint(point)) bucket[nodeId] = { x: Math.round(point.x), y: Math.round(point.y) };
    }
    if (Object.keys(bucket).length > 0) byRecipe[recipeId] = bucket;
  }
  return { version: 2, byRecipe };
}

export function loadRecipeLayouts(): StoredRecipeLayoutsV2 {
  try {
    return parseStoredLayouts(localStorage.getItem(storageKeys.recipeLayout));
  } catch {
    return emptyRecipeLayouts;
  }
}

/** localStorage 不可用时仅本次会话生效(与 App 壳同一策略) */
export function saveRecipeLayouts(stored: StoredRecipeLayoutsV2): void {
  try {
    localStorage.setItem(storageKeys.recipeLayout, JSON.stringify(stored));
  } catch {
    /* 仅本次会话生效 */
  }
}

/** 写入某配方的钉点桶;空桶(恢复自动布局)即移除记录,不留墓碑 */
export function writeRecipeLayout(
  stored: StoredRecipeLayoutsV2,
  recipeId: string,
  points: ReadonlyMap<string, GraphPoint> | null,
): StoredRecipeLayoutsV2 {
  const byRecipe = { ...stored.byRecipe };
  if (points === null || points.size === 0) {
    delete byRecipe[recipeId];
  } else {
    const bucket: Record<string, GraphPoint> = {};
    for (const [id, point] of points) bucket[id] = point;
    byRecipe[recipeId] = bucket;
  }
  return { version: 2, byRecipe };
}

/* ---- 自由点操作(纯函数) ---- */

function clampPoint(point: GraphPoint): GraphPoint {
  return {
    x: Math.round(Math.max(-GRAPH_WORLD_LIMIT, Math.min(GRAPH_WORLD_LIMIT, point.x))),
    y: Math.round(Math.max(-GRAPH_WORLD_LIMIT, Math.min(GRAPH_WORLD_LIMIT, point.y))),
  };
}

/**
 * 合并自动布局与已存钉点:只保留图中仍存在的节点(图谱漂移吸收);
 * 力导图允许重叠,不做占用消解。
 */
export function mergePoints(
  base: ReadonlyMap<string, GraphPoint>,
  overrides: ReadonlyMap<string, GraphPoint>,
): Map<string, GraphPoint> {
  const merged = new Map<string, GraphPoint>();
  for (const [id, point] of overrides) {
    if (base.has(id)) merged.set(id, clampPoint(point));
  }
  for (const [id, point] of base) {
    if (!merged.has(id)) merged.set(id, point);
  }
  return merged;
}

/** 拖拽落点钉住(拖拽入口):未知 id 不动 */
export function pinAt(
  points: ReadonlyMap<string, GraphPoint>,
  id: string,
  target: GraphPoint,
): Map<string, GraphPoint> {
  if (!points.has(id)) return new Map(points);
  const next = new Map(points);
  next.set(id, clampPoint(target));
  return next;
}

/** 平移选中节点(键盘/按钮入口):步长由调用方给定;原地不动返回原 Map 副本 */
export function nudgePoint(
  points: ReadonlyMap<string, GraphPoint>,
  id: string,
  dx: number,
  dy: number,
): Map<string, GraphPoint> {
  const current = points.get(id);
  if (!current || (dx === 0 && dy === 0)) return new Map(points);
  return pinAt(points, id, { x: current.x + dx, y: current.y + dy });
}

/** 是否相对自动布局有定制(决定"恢复自动布局"按钮的可用态) */
export function isCustomized(
  base: ReadonlyMap<string, GraphPoint>,
  points: ReadonlyMap<string, GraphPoint>,
): boolean {
  for (const [id, point] of points) {
    const b = base.get(id);
    if (!b || b.x !== point.x || b.y !== point.y) return true;
  }
  return false;
}
