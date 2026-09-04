import assert from "node:assert/strict";
import { test } from "vitest";
import { busyVisible, MIN_BUSY_MS, monotonicDone } from "./busy-timing.ts";

test("monotonicDone: 进度只进不退;首值(null)取当前", () => {
  assert.equal(monotonicDone(null, 3), 3);
  assert.equal(monotonicDone(3, 5), 5);
  assert.equal(monotonicDone(5, 3), 5);
  assert.equal(monotonicDone(5, 5), 5);
});

test("busyVisible: 未开始不可见;进行中可见", () => {
  assert.equal(busyVisible({ startedAt: null, endedAt: null, now: 1000 }), false);
  assert.equal(busyVisible({ startedAt: 1000, endedAt: null, now: 1001 }), true);
});

test("busyVisible: 亚帧结束补满最小窗,到点撤下", () => {
  assert.equal(busyVisible({ startedAt: 1000, endedAt: 1030, now: 1030 }), true);
  assert.equal(busyVisible({ startedAt: 1000, endedAt: 1030, now: 1699 }), true);
  assert.equal(busyVisible({ startedAt: 1000, endedAt: 1030, now: 1700 }), false);
});

test("busyVisible: 长任务超过最小窗,结束即撤不拖延", () => {
  assert.equal(busyVisible({ startedAt: 1000, endedAt: 5000, now: 5000 }), false);
});

test("busyVisible: minMs 可覆盖;MIN_BUSY_MS 量级守卫(防误改小)", () => {
  assert.equal(busyVisible({ startedAt: 0, endedAt: 50, now: 99, minMs: 100 }), true);
  assert.equal(busyVisible({ startedAt: 0, endedAt: 50, now: 100, minMs: 100 }), false);
  assert.ok(MIN_BUSY_MS >= 500);
});
