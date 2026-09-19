import assert from "node:assert/strict";
import { test } from "vitest";
import {
  SPLASH_FILL_BUDGET_MS,
  SPLASH_FLATTENED_HOLD_MS,
  buildSplashGrid,
  splashVisibleMs,
} from "./boot-splash-model.ts";

test("方柱网格:覆盖整个窗口(列×pitch ≥ 宽度,行×pitch ≥ 高度)", () => {
  for (const [w, h] of [
    [1280, 800],
    [1920, 1080],
    [640, 480],
  ] as const) {
    const grid = buildSplashGrid(w, h);
    assert.ok(grid.cols * grid.pitch >= w, `${w}px 宽未被覆盖`);
    assert.ok(grid.rows * grid.pitch >= h, `${h}px 高未被覆盖`);
    assert.equal(grid.cells.length, grid.cols * grid.rows);
  }
});

test("方柱网格:列内延迟自上而下严格递增(常规窗口)", () => {
  const grid = buildSplashGrid(1280, 800);
  for (let col = 0; col < grid.cols; col += 1) {
    for (let row = 1; row < grid.rows; row += 1) {
      const above = grid.cells[(row - 1) * grid.cols + col]!;
      const below = grid.cells[row * grid.cols + col]!;
      assert.ok(
        below.delayMs > above.delayMs,
        `列 ${col} 行 ${row} 未严格递增:${above.delayMs} → ${below.delayMs}`,
      );
    }
  }
});

test("方柱网格:巨大窗口缩放下列内顺序非降,且最大延迟不超预算", () => {
  const grid = buildSplashGrid(8000, 6000);
  for (let col = 0; col < grid.cols; col += 1) {
    for (let row = 1; row < grid.rows; row += 1) {
      const above = grid.cells[(row - 1) * grid.cols + col]!;
      const below = grid.cells[row * grid.cols + col]!;
      assert.ok(below.delayMs >= above.delayMs);
    }
  }
  const max = Math.max(...grid.cells.map((c) => c.delayMs));
  assert.ok(max <= SPLASH_FILL_BUDGET_MS, `最大延迟 ${max} 超出预算`);
});

test("方柱网格:同一视口两次构建结果全等(确定性)", () => {
  const a = buildSplashGrid(1440, 900);
  const b = buildSplashGrid(1440, 900);
  assert.deepEqual(a, b);
});

test("方柱网格:品牌色稀疏点缀——基底占绝对多数,紫/橙均出现", () => {
  const grid = buildSplashGrid(1920, 1080);
  const tones = { base: 0, purple: 0, orange: 0 };
  for (const cell of grid.cells) tones[cell.tone] += 1;
  const total = grid.cells.length;
  assert.ok(tones.base / total > 0.8, `基底占比 ${tones.base / total} 过低`);
  assert.ok(tones.purple > 0 && tones.orange > 0, "品牌色点缀缺失");
  assert.ok(tones.purple + tones.orange < total * 0.2, "品牌色过密");
});

test("可见时长:动效压平时的驻留显著短于完整动画", () => {
  assert.ok(splashVisibleMs(true) < splashVisibleMs(false));
  assert.equal(splashVisibleMs(true), SPLASH_FLATTENED_HOLD_MS);
});
