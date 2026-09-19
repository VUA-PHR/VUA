/**
 * 启动开屏节奏模型(纯函数,可测):
 * 方形柱格从窗口顶部到底部依次落满,节奏全部由本文件计算,组件只负责渲染。
 * - 网格尺寸按视口与单元边长推导,pitch = 单元 + 间隙,保证整窗覆盖;
 * - 每格延迟 = 行主序(自上而下) + 列错位 + 哈希抖动,再按预算时长整体缩放,
 *   大窗口不会更慢,只改变密度;行列相对顺序在缩放下保持不变;
 * - 少量格染品牌紫/橙(稀疏点缀),其余为低透明基底;
 * - 全局动效被压平时(reduced-motion / 特效关)组件只短驻留,本模型给出驻留时长。
 */

export const SPLASH_CELL_PX = 28;
export const SPLASH_GAP_PX = 3;
/** 全部方格落满的预算时长(不含收尾静置与淡出) */
export const SPLASH_FILL_BUDGET_MS = 880;
/** 最后一格落定后的静置时长 */
export const SPLASH_HOLD_MS = 460;
/** 整体淡出时长(与 CSS transition 对齐) */
export const SPLASH_FADE_MS = 420;
/** 动效压平时的短驻留(不空等动画窗) */
export const SPLASH_FLATTENED_HOLD_MS = 320;

/** 单格收尾动画时长(与 CSS cell-in 对齐),计入可见总时长 */
export const SPLASH_CELL_SETTLE_MS = 260;

export type SplashCellTone = "base" | "purple" | "orange";

export interface SplashCell {
  readonly col: number;
  readonly row: number;
  readonly delayMs: number;
  readonly tone: SplashCellTone;
}

export interface SplashGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cell: number;
  readonly pitch: number;
  readonly cells: readonly SplashCell[];
}

/** 确定性哈希:同一 (col,row) 每次启动得到同一结果,避免闪烁感来自随机数 */
export function hash2(col: number, row: number): number {
  let h = Math.imul(col + 1, 0x9e3779b1) ^ Math.imul(row + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** 稀疏品牌色点缀:约 7% 紫、5% 橙,其余基底 */
export function cellTone(hash: number): SplashCellTone {
  const bucket = hash % 100;
  if (bucket < 7) return "purple";
  if (bucket < 12) return "orange";
  return "base";
}

/** 未缩放延迟:行主序保证列内自上而下,列错位 + 抖动避免机械感 */
export function rawDelayMs(col: number, row: number): number {
  return row * 34 + col * 26 + (hash2(col, row) % 3) * 12;
}

/**
 * 按视口构建方柱网格。延迟整体缩放到预算内:列内顺序保持(常窗严格递增,
 * 巨窗缩放到同值时非降),最大延迟不超过预算。
 */
export function buildSplashGrid(
  width: number,
  height: number,
  cell: number = SPLASH_CELL_PX,
): SplashGrid {
  const pitch = cell + SPLASH_GAP_PX;
  const cols = Math.max(1, Math.ceil(width / pitch));
  const rows = Math.max(1, Math.ceil(height / pitch));
  let maxRaw = 0;
  const raws: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const raw = rawDelayMs(col, row);
      raws.push(raw);
      if (raw > maxRaw) maxRaw = raw;
    }
  }
  const scale = maxRaw > 0 ? Math.min(1, SPLASH_FILL_BUDGET_MS / maxRaw) : 1;
  const cells: SplashCell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const raw = raws[row * cols + col]!;
      cells.push({
        col,
        row,
        delayMs: Math.round(raw * scale),
        tone: cellTone(hash2(col, row)),
      });
    }
  }
  return { cols, rows, cell, pitch, cells };
}

/** 开屏总可见时长(不含淡出):压平时只短驻留,不空等动画窗 */
export function splashVisibleMs(flattened: boolean): number {
  if (flattened) return SPLASH_FLATTENED_HOLD_MS;
  return SPLASH_FILL_BUDGET_MS + SPLASH_CELL_SETTLE_MS + SPLASH_HOLD_MS;
}
