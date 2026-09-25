import assert from "node:assert/strict";
import { test } from "vitest";
import {
  formatGigabytes,
  percentOf,
  usagePercents,
} from "./resource-monitor-model.ts";

/**
 * 占用查看器模型:百分比取整与边界(除零/超界钳位)、顶栏二者取高、
 * VRAM 缺席退化为仅 RAM(诚实降级,不猜值)、GiB 格式化。
 */

test("percentOf clamps to 0..100 and never divides by zero", () => {
  assert.equal(percentOf(50, 100), 50);
  assert.equal(percentOf(0, 100), 0);
  assert.equal(percentOf(200, 100), 100);
  assert.equal(percentOf(1, 0), 0);
  assert.equal(percentOf(1, -8), 0);
  assert.equal(percentOf(33, 66), 50);
});

test("dominant percent is the higher of RAM and VRAM", () => {
  const view = usagePercents({
    schemaVersion: 1,
    ramUsedBytes: 30,
    ramTotalBytes: 100,
    vramUsedBytes: 60,
    vramTotalBytes: 100,
    sampledAt: "2026-09-25T09:00:00.000Z",
  });
  assert.equal(view.ramPct, 30);
  assert.equal(view.vramPct, 60);
  assert.equal(view.dominantPct, 60);
});

test("VRAM unavailable degrades to RAM-only honestly", () => {
  const view = usagePercents({
    schemaVersion: 1,
    ramUsedBytes: 42,
    ramTotalBytes: 100,
    vramUsedBytes: null,
    vramTotalBytes: null,
    sampledAt: "2026-09-25T09:00:00.000Z",
  });
  assert.equal(view.vramPct, null);
  assert.equal(view.dominantPct, 42);
});

test("VRAM partial absence (used without total) is unavailable, not a guess", () => {
  const view = usagePercents({
    schemaVersion: 1,
    ramUsedBytes: 10,
    ramTotalBytes: 100,
    vramUsedBytes: 8,
    vramTotalBytes: null,
    sampledAt: "2026-09-25T09:00:00.000Z",
  });
  assert.equal(view.vramPct, null);
  assert.equal(view.dominantPct, 10);
});

test("formatGigabytes renders GiB with one decimal", () => {
  assert.equal(formatGigabytes(1024 ** 3), "1.0");
  assert.equal(formatGigabytes(12.34 * 1024 ** 3), "12.3");
  assert.equal(formatGigabytes(0), "0.0");
});
