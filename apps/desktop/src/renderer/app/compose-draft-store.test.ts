import { expect, test } from "vitest";
import {
  composeAddItem,
  composeDraftToSaveDocument,
  composeRemoveItem,
  composeSaved,
  composeUndo,
  emptyComposeDraft,
} from "./compose-draft-store.ts";

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

test("composeAddItem: 加入素材并压撤销栈;同身份幂等", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"));
  expect(s1.items).toHaveLength(1);
  expect(s1.dirty).toBe(true);
  expect(s1.undoStack).toHaveLength(1);
  // 幂等:同素材重复加入无操作、无栈增长
  const s2 = composeAddItem(s1, item("wh-1"));
  expect(s2.items).toHaveLength(1);
  expect(s2.undoStack).toHaveLength(1);
  // 不同素材正常加入
  const s3 = composeAddItem(s1, item("wh-2"));
  expect(s3.items).toHaveLength(2);
  expect(s3.undoStack).toHaveLength(2);
});

test("composeRemoveItem: 按身份移除并压栈;未知身份无操作", () => {
  const s1 = composeAddItem(composeAddItem(emptyComposeDraft, item("wh-1")), item("wh-2"));
  const s2 = composeRemoveItem(s1, "wh-1");
  expect(s2.items.map((i) => i.warehouseItemId)).toEqual(["wh-2"]);
  // 栈深度=历史编辑次数(两次加入＋一次移除)
  expect(s2.undoStack).toHaveLength(3);
  const s3 = composeRemoveItem(s1, "unknown");
  expect(s3).toBe(s1);
});

test("composeUndo: 回退上一本地编辑;空栈无操作", () => {
  expect(composeUndo(emptyComposeDraft)).toBe(emptyComposeDraft);
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"));
  const s2 = composeAddItem(s1, item("wh-2"));
  const undone = composeUndo(s2);
  expect(undone.items).toHaveLength(1);
  const undoneTwice = composeUndo(undone);
  expect(undoneTwice.items).toHaveLength(0);
  expect(undoneTwice.undoStack).toHaveLength(0);
});

test("composeSaved: 保存对齐清除脏标记(saved 身份入状态)", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"));
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
