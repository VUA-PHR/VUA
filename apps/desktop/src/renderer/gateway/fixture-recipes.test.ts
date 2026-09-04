import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { fixtureRecipeDocs } from "./fixture-recipes-data.ts";
import { fixtureRecipeGraph } from "./fixture-recipes.ts";
import { CURRENT_RECIPE_ID } from "./model-production-port.ts";

/**
 * Recipe fixture 双防线:
 * 1. 漂移守卫——内嵌 TS 副本必须与 schemas/recipe/v1/fixtures/*.recipe.json
 *    逐字节同源(JSON 为单一事实源;内嵌是 node --test 无法 import JSON 的
 *    工程折衷,见 fixture-recipes-data.ts 头注);
 * 2. 行为守卫——fixtureRecipeGraph 的 id 路由:当前配方→rich,
 *    "fixture:<词干>"→对应场景,未知 id 诚实 not-connected。
 */

const fixturesDir = fileURLToPath(
  new URL("../../../../../schemas/recipe/v1/fixtures", import.meta.url),
);

test("内嵌副本与 schemas/recipe/v1/fixtures 的 JSON 源一致(无漂移)", () => {
  for (const [stem, embedded] of fixtureRecipeDocs) {
    const source = JSON.parse(
      readFileSync(`${fixturesDir}/${stem}.recipe.json`, "utf8"),
    ) as unknown;
    assert.deepStrictEqual(embedded, source, `${stem}.recipe.json 与内嵌副本不一致`);
  }
});

test("fixtureRecipeGraph:当前配方映射 rich 场景,节点/边齐备", () => {
  const graph = fixtureRecipeGraph(CURRENT_RECIPE_ID);
  assert.equal(graph.kind, "graph");
  if (graph.kind !== "graph") return;
  assert.ok(graph.nodes.length > 0);
  assert.ok(graph.edges.length > 0);
  assert.equal(graph.conflicts.length, 0);
});

test("fixtureRecipeGraph:fixture:<词干> 直达 conflict 场景并产生冲突组", () => {
  const graph = fixtureRecipeGraph("fixture:conflict");
  assert.equal(graph.kind, "graph");
  if (graph.kind !== "graph") return;
  assert.equal(graph.conflicts.length, 1);
  const conflicted = new Set(graph.conflicts[0]!.nodeIds);
  assert.ok(conflicted.has("avatar_main") && conflicted.has("avatar_alt"));
});

test("fixtureRecipeGraph:missing-assets 场景列出本地缺失素材", () => {
  const graph = fixtureRecipeGraph("fixture:missing-assets");
  assert.equal(graph.kind, "graph");
  if (graph.kind !== "graph") return;
  assert.deepEqual([...graph.missing].sort(), ["animation_missing", "outfit_missing"]);
});

test("fixtureRecipeGraph:未知 id 诚实 not-connected,不返回猜测图谱", () => {
  assert.equal(fixtureRecipeGraph("no-such-recipe").kind, "not-connected");
  assert.equal(fixtureRecipeGraph("fixture:no-such-stem").kind, "not-connected");
});
