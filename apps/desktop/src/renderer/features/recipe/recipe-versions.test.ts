import { test } from "vitest";
import assert from "node:assert/strict";

import {
  RECIPE_VERSIONS_CAP,
  appendVersion,
  emptyRecipeVersions,
  parseStoredVersions,
  pointsMatchSnapshot,
  removeVersion,
  type RecipeVersionEntry,
} from "./recipe-versions.ts";

function entry(id: string, savedAt: string, note: string | null = null): RecipeVersionEntry {
  return {
    id,
    savedAt,
    note,
    nodeCount: 3,
    missingCount: 0,
    points: {
      "node-a": { x: 0, y: 0 },
      "node-b": { x: 150, y: -80 },
    },
  };
}

test("parseStoredVersions 对非法输入与未知版本回退空结构", () => {
  assert.deepEqual(parseStoredVersions(null), emptyRecipeVersions);
  assert.deepEqual(parseStoredVersions(""), emptyRecipeVersions);
  assert.deepEqual(parseStoredVersions("{broken"), emptyRecipeVersions);
  assert.deepEqual(parseStoredVersions('"just-a-string"'), emptyRecipeVersions);
  assert.deepEqual(parseStoredVersions('{"version":99,"byRecipe":{}}'), emptyRecipeVersions);
  // v1(格点 cells,S-XI 之前)废弃:回退空 = 从零开始记版本
  assert.deepEqual(parseStoredVersions('{"version":1,"byRecipe":{}}'), emptyRecipeVersions);
});

test("parseStoredVersions 过滤畸形条目,合法快照完整往返", () => {
  const raw = JSON.stringify({
    version: 2,
    byRecipe: {
      "recipe-a": [
        entry("v-ok", "2026-08-27T00:00:00.000Z", "ok"),
        { id: "", savedAt: "2026-08-27T01:00:00.000Z", note: null, nodeCount: 1, missingCount: 0, points: {} },
        { id: "v-no-date", savedAt: "", note: null, nodeCount: 1, missingCount: 0, points: {} },
        { id: "v-bad-note", savedAt: "2026-08-27T02:00:00.000Z", note: 42, nodeCount: 1, missingCount: 0, points: {} },
        "not-an-object",
      ],
    },
  });
  const list = parseStoredVersions(raw).byRecipe["recipe-a"];
  assert.ok(list);
  assert.equal(list.length, 1);
  assert.equal(list[0]!.id, "v-ok");
  assert.equal(list[0]!.note, "ok");
  const roundTrip = parseStoredVersions(JSON.stringify({ version: 2, byRecipe: { "recipe-a": list } }));
  assert.deepEqual(roundTrip.byRecipe["recipe-a"], list);
});

test("parseStoredVersions 保留条目但丢弃畸形点", () => {
  const raw = JSON.stringify({
    version: 2,
    byRecipe: {
      "recipe-a": [
        {
          id: "v-dirty",
          savedAt: "2026-08-27T00:00:00.000Z",
          note: null,
          nodeCount: 3,
          missingCount: 0,
          points: {
            "node-a": { x: 0, y: 0 },
            "node-b": { x: 99999, y: 0 },
            "node-c": { x: 0, y: "x" },
            "node-d": null,
          },
        },
      ],
    },
  });
  const list = parseStoredVersions(raw).byRecipe["recipe-a"]!;
  assert.equal(list.length, 1);
  assert.deepEqual(list[0]!.points, { "node-a": { x: 0, y: 0 } });
});

test("parseStoredVersions 每桶截断到上限", () => {
  const many = Array.from({ length: RECIPE_VERSIONS_CAP + 5 }, (_, index) =>
    entry(`v-${index}`, new Date(2026, 0, 1, index).toISOString()),
  );
  const stored = parseStoredVersions(
    JSON.stringify({ version: 2, byRecipe: { "recipe-a": many } }),
  );
  assert.equal(stored.byRecipe["recipe-a"]!.length, RECIPE_VERSIONS_CAP);
  assert.equal(stored.byRecipe["recipe-a"]![0]!.id, "v-5");
});

test("appendVersion 追加并淘汰最旧快照", () => {
  let stored = emptyRecipeVersions;
  for (let index = 0; index < RECIPE_VERSIONS_CAP + 1; index += 1) {
    stored = appendVersion(stored, "recipe-a", entry(`v-${index}`, new Date(2026, 0, 1, index).toISOString()));
  }
  const list = stored.byRecipe["recipe-a"]!;
  assert.equal(list.length, RECIPE_VERSIONS_CAP);
  assert.equal(list[0]!.id, "v-1");
  assert.equal(list[list.length - 1]!.id, `v-${RECIPE_VERSIONS_CAP}`);
});

test("removeVersion 删除指定快照并在空桶时移除配方记录", () => {
  let stored = appendVersion(emptyRecipeVersions, "recipe-a", entry("v-1", "2026-08-27T00:00:00.000Z"));
  stored = appendVersion(stored, "recipe-a", entry("v-2", "2026-08-27T01:00:00.000Z"));
  const afterOne = removeVersion(stored, "recipe-a", "v-1");
  assert.deepEqual(afterOne.byRecipe["recipe-a"]!.map((item) => item.id), ["v-2"]);
  const afterAll = removeVersion(afterOne, "recipe-a", "v-2");
  assert.equal(afterAll.byRecipe["recipe-a"], undefined);
  assert.deepEqual(removeVersion(stored, "recipe-x", "v-1"), stored);
});

test("pointsMatchSnapshot 覆盖相等、不等与缺键三种情形", () => {
  const snapshot = {
    "node-a": { x: 0, y: 0 },
    "node-b": { x: 150, y: -80 },
  };
  const equal = new Map<string, { x: number; y: number }>([
    ["node-a", { x: 0, y: 0 }],
    ["node-b", { x: 150, y: -80 }],
  ]);
  assert.equal(pointsMatchSnapshot(equal, snapshot), true);

  const moved = new Map<string, { x: number; y: number }>([
    ["node-a", { x: 0, y: 0 }],
    ["node-b", { x: 151, y: -80 }],
  ]);
  assert.equal(pointsMatchSnapshot(moved, snapshot), false);

  const missing = new Map<string, { x: number; y: number }>([
    ["node-a", { x: 0, y: 0 }],
  ]);
  assert.equal(pointsMatchSnapshot(missing, snapshot), false);
});
