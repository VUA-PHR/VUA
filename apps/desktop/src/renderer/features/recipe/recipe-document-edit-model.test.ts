import assert from "node:assert/strict";
import { test } from "vitest";
import {
  recipeDocumentAdditionIds,
  recipeDocumentAssetIds,
  recipeDocumentEditAddItem,
  recipeDocumentEditBlocked,
  recipeDocumentEditRemoveAddition,
  recipeDocumentEditSaved,
  recipeDocumentEditSelected,
  recipeDocumentEditToSaveDocument,
  type RecipeDocumentEditState,
} from "./recipe-document-edit-model.ts";
import {
  findIdenticalRecipe,
  recipeDocumentCompareKey,
} from "../../app/compose-save-dedup.ts";
import type { ComposeDraftItem } from "../../app/compose-draft-store.ts";

/* 选中配方文档编辑链纯模型(029 A2 消费切片三):平行文档编辑链、同一保存
 * 链形状、同一守卫集。固定时钟(BG-18 确定性)同 compose-draft-store.test。 */

const T0 = "2026-09-22T02:00:00.000Z";
const T1 = "2026-09-22T03:00:00.000Z";

const item = (id: string, overrides: Partial<ComposeDraftItem> = {}): ComposeDraftItem => ({
  warehouseItemId: id,
  title: `条目 ${id}`,
  role: null,
  nameHint: null,
  addedAt: T0,
  ...overrides,
});

/** 底稿文档(v0.3 形:含用户未编辑字段与未知扩展字段,验证透明合并) */
function baseDocument(): Record<string, unknown> {
  return {
    formatVersion: "0.3",
    recipeId: "0190recipe000000000000f7",
    title: "既有配方",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    assets: [
      {
        id: "wh-1",
        role: "avatar_base",
        label: "素体",
        sourceRef: { warehouseItemId: "wh-1", role: "original" },
      },
    ],
    instances: [
      {
        id: "wh-1-instance-1",
        assetId: "wh-1",
        entrypoint: {
          selectorId: "wh-1-entrypoint",
          kind: "user_named_entrypoint",
          nameHint: "素体",
        },
        enabled: true,
      },
    ],
    relations: [],
    /** 未知扩展字段:透明合并必须原样保留 */
    customExtension: { keep: true },
  };
}

function editState(overrides: Partial<RecipeDocumentEditState> = {}): RecipeDocumentEditState {
  return {
    recipeId: "0190recipe000000000000f7",
    baseRevision: 4,
    document: baseDocument(),
    additions: [],
    dirty: false,
    lastSavedRevision: null,
    ...overrides,
  };
}

test("recipeDocumentEditSelected: 全新编辑会话;身份相同保留待保存新增(重取不清空用户编辑);身份变更即重置", () => {
  const fresh = recipeDocumentEditSelected(null, "r-1", 4, baseDocument());
  assert.equal(fresh.dirty, false);
  assert.equal(fresh.lastSavedRevision, null);
  // 身份相同:文档刷新为权威读面,但待保存新增/回执档案保留
  const withPending = recipeDocumentEditAddItem({ ...fresh, document: baseDocument() }, item("wh-2"), T0);
  assert.equal(withPending.dirty, true);
  const refetched = recipeDocumentEditSelected(withPending, "r-1", 4, baseDocument());
  assert.equal(refetched.dirty, true);
  assert.equal(refetched.additions.length, 1);
  // 身份变更(选了另一配方):新会话,待保存不跨配方携带
  const switched = recipeDocumentEditSelected(withPending, "r-2", 1, baseDocument());
  assert.equal(switched.dirty, false);
  assert.equal(switched.additions.length, 0);
  assert.equal(switched.lastSavedRevision, null);
});

test("recipeDocumentEditAddItem: D3 同律 nameHint 自动派生;身份幂等(待保存列表与底稿 assets 双层)", () => {
  const state = editState();
  const added = recipeDocumentEditAddItem(state, item("wh-2"), T0);
  assert.equal(added.additions.length, 1);
  assert.equal(added.additions[0]?.nameHint, "条目 wh-2");
  assert.equal(added.additions[0]?.addedAt, T0);
  assert.equal(added.dirty, true);
  // 幂等:同素材重复加入无操作
  assert.equal(recipeDocumentEditAddItem(added, item("wh-2"), T1), added);
  // 底稿 assets 已含同 id 素材:加入为无操作(素材集只增不减)
  assert.equal(recipeDocumentEditAddItem(state, item("wh-1"), T0), state);
  // 显式 nameHint 优先于派生
  const explicit = recipeDocumentEditAddItem(state, item("wh-3", { nameHint: "自定义" }), T0);
  assert.equal(explicit.additions[0]?.nameHint, "自定义");
});

test("recipeDocumentEditRemoveAddition: 移除待保存新增;清空即回到无未保存差异;未知身份无操作", () => {
  const added = recipeDocumentEditAddItem(
    recipeDocumentEditAddItem(editState(), item("wh-2"), T0),
    item("wh-3"),
    T0,
  );
  const removed = recipeDocumentEditRemoveAddition(added, "wh-2");
  assert.deepEqual(removed.additions.map((i) => i.warehouseItemId), ["wh-3"]);
  assert.equal(removed.dirty, true);
  const emptied = recipeDocumentEditRemoveAddition(removed, "wh-3");
  assert.equal(emptied.additions.length, 0);
  assert.equal(emptied.dirty, false);
  assert.equal(recipeDocumentEditRemoveAddition(added, "wh-unknown"), added);
});

test("recipeDocumentEditSaved: 回执对齐前移底稿修订并清空待保存;在途新增保留且 dirty 维持", () => {
  const added = recipeDocumentEditAddItem(editState(), item("wh-2"), T0);
  const savedAll = recipeDocumentEditSaved(added, 5);
  assert.equal(savedAll.baseRevision, 5);
  assert.equal(savedAll.lastSavedRevision, 5);
  assert.equal(savedAll.additions.length, 0);
  assert.equal(savedAll.dirty, false);
  // 在途期间又加入了 wh-3:提交集只有 wh-2 → wh-3 保留、dirty 维持
  const inflight = recipeDocumentEditAddItem(added, item("wh-3"), T1);
  const savedPartial = recipeDocumentEditSaved(inflight, 5, added.additions);
  assert.equal(savedPartial.baseRevision, 5);
  assert.deepEqual(savedPartial.additions.map((i) => i.warehouseItemId), ["wh-3"]);
  assert.equal(savedPartial.dirty, true);
});

test("recipeDocumentEditToSaveDocument: 透明合并保留底稿全部字段;追加行与 compose 映射同形;空保存拒绝", () => {
  const clean = editState();
  assert.equal(recipeDocumentEditToSaveDocument(clean, T0), null);
  const added = recipeDocumentEditAddItem(editState(), item("wh-2"), T0);
  const merged = recipeDocumentEditToSaveDocument(added, T1);
  assert.ok(merged !== null);
  // 用户未编辑字段不重写(标题/createdAt/未知扩展字段原样透传)
  assert.equal(merged.title, "既有配方");
  assert.equal(merged.createdAt, "2026-09-01T00:00:00.000Z");
  assert.deepEqual(merged.customExtension, { keep: true });
  // 命令面事实:身份、baseRevision 版本链、updatedAt
  assert.equal(merged.recipeId, added.recipeId);
  assert.equal(merged.baseRevision, 4);
  assert.equal(merged.updatedAt, T1);
  // assets 追加,role 缺省 other,sourceRef 指回仓储条目
  const assets = merged.assets as Array<Record<string, unknown>>;
  assert.equal(assets.length, 2);
  assert.deepEqual(assets[1], {
    id: "wh-2",
    role: "other",
    label: "条目 wh-2",
    sourceRef: { warehouseItemId: "wh-2", role: "original" },
  });
  // instances 排位接续底稿(user_named_entrypoint + nameHint)
  const instances = merged.instances as Array<Record<string, unknown>>;
  assert.equal(instances.length, 2);
  assert.equal(instances[1]?.id, "wh-2-instance-2");
  assert.deepEqual(instances[1]?.entrypoint, {
    selectorId: "wh-2-entrypoint",
    kind: "user_named_entrypoint",
    nameHint: "条目 wh-2",
  });
  // 确定性(BG-18):同输入恒同输出
  assert.deepEqual(recipeDocumentEditToSaveDocument(added, T1), merged);
});

test("recipeDocumentEditBlocked: 与搭配草稿同一守卫(空白 nameHint 阻止;自动派生值恒过)", () => {
  assert.equal(recipeDocumentEditBlocked([item("wh-2", { nameHint: null })]), true);
  assert.equal(recipeDocumentEditBlocked([item("wh-2", { nameHint: "  " })]), true);
  // 自动派生后的待保存新增(加入时 nameHint 已派生为条目名)恒过
  const added = recipeDocumentEditAddItem(editState(), item("wh-2"), T0);
  assert.equal(recipeDocumentEditBlocked(added.additions), false);
});

test("查重比对(D5 同一比对面): 合并文档判等键≠底稿;同内容孪生配方可命中确认路径", () => {
  const added = recipeDocumentEditAddItem(editState(), item("wh-2"), T0);
  const merged = recipeDocumentEditToSaveDocument(added, T1);
  assert.ok(merged !== null);
  const baseKey = recipeDocumentCompareKey(baseDocument());
  const mergedKey = recipeDocumentCompareKey(merged);
  assert.notEqual(baseKey, mergedKey);
  // 孪生配方(同内容、不同身份):D5 命中,弹确认框由用户裁决
  const twin = { ...structuredClone(merged), recipeId: "twin", title: "孪生" };
  const hit = findIdenticalRecipe(mergedKey ?? "", [
    { recipeId: "twin", revision: 1, compareKey: recipeDocumentCompareKey(twin) },
  ]);
  assert.deepEqual(hit, { recipeId: "twin", revision: 1 });
  // 内容不同的候选不命中
  assert.equal(
    findIdenticalRecipe(mergedKey ?? "", [
      { recipeId: "r-9", revision: 2, compareKey: baseKey },
    ]),
    null,
  );
});

test("recipeDocumentAssetIds/AdditionIds: 选择器「已在本配方」集的判定源", () => {
  const ids = recipeDocumentAssetIds(baseDocument());
  assert.ok(ids.has("wh-1"));
  assert.ok(!ids.has("wh-2"));
  // 非数组 assets = 空集,不猜测
  assert.equal(recipeDocumentAssetIds({}).size, 0);
  const added = recipeDocumentEditAddItem(editState(), item("wh-2"), T0);
  assert.deepEqual([...recipeDocumentAdditionIds(added.additions)], ["wh-2"]);
});
