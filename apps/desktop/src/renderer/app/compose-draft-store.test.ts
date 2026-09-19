import { expect, test } from "vitest";
import {
  composeAddItem,
  composeDraftToSaveDocument,
  composeRemoveItem,
  composeSaved,
  composeSetNameHint,
  composeUndo,
  emptyComposeDraft,
} from "./compose-draft-store.ts";
import { composeSaveBlocked } from "./compose-save-chain.ts";

/* 搭配草稿共享状态(019 批 B,UI-03):加入/移除/撤销/保存对齐的纯函数
 * 覆盖。会话概念(不进 localStorage);撤销只回退本地编辑;保存对齐由
 * recipe.save 成功回执驱动(挂载选择器 nameHint=用户命名提示,core 路由
 * 裁定零词表扩展)。 */

const item = (id: string) => ({
  warehouseItemId: id,
  title: `条目 ${id}`,
  role: null,
  nameHint: null,
});
const itemWithHint = (id: string, hint: string | null) => ({ ...item(id), nameHint: hint });
/** 固定时钟(BG-18 确定性):纯函数同输入恒同输出 */
const T0 = "2026-09-12T02:00:00.000Z";
const T1 = "2026-09-12T03:00:00.000Z";

test("composeAddItem: 加入素材并压撤销栈;同身份幂等;addedAt=注入时钟", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"), T0);
  expect(s1.items).toHaveLength(1);
  expect(s1.items[0]?.addedAt).toBe(T0);
  expect(s1.dirty).toBe(true);
  expect(s1.undoStack).toHaveLength(1);
  // 幂等:同素材重复加入无操作、无栈增长
  const s2 = composeAddItem(s1, item("wh-1"), T1);
  expect(s2.items).toHaveLength(1);
  expect(s2.undoStack).toHaveLength(1);
  // 不同素材正常加入
  const s3 = composeAddItem(s1, item("wh-2"), T1);
  expect(s3.items).toHaveLength(2);
  expect(s3.undoStack).toHaveLength(2);
  // 确定性(BG-18):同输入恒同输出
  expect(composeAddItem(emptyComposeDraft, item("wh-1"), T0)).toEqual(s1);
});

test("composeRemoveItem: 按身份移除并压栈;未知身份无操作", () => {
  const s1 = composeAddItem(composeAddItem(emptyComposeDraft, item("wh-1"), T0), item("wh-2"), T1);
  const s2 = composeRemoveItem(s1, "wh-1");
  expect(s2.items.map((i) => i.warehouseItemId)).toEqual(["wh-2"]);
  // 栈深度=历史编辑次数(两次加入＋一次移除)
  expect(s2.undoStack).toHaveLength(3);
  const s3 = composeRemoveItem(s1, "unknown");
  expect(s3).toBe(s1);
});

test("composeUndo: 回退上一本地编辑;空栈无操作", () => {
  expect(composeUndo(emptyComposeDraft)).toBe(emptyComposeDraft);
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"), T0);
  const s2 = composeAddItem(s1, item("wh-2"), T1);
  const undone = composeUndo(s2);
  expect(undone.items).toHaveLength(1);
  const undoneTwice = composeUndo(undone);
  expect(undoneTwice.items).toHaveLength(0);
  expect(undoneTwice.undoStack).toHaveLength(0);
});

test("composeUndo: 回到空草稿的 dirty 语义(BG-18)——从未保存=false,已保存=true", () => {
  // 从未保存:回空草稿 = 无未保存差异
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"), T0);
  const undoneToEmpty = composeUndo(s1);
  expect(undoneToEmpty.items).toHaveLength(0);
  expect(undoneToEmpty.dirty).toBe(false);
  // 已保存:回空草稿 = 内容偏离已保存文档,仍是未保存差异
  const saved = composeSaved(s1, "recipe-1", 1);
  const grown = composeAddItem(saved, item("wh-2"), T1);
  const undone = composeUndo(grown);
  expect(undone.dirty).toBe(true);
  expect(undone.saved).toEqual({ recipeId: "recipe-1", revision: 1 });
});

test("composeSaved: 保存对齐清除脏标记(saved 身份入状态)", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"), T0);
  expect(s1.dirty).toBe(true);
  const saved = composeSaved(s1, "recipe-1", 7);
  expect(saved.dirty).toBe(false);
  expect(saved.saved).toEqual({ recipeId: "recipe-1", revision: 7 });
});

test("composeDraftToSaveDocument: 草稿→recipe v0.3 保存文档(entrypoint=nameHint 用户输入)", () => {
  const now = "2026-09-10T08:00:00.000Z";
  const doc = composeDraftToSaveDocument({
    savedRecipeId: null,
    savedRevision: 0,
    items: [
      { warehouseItemId: "wh-1", title: "夏季制服", role: "outfit", nameHint: null, addedAt: now },
      { warehouseItemId: "wh-2", title: "发型", role: "hair", nameHint: "my-hair-entry", addedAt: now },
    ],
    now,
  });
  expect(doc).not.toBeNull();
  expect(doc?.formatVersion).toBe("0.3");
  expect(doc?.assets).toHaveLength(2);
  expect(doc?.instances).toHaveLength(2);
  expect(doc?.instances[0]?.entrypoint).toEqual({
    selectorId: "wh-1-entrypoint",
    kind: "user_named_entrypoint",
    nameHint: "夏季制服",
  });
  expect(doc?.instances[1]?.entrypoint?.nameHint).toBe("my-hair-entry");
});

test("composeDraftToSaveDocument: 空草稿 = null(不伪造空文档)", () => {
  expect(composeDraftToSaveDocument({ savedRecipeId: null, savedRevision: 0, items: [], now: "x" })).toBeNull();
});

/* ---- D3(用户裁定 2026-09-20「不该让用户填写」)回归钉:挂载名称自动派生
 * 与保存链贯通——加入草稿即派生,无须用户输入即可保存;显式清空仍如实阻止 ---- */

test("D3 自动派生:加入草稿时 nameHint 未指定 → 派生为条目 displayName(title)", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"), T0);
  expect(s1.items[0]?.nameHint).toBe("条目 wh-1");
  // 两套 UI 同一规则:UI 调用面传入的即 null(ComposePage / forest root 同形)
  expect(composeAddItem(emptyComposeDraft, itemWithHint("wh-2", null), T0).items[0]?.nameHint).toBe(
    "条目 wh-2",
  );
  // 显式指定优先:用户提示不被派生覆盖
  expect(composeAddItem(emptyComposeDraft, itemWithHint("wh-3", "my-hint"), T0).items[0]?.nameHint).toBe(
    "my-hint",
  );
});

test("D3 保存链贯通:自动派生值过 composeSaveBlocked,文档映射取派生值", () => {
  const s1 = composeAddItem(
    composeAddItem(emptyComposeDraft, item("wh-1"), T0),
    item("wh-2"),
    T1,
  );
  // 校验对自动填充值恒过:全派生草稿可直接提交
  expect(composeSaveBlocked(s1.items)).toBe(false);
  const doc = composeDraftToSaveDocument({
    savedRecipeId: null,
    savedRevision: 0,
    items: s1.items,
    now: T1,
  });
  expect(doc).not.toBeNull();
  expect(doc?.instances.map((instance) => instance.entrypoint.nameHint)).toEqual([
    "条目 wh-1",
    "条目 wh-2",
  ]);
});

test("D3 显式清空 = 显式未命名:守卫如实阻止(自动派生不吞用户覆盖)", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"), T0);
  expect(composeSaveBlocked(s1.items)).toBe(false);
  const cleared = composeSetNameHint(s1, "wh-1", "");
  expect(cleared.items[0]?.nameHint).toBeNull();
  expect(composeSaveBlocked(cleared.items)).toBe(true);
});
