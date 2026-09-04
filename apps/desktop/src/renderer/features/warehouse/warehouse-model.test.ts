import assert from "node:assert/strict";
import { test } from "vitest";
import {
  albumIndexFromOffset,
  emptyWarehouseQuery,
  hasActiveFilter,
  priceKind,
  toPortQuery,
} from "./warehouse-model.ts";

test("toPortQuery: 空表单不产生任何查询条件", () => {
  assert.deepEqual(toPortQuery(emptyWarehouseQuery), {});
});

test("toPortQuery: 文本去空白,空文本不下发", () => {
  assert.deepEqual(toPortQuery({ ...emptyWarehouseQuery, text: "   " }), {});
  assert.deepEqual(toPortQuery({ ...emptyWarehouseQuery, text: "  alpha " }), {
    text: "alpha",
  });
});

test("toPortQuery: 筛选条件逐项透传", () => {
  assert.deepEqual(
    toPortQuery({
      text: "x",
      availability: "deleted",
      entityType: "outfit",
      relationKind: "requires",
    }),
    {
      text: "x",
      availability: "deleted",
      entityType: "outfit",
      relationKind: "requires",
    },
  );
});

test("hasActiveFilter: 任一条件生效即为真(区分搜索空与未接入)", () => {
  assert.equal(hasActiveFilter(emptyWarehouseQuery), false);
  assert.equal(hasActiveFilter({ ...emptyWarehouseQuery, text: "a" }), true);
  assert.equal(hasActiveFilter({ ...emptyWarehouseQuery, availability: "available" }), true);
  assert.equal(hasActiveFilter({ ...emptyWarehouseQuery, entityType: "tool" }), true);
  assert.equal(hasActiveFilter({ ...emptyWarehouseQuery, relationKind: "addon_for" }), true);
});

test("priceKind: 0 为免费,缺价格为 none,其余按定价", () => {
  assert.equal(priceKind(null), "none");
  assert.equal(priceKind({ amount: "0", currency: "JPY" }), "free");
  assert.equal(priceKind({ amount: "500", currency: "JPY" }), "priced");
});

test("albumIndexFromOffset: 媒体区均分映射,边界 clamp", () => {
  // 5 张图:每段 20%,光标落入哪段显示哪张
  assert.equal(albumIndexFromOffset(0, 100, 5), 0);
  assert.equal(albumIndexFromOffset(19.9, 100, 5), 0);
  assert.equal(albumIndexFromOffset(20, 100, 5), 1);
  assert.equal(albumIndexFromOffset(99.9, 100, 5), 4);
  // 越界与退化输入 clamp,不抛错
  assert.equal(albumIndexFromOffset(-5, 100, 5), 0);
  assert.equal(albumIndexFromOffset(500, 100, 5), 4);
  assert.equal(albumIndexFromOffset(10, 0, 5), 0);
  assert.equal(albumIndexFromOffset(10, 100, 1), 0);
  assert.equal(albumIndexFromOffset(10, 100, 0), 0);
});
