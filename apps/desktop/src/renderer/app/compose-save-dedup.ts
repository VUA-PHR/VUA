import type { DesktopGatewayRequestV1, DesktopGatewayResponseV1 } from "@vua/contracts";
import type { ComposeDraftItem } from "./compose-draft-store.ts";
import {
  narrowRecipeDocumentReceipt,
  narrowRecipeLibraryEntries,
} from "../features/recipe/recipe-model.ts";

/**
 * 保存前查重比对面(D5,用户裁定 2026-09-20「点 N 次存 N 版应先查重询问」;
 * 桌面域共享容器层,两套 UI 同一规则):
 *
 * - 比对源=配方文档库既有列表(recipe.list 读面,已在库)+ 逐条 recipe.get
 *   文档内容;判等字段=素材集合＋挂载名等可判等字段(素材身份＋角色＋挂载
 *   名三元组的多重集,与 composeDraftToSaveDocument 的保存映射同源——比的
 *   就是「将要保存的内容」);
 * - 完全一致→返回既有配方身份(id/修订号),由保存链弹确认框,用户确认才
 *   提交新修订;不一致→照常直存;
 * - 诚实降级:列表不可得(读取失败/回执 !ok)或为空→无候选→照常保存,不
 *   阻塞;单条文档不可解释/读取失败→该条不参与判等(compareKey=null,无
 *   证据不判同,绝不因比对面缺失而误报「相同」);
 * - 纯函数确定化(BG-18 同源纪律):判等键为规范化多重集,与条目顺序、
 *   时间戳、实例/选择器 id 等呈现性字段无关。
 */

/** 可判等三元组:素材身份＋角色＋挂载名(与保存文档映射同源) */
type CompareTriple = readonly [
  assetId: string,
  role: string,
  nameHint: string,
];

/** 三元组规范化:trim 后以不可见分隔符串接,排序消顺序——顺序无关判等 */
function canonicalTriples(triples: readonly CompareTriple[]): string {
  const normalized = triples.map(
    (triple) => triple.map((part) => part.trim()).join("\u0000"),
  );
  normalized.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return normalized.join("\u0001");
}

/** 草稿 → 判等键(与 composeDraftToSaveDocument 同一映射:role 缺省 other、
 *  挂载名缺省条目 displayName——比对「将要保存的内容」) */
export function composeDraftCompareKey(
  items: readonly ComposeDraftItem[],
): string {
  return canonicalTriples(
    items.map(
      (item) =>
        [
          item.warehouseItemId,
          item.role ?? "other",
          item.nameHint ?? item.title,
        ] as const,
    ),
  );
}

/** 文档库候选:既有配方身份＋其内容判等键(null = 文档不可解释/读取失败,
 *  不参与判等——无证据不判同) */
export interface RecipeCompareCandidate {
  readonly recipeId: string;
  readonly revision: number;
  readonly compareKey: string | null;
}

/** recipe.get 文档 → 判等键(结构收窄:assets 供角色查找,instances 供
 *  挂载名;不可解释的条目/实例逐个滤除,不猜测;文档本体非对象、比对面
 *  存在但非数组、或两比对面全缺 = null——比对面不可解释时不判等) */
export function recipeDocumentCompareKey(document: unknown): string | null {
  if (document === null || typeof document !== "object" || Array.isArray(document)) {
    return null;
  }
  const record = document as Record<string, unknown>;
  if (
    (record.assets !== undefined && !Array.isArray(record.assets)) ||
    (record.instances !== undefined && !Array.isArray(record.instances))
  ) {
    return null;
  }
  const roleByAssetId = new Map<string, string>();
  const hasAssets = Array.isArray(record.assets);
  if (hasAssets) {
    for (const item of record.assets as unknown[]) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
      const asset = item as Record<string, unknown>;
      if (typeof asset.id !== "string" || asset.id.length === 0) continue;
      roleByAssetId.set(asset.id, typeof asset.role === "string" ? asset.role : "");
    }
  }
  const hasInstances = Array.isArray(record.instances);
  if (!hasAssets && !hasInstances) return null;
  const triples: CompareTriple[] = [];
  if (hasInstances) {
    for (const item of record.instances as unknown[]) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
      const instance = item as Record<string, unknown>;
      if (typeof instance.assetId !== "string" || instance.assetId.length === 0) continue;
      const entrypoint =
        instance.entrypoint !== null &&
        typeof instance.entrypoint === "object" &&
        !Array.isArray(instance.entrypoint)
          ? (instance.entrypoint as Record<string, unknown>)
          : null;
      if (entrypoint === null || typeof entrypoint.nameHint !== "string") continue;
      triples.push([
        instance.assetId,
        roleByAssetId.get(instance.assetId) ?? "",
        entrypoint.nameHint,
      ]);
    }
  }
  return canonicalTriples(triples);
}

/** 查重命中:既有配方身份(id/修订号,确认框展示用) */
export interface IdenticalRecipe {
  readonly recipeId: string;
  readonly revision: number;
}

/** 判等(纯函数):候选键与草稿键完全一致的首个既有配方;不一致/无候选/
 *  候选不可解释 = null(照常直存路径) */
export function findIdenticalRecipe(
  draftKey: string,
  candidates: readonly RecipeCompareCandidate[],
): IdenticalRecipe | null {
  const hit = candidates.find(
    (candidate) => candidate.compareKey !== null && candidate.compareKey === draftKey,
  );
  return hit ? { recipeId: hit.recipeId, revision: hit.revision } : null;
}

/** Gateway invoke 窄面(注入缝;测试以 stub 替换,不经 Electron) */
export type ComposeGatewayInvoke = (
  request: DesktopGatewayRequestV1,
) => Promise<DesktopGatewayResponseV1>;

/** 文档库读面 → 查重候选(异步装配;列表不可得/为空 = 空候选即直存路径;
 *  单条文档读取失败 = compareKey null 不参与判等;永不 reject——失败在
 *  此层如实落空,不向上抛) */
export async function fetchRecipeCompareCandidates(
  invoke: ComposeGatewayInvoke,
): Promise<readonly RecipeCompareCandidate[]> {
  let listResult: DesktopGatewayResponseV1 | null = null;
  try {
    listResult = await invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "recipe.list",
      params: {},
    });
  } catch {
    return [];
  }
  if (!listResult.ok) return [];
  const entries = narrowRecipeLibraryEntries(
    (listResult.value as { entries?: unknown }).entries,
  );
  if (entries.length === 0) return [];
  return Promise.all(
    entries.map(async (entry): Promise<RecipeCompareCandidate> => {
      let getResult: DesktopGatewayResponseV1 | null = null;
      try {
        getResult = await invoke({
          schemaVersion: 1,
          requestId: crypto.randomUUID(),
          method: "recipe.get",
          params: { recipeId: entry.recipeId },
        });
      } catch {
        return { recipeId: entry.recipeId, revision: entry.revision, compareKey: null };
      }
      if (!getResult.ok) {
        return { recipeId: entry.recipeId, revision: entry.revision, compareKey: null };
      }
      // 冻结 wire 面 recipe-get.result v0.2:文档本体在 recipeDocument 键;
      // 回执不可解释(文档缺席/文档身份缺失)= compareKey null 不判等
      const receipt = narrowRecipeDocumentReceipt(getResult.value);
      return {
        recipeId: entry.recipeId,
        revision: entry.revision,
        compareKey: receipt === null ? null : recipeDocumentCompareKey(receipt.document),
      };
    }),
  );
}
