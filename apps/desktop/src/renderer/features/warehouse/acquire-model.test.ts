import assert from "node:assert/strict";
import { test } from "vitest";
import { sizeText } from "./acquire-model.ts";

test("sizeText: B 级整数,不进位", () => {
  assert.deepEqual(sizeText(0), { amount: "0", unitKey: "sizeB" });
  assert.deepEqual(sizeText(512), { amount: "512", unitKey: "sizeB" });
  assert.deepEqual(sizeText(1023), { amount: "1023", unitKey: "sizeB" });
});

test("sizeText: KB/MB/GB 进位与一位小数去尾零", () => {
  assert.deepEqual(sizeText(1024), { amount: "1", unitKey: "sizeKb" });
  assert.deepEqual(sizeText(1536), { amount: "1.5", unitKey: "sizeKb" });
  assert.deepEqual(sizeText(48_332_800), { amount: "46.1", unitKey: "sizeMb" });
  assert.deepEqual(sizeText(2 * 1024 * 1024 * 1024), { amount: "2", unitKey: "sizeGb" });
});

test("sizeText: 非法输入回落 0 B,不猜测", () => {
  assert.deepEqual(sizeText(Number.NaN), { amount: "0", unitKey: "sizeB" });
  assert.deepEqual(sizeText(-5), { amount: "0", unitKey: "sizeB" });
  assert.deepEqual(sizeText(Number.POSITIVE_INFINITY), { amount: "0", unitKey: "sizeB" });
});
