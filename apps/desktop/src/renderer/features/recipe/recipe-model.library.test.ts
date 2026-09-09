import assert from "node:assert/strict";
import { test } from "vitest";
import {
  narrowRecipeDocumentFacts,
  narrowRecipeLibraryEntries,
  selectLibraryRecipe,
} from "./recipe-model.ts";

/* BG-1(W24 读面预备):recipe 文档库列表窄化与共享选择骨架的纯函数覆盖。
 * 数据全部来自 production-use-case v0.2 recipe.list 读面;缺失字段滤除,
 * 不猜测。 */

test("narrowRecipeLibraryEntries: 合法条目收窄,缺失字段滤除", () => {
  const entries = narrowRecipeLibraryEntries([
    {
      recipeId: "01234567-89ab-7cde-89ab-0123456789ab",
      revision: 3,
      title: "夏季制服配方",
      updatedAt: "2026-09-10T03:00:00Z",
    },
    { recipeId: "bad", revision: 1, title: "t", updatedAt: "x" }, // id 非 uuid 形态仍收(词表只查非空字符串)
    null,
    { recipeId: "01234567-89ab-7cde-89ab-0123456789ac", revision: 0, title: "t", updatedAt: "x" }, // revision<1 滤除
    { recipeId: "01234567-89ab-7cde-89ab-0123456789ad" }, // 缺字段滤除
  ]);
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.recipeId, "01234567-89ab-7cde-89ab-0123456789ab");
  assert.equal(entries[0]?.revision, 3);
  assert.equal(entries[1]?.recipeId, "bad");
});

test("narrowRecipeLibraryEntries: 非数组 = 空集(诚实空态,不猜测)", () => {
  assert.deepEqual(narrowRecipeLibraryEntries(undefined), []);
  assert.deepEqual(narrowRecipeLibraryEntries(null), []);
  assert.deepEqual(narrowRecipeLibraryEntries("nope"), []);
});

test("selectLibraryRecipe: 选择共享骨架——选中 id,空 id 幂等保持", () => {
  assert.equal(selectLibraryRecipe(null, "recipe-1"), "recipe-1");
  assert.equal(selectLibraryRecipe("recipe-1", "recipe-2"), "recipe-2");
  assert.equal(selectLibraryRecipe("recipe-1", ""), "recipe-1");
});

test("narrowRecipeDocumentFacts: 结构事实收窄,relations 缺失=null(语义=零声明)", () => {
  const facts = narrowRecipeDocumentFacts({
    formatVersion: "0.3",
    recipeId: "01234567-89ab-7cde-89ab-0123456789ab",
    revision: 2,
    title: "夏季制服",
    updatedAt: "2026-09-10T03:00:00Z",
    assets: [{ id: "a1", role: "outfit" }],
    instances: [{ id: "i1", assetId: "a1", entrypoint: "prefab" }],
    relations: [],
    locked: { "x": 1 },
  });
  assert.equal(facts?.title, "夏季制服");
  assert.equal(facts?.assetCount, 1);
  assert.equal(facts?.instanceCount, 1);
  assert.equal(facts?.relationCount, 0);
  assert.equal(facts?.locked, true);
});

test("narrowRecipeDocumentFacts: 非对象/缺核心字段 = null(不猜测)", () => {
  assert.equal(narrowRecipeDocumentFacts(null), null);
  assert.equal(narrowRecipeDocumentFacts("doc"), null);
  assert.equal(narrowRecipeDocumentFacts({ title: "t" }), null);
});
