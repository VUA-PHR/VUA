import type {
  CatalogAvailability,
  CatalogBrowserQuery,
  CatalogPrice,
  CatalogRelationKind,
} from "../../gateway/index.ts";

/**
 * Warehouse 页面查询状态(纯逻辑,可测)。
 * 表单值用 "" 表示"不筛选";toPortQuery 负责收敛为端口查询。
 */

export interface WarehouseQueryState {
  readonly text: string;
  readonly availability: CatalogAvailability | "";
  readonly entityType: string | "";
  readonly relationKind: CatalogRelationKind | "";
}

export const emptyWarehouseQuery: WarehouseQueryState = {
  text: "",
  availability: "",
  entityType: "",
  relationKind: "",
};

/** 表单状态 -> 端口查询:空值不进入查询,文本去首尾空白 */
export function toPortQuery(state: WarehouseQueryState): CatalogBrowserQuery {
  const query: {
    text?: string;
    availability?: CatalogAvailability;
    entityType?: string;
    relationKind?: CatalogRelationKind;
  } = {};
  const text = state.text.trim();
  if (text.length > 0) query.text = text;
  if (state.availability !== "") query.availability = state.availability;
  if (state.entityType !== "") query.entityType = state.entityType;
  if (state.relationKind !== "") query.relationKind = state.relationKind;
  return query;
}

/**
 * 是否有生效中的筛选:区分"搜索/筛选无结果"与"目录为空/未接入"——
 * 两种空态文案不同(ui-ux:搜索空 ≠ 未接入)。
 */
export function hasActiveFilter(state: WarehouseQueryState): boolean {
  return (
    state.text.trim().length > 0 ||
    state.availability !== "" ||
    state.entityType !== "" ||
    state.relationKind !== ""
  );
}

/** 价格展示归类:金额为 "0" 视为免费;缺价格单列,不猜测为 0 */
export type PriceKind = "free" | "priced" | "none";

export function priceKind(price: CatalogPrice | null): PriceKind {
  if (price === null) return "none";
  return price.amount === "0" ? "free" : "priced";
}

/** 卡片相册激活前的悬停时长(毫秒;数值可调) */
export const CARD_ALBUM_HOVER_DELAY_MS = 2000;

/**
 * 卡片相册位置翻页(纯函数):光标 x 在媒体区内的相对位置 → 图片序号。
 * 媒体区宽被均分为 count 段,光标落入哪段显示哪张;clamp 到 [0, count-1]。
 */
export function albumIndexFromOffset(offsetX: number, width: number, count: number): number {
  if (count <= 1 || width <= 0) return 0;
  const ratio = Math.min(Math.max(offsetX / width, 0), 1 - Number.EPSILON);
  return Math.min(Math.floor(ratio * count), count - 1);
}
