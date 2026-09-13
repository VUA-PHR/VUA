import type { WarehouseEntryDetail } from "./acquire-port.ts";
import type {
  CatalogBrowserPort,
  CatalogProductDetail,
} from "./catalog-browser-port.ts";

/**
 * 条目详情预览的组合读(019 批 D D-6「预览能力接入」,核心裁决方案 c):
 * warehouse.entryDetail 的 artifacts[].mappedProductIds(bdl-queries v0.4
 * warehouseArtifactFact required,TS 面已透传)→ catalog.detail 按 productId
 * 精确查询取 product 媒体——两步组合,零 schema 变更、零 wire 扩展、零
 * 跨域契约面新增。渲染面复用 catalogImageUrl + DetailAlbum 同线。
 *
 * 诚实语义(AC-12 同规,核心裁决 2026-09-14):
 * - 无关联(全部工件 mappedProductIds 为空)→ no-association:条目尚未
 *   关联到目录来源,是关联事实本身,不是错误;
 * - 有关联但无一可显示(媒体空 / 目录 miss / 单品查询失败)→ no-images:
 *   陈述"本面当前无可显示的预览图",不猜测原因、不编造占位图;
 * - 每个来源的相册只携带 Gateway 真实返回的图;单品失败按该品无图吸收
 *   (与目录读面的 error/not-connected 视图形态同规),不向上抛错。
 *
 * 边界(核心裁决如实登记,不隐式扩张):列表卡面 warehouseArtifactRef
 * 无关联身份,列表缩略图属 wire 变更另立提案;本组合读只服务条目详情。
 */

/** 单个关联来源的可显示相册(仅含至少一张真实返回图的来源) */
export interface EntryPreviewAlbum {
  readonly productId: string;
  /** 详情标题;无题观测回落 productId(与云端详情抽屉同一纪律) */
  readonly title: string;
  /** 详情媒体数组;缺媒体回落主图单张(与云端详情抽屉同一回落线) */
  readonly imageUrls: readonly string[];
}

export type EntryPreviewView =
  | { kind: "no-association" }
  | { kind: "no-images" }
  | { kind: "loaded"; albums: readonly EntryPreviewAlbum[] };

/** 条目事实 → 去重后的关联来源身份(首现顺序;纯函数,不发起查询) */
export function entryPreviewProductIds(
  entry: WarehouseEntryDetail,
): readonly string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const artifact of entry.artifacts) {
    for (const productId of artifact.mappedProductIds) {
      if (!seen.has(productId)) {
        seen.add(productId);
        ids.push(productId);
      }
    }
  }
  return ids;
}

/** 媒体回落线(与云端详情抽屉一致):媒体数组 → 主图单张 → 空 */
function albumImages(product: CatalogProductDetail): readonly string[] {
  return product.media.imageUrls.length > 0
    ? product.media.imageUrls
    : product.imageUrl !== null
      ? [product.imageUrl]
      : [];
}

/**
 * 组合读:条目关联身份逐一定向查询目录详情,聚合可显示相册。
 * 永不 reject:单品查询失败按该品无图吸收(诚实空态归并见文件头)。
 */
export async function readEntryPreview(
  catalog: CatalogBrowserPort,
  entry: WarehouseEntryDetail,
): Promise<EntryPreviewView> {
  const productIds = entryPreviewProductIds(entry);
  if (productIds.length === 0) return { kind: "no-association" };
  const details = await Promise.all(
    productIds.map(async (productId) => ({
      productId,
      view: await catalog.detail(productId).catch(() => null),
    })),
  );
  const albums: EntryPreviewAlbum[] = [];
  for (const { productId, view } of details) {
    if (view === null || view.kind !== "detail") continue;
    const imageUrls = albumImages(view.product);
    if (imageUrls.length === 0) continue;
    albums.push({ productId, title: view.product.title ?? productId, imageUrls });
  }
  return albums.length > 0 ? { kind: "loaded", albums } : { kind: "no-images" };
}
