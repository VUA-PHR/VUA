import { describe, expect, it } from "vitest";
import type { DesktopGatewayRequestV1, DesktopGatewayResponseV1 } from "@vua/contracts";
import {
  composeDraftCompareKey,
  fetchRecipeCompareCandidates,
  findIdenticalRecipe,
  recipeDocumentCompareKey,
  type RecipeCompareCandidate,
} from "./compose-save-dedup.ts";
import type { ComposeDraftItem } from "./compose-draft-store.ts";

/* D5(用户裁定 2026-09-20「点 N 次存 N 版应先查重询问」)回归钉:
 * ①查重命中 → 返回既有配方身份,保存链弹确认框等用户确认;
 * ②不命中 → null,照常直存;
 * ③列表不可得/为空 → 空候选,诚实降级照常保存,不阻塞。
 * 判等键为规范化多重集:与条目顺序、时间戳、实例/选择器 id 无关;
 * 不可解释文档 compareKey=null 不参与判等(无证据不判同)。 */

const draftItem = (overrides: Partial<ComposeDraftItem> = {}): ComposeDraftItem => ({
  warehouseItemId: "wh-1",
  title: "夏季制服",
  role: null,
  nameHint: null,
  addedAt: "2026-09-20T00:00:00.000Z",
  ...overrides,
});

/** 保存文档形状的既有序文档(assets+instances,与草稿映射同源) */
const libraryDocument = (overrides: {
  assets?: unknown;
  instances?: unknown;
} = {}): unknown => ({
  formatVersion: "0.3",
  recipeId: "0190existing",
  title: "夏季制服",
  assets:
    overrides.assets ??
    [{ id: "wh-1", role: "other", label: "夏季制服", sourceRef: { warehouseItemId: "wh-1", role: "original" } }],
  instances:
    overrides.instances ??
    [
      {
        id: "wh-1-instance-1",
        assetId: "wh-1",
        entrypoint: { selectorId: "wh-1-entrypoint", kind: "user_named_entrypoint", nameHint: "夏季制服" },
        enabled: true,
      },
    ],
  relations: [],
});

const okEnvelope = (value: unknown): DesktopGatewayResponseV1 =>
  ({
    schemaVersion: 1,
    requestId: "req-1",
    ok: true,
    value,
  }) as DesktopGatewayResponseV1;

const errEnvelope = (): DesktopGatewayResponseV1 =>
  ({
    schemaVersion: 1,
    requestId: "req-1",
    ok: false,
    error: { code: "internal", messageKey: "vua_internal" },
  }) as DesktopGatewayResponseV1;

describe("判等键(纯函数)", () => {
  it("草稿键与同内容文档键完全一致(保存映射同源:role 缺省 other、挂载名缺省 title)", () => {
    const draftKey = composeDraftCompareKey([draftItem()]);
    expect(recipeDocumentCompareKey(libraryDocument())).toBe(draftKey);
  });

  it("顺序无关:条目/实例顺序不同,键一致;内容不同,键不同", () => {
    const a = composeDraftCompareKey([
      draftItem({ warehouseItemId: "wh-1", title: "A" }),
      draftItem({ warehouseItemId: "wh-2", title: "B", role: "hair" }),
    ]);
    const b = composeDraftCompareKey([
      draftItem({ warehouseItemId: "wh-2", title: "B", role: "hair" }),
      draftItem({ warehouseItemId: "wh-1", title: "A" }),
    ]);
    expect(a).toBe(b);
    expect(composeDraftCompareKey([draftItem({ title: "C" })])).not.toBe(a);
    // 挂载名差异(可判等字段)≠相同
    expect(
      composeDraftCompareKey([draftItem({ nameHint: "renamed" })]),
    ).not.toBe(composeDraftCompareKey([draftItem()]));
  });

  it("文档收窄:非对象/缺比对面 = null;不可解释实例滤除(不猜测)", () => {
    expect(recipeDocumentCompareKey(null)).toBeNull();
    expect(recipeDocumentCompareKey("nope")).toBeNull();
    expect(recipeDocumentCompareKey({})).toBeNull();
    expect(recipeDocumentCompareKey({ assets: [{ id: "x" }], instances: "bad" })).toBeNull();
    // 实例缺 entrypoint/nameHint → 滤除;仅剩可解释面参与判等
    const partial = recipeDocumentCompareKey({
      assets: [{ id: "wh-1", role: "other" }],
      instances: [{ assetId: "wh-1" }, "junk"],
    });
    expect(partial).not.toBeNull();
    expect(partial).not.toBe(composeDraftCompareKey([draftItem()]));
  });
});

describe("查重三例(D5 主钉)", () => {
  const draftKey = composeDraftCompareKey([draftItem()]);
  const identical: RecipeCompareCandidate = {
    recipeId: "0190existing",
    revision: 3,
    compareKey: draftKey,
  };
  const different: RecipeCompareCandidate = {
    recipeId: "0190other",
    revision: 1,
    compareKey: composeDraftCompareKey([draftItem({ title: "别的" })]),
  };
  const unexplainable: RecipeCompareCandidate = {
    recipeId: "0190broken",
    revision: 2,
    compareKey: null,
  };

  it("①命中:内容完全一致 → 返回既有身份(id/修订号),由保存链弹确认框", () => {
    expect(findIdenticalRecipe(draftKey, [different, identical])).toEqual({
      recipeId: "0190existing",
      revision: 3,
    });
  });

  it("②不命中:内容不一致(或仅有不可解释候选)→ null,照常直存", () => {
    expect(findIdenticalRecipe(draftKey, [different])).toBeNull();
    expect(findIdenticalRecipe(draftKey, [unexplainable])).toBeNull();
    expect(findIdenticalRecipe(draftKey, [])).toBeNull();
  });

  it("③列表不可得/为空 → 空候选,诚实降级照常保存(读失败/!ok/空列表三形)", async () => {
    const invokeThrows = async (_request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1> => {
      throw new Error("transport down");
    };
    const invokeErr = async (): Promise<DesktopGatewayResponseV1> => errEnvelope();
    const invokeEmpty = async (): Promise<DesktopGatewayResponseV1> =>
      okEnvelope({ entries: [] });
    await expect(fetchRecipeCompareCandidates(invokeThrows)).resolves.toEqual([]);
    await expect(fetchRecipeCompareCandidates(invokeErr)).resolves.toEqual([]);
    await expect(fetchRecipeCompareCandidates(invokeEmpty)).resolves.toEqual([]);
  });
});

describe("候选装配(fetchRecipeCompareCandidates)", () => {
  it("列表+逐条文档装配:命中内容一致的既有配方;单条文档读失败不参与判等", async () => {
    const requests: DesktopGatewayRequestV1[] = [];
    const invoke = async (request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1> => {
      requests.push(request);
      if (request.method === "recipe.list") {
        return okEnvelope({
          entries: [
            { recipeId: "0190existing", revision: 3, title: "夏季制服", updatedAt: "2026-09-19T00:00:00Z" },
            { recipeId: "0190broken", revision: 1, title: "坏文档", updatedAt: "2026-09-19T00:00:00Z" },
          ],
        });
      }
      if (request.method === "recipe.get") {
        const params = request.params as { recipeId: string };
        if (params.recipeId === "0190broken") throw new Error("read failed");
        // 冻结 wire 形状:回执顶层必填身份字段＋recipeDocument 透明本体
        return okEnvelope({
          recipeId: params.recipeId,
          revision: 3,
          recipeDocument: libraryDocument(),
        });
      }
      return errEnvelope();
    };
    const candidates = await fetchRecipeCompareCandidates(invoke);
    expect(candidates).toEqual([
      { recipeId: "0190existing", revision: 3, compareKey: composeDraftCompareKey([draftItem()]) },
      { recipeId: "0190broken", revision: 1, compareKey: null },
    ]);
    expect(findIdenticalRecipe(composeDraftCompareKey([draftItem()]), candidates)).toEqual({
      recipeId: "0190existing",
      revision: 3,
    });
    expect(requests.filter((request) => request.method === "recipe.get")).toHaveLength(2);
  });
});
