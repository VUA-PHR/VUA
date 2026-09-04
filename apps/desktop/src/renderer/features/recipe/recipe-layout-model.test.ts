import assert from "node:assert/strict";
import { test } from "vitest";
import type { GraphPoint } from "./recipe-model.ts";
import {
  GRAPH_WORLD_LIMIT,
  emptyRecipeLayouts,
  isCustomized,
  mergePoints,
  nudgePoint,
  parseStoredLayouts,
  pinAt,
  writeRecipeLayout,
} from "./recipe-layout-model.ts";

function points(entries: Array<[string, GraphPoint]>): Map<string, GraphPoint> {
  return new Map(entries);
}

test("pinAt:钉住目标点;未知 id 不动;越界钳制到世界上限", () => {
  const map = points([["a", { x: 0, y: 0 }]]);
  assert.deepEqual(pinAt(map, "a", { x: 120, y: -48 }).get("a"), { x: 120, y: -48 });
  assert.deepEqual(pinAt(map, "ghost", { x: 1, y: 1 }).get("ghost"), undefined);
  assert.deepEqual(pinAt(map, "a", { x: GRAPH_WORLD_LIMIT + 500, y: -99999 }).get("a"), {
    x: GRAPH_WORLD_LIMIT,
    y: -GRAPH_WORLD_LIMIT,
  });
});

test("nudgePoint:方向位移(像素步长);原地不动不改引用语义", () => {
  const map = points([["a", { x: 10, y: 20 }]]);
  assert.deepEqual(nudgePoint(map, "a", 16, -16).get("a"), { x: 26, y: 4 });
  assert.deepEqual(nudgePoint(map, "a", 0, 0).get("a"), { x: 10, y: 20 });
  assert.deepEqual(nudgePoint(map, "ghost", 16, 16).get("ghost"), undefined);
});

test("mergePoints:丢弃已不在图中的节点;自定义覆盖基准", () => {
  const base = points([
    ["a", { x: 0, y: 0 }],
    ["b", { x: 100, y: 0 }],
  ]);
  const overrides = points([
    ["a", { x: 33, y: 44 }],
    ["ghost", { x: 500, y: 500 }],
  ]);
  const merged = mergePoints(base, overrides);
  assert.equal(merged.has("ghost"), false);
  assert.deepEqual(merged.get("a"), { x: 33, y: 44 });
  assert.deepEqual(merged.get("b"), { x: 100, y: 0 });
});

test("isCustomized:与基准一致为 false,任一偏移为 true", () => {
  const base = points([["a", { x: 0, y: 0 }]]);
  assert.equal(isCustomized(base, points([["a", { x: 0, y: 0 }]])), false);
  assert.equal(isCustomized(base, points([["a", { x: 1, y: 0 }]])), true);
});

test("parseStoredLayouts:非法 JSON/未知版本(含废弃 v1)/畸形点一律回退空", () => {
  assert.deepEqual(parseStoredLayouts(null), emptyRecipeLayouts);
  assert.deepEqual(parseStoredLayouts("not json"), emptyRecipeLayouts);
  assert.deepEqual(parseStoredLayouts(JSON.stringify({ version: 3, byRecipe: {} })), emptyRecipeLayouts);
  // v1 格点布局(S-X-3 之前)废弃:回退空 = 回到力导自动布局
  assert.deepEqual(
    parseStoredLayouts(JSON.stringify({ version: 1, byRecipe: { r1: { a: { cx: 1, cy: 2 } } } })),
    emptyRecipeLayouts,
  );
  const mixed = parseStoredLayouts(
    JSON.stringify({
      version: 2,
      byRecipe: {
        r1: {
          ok: { x: 1, y: 2 },
          badFloatOverflow: { x: GRAPH_WORLD_LIMIT * 2, y: 0 },
          badShape: "x",
          badNaN: { x: NaN, y: 0 },
        },
      },
    }),
  );
  assert.deepEqual(mixed.byRecipe.r1, { ok: { x: 1, y: 2 } });
});

test("writeRecipeLayout:写入按 recipeId 分桶;null 清桶不留墓碑", () => {
  const stored = writeRecipeLayout(emptyRecipeLayouts, "r1", points([["a", { x: 1, y: 2 }]]));
  assert.deepEqual(stored.byRecipe.r1, { a: { x: 1, y: 2 } });
  const cleared = writeRecipeLayout(stored, "r1", null);
  assert.deepEqual(cleared, emptyRecipeLayouts);
  // 序列化 round-trip
  assert.deepEqual(parseStoredLayouts(JSON.stringify(stored)), stored);
});
