import { expect, test } from "vitest";
import {
  composeAddItem,
  composeRemoveItem,
  composeSaved,
  composeUndo,
  emptyComposeDraft,
} from "./compose-draft-store.ts";

/* 搭配草稿共享状态(019 批 B,UI-03):加入/移除/撤销/保存对齐的纯函数
 * 覆盖。会话概念(不进 localStorage);撤销只回退本地编辑;保存对齐由
 * recipe.save 成功回执驱动(当前 entrypoint 事实源未接入,保存诚实禁用)。 */

const item = (id: string) => ({ warehouseItemId: id, title: `条目 ${id}`, role: null });

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

test("composeSaved: 保存对齐清除脏标记(修订号由服务端回执承载)", () => {
  const s1 = composeAddItem(emptyComposeDraft, item("wh-1"));
  expect(s1.dirty).toBe(true);
  const saved = composeSaved(s1, 7);
  expect(saved.dirty).toBe(false);
  expect(saved.items).toEqual(s1.items);
});
