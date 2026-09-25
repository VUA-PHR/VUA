import type { SystemResourceUsageV1 } from "@vua/contracts";

/**
 * 占用查看器展示模型(纯函数可测;IPC/存储读写封装在 ResourceMonitor.tsx):
 * - 顶栏数字 = RAM/VRAM 占用百分比二者取高(用户裁决 2026-09-25);
 * - VRAM 采集缺席(null)如实退化为仅 RAM,弹层呈现「不可用」不猜值;
 * - 百分比恒取整到 0..100,分母为 0 的异常快照按 0 处理(不除零)。
 */

export interface ResourceUsagePercents {
  /** RAM 占用百分比(0..100 整数) */
  readonly ramPct: number;
  /** VRAM 占用百分比;采集不可用为 null */
  readonly vramPct: number | null;
  /** 顶栏读数:二者取高;VRAM 缺席 = RAM */
  readonly dominantPct: number;
}

export function percentOf(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
}

export function usagePercents(snapshot: SystemResourceUsageV1): ResourceUsagePercents {
  const ramPct = percentOf(snapshot.ramUsedBytes, snapshot.ramTotalBytes);
  const vramPct =
    snapshot.vramUsedBytes !== null && snapshot.vramTotalBytes !== null
      ? percentOf(snapshot.vramUsedBytes, snapshot.vramTotalBytes)
      : null;
  return {
    ramPct,
    vramPct,
    dominantPct: vramPct === null ? ramPct : Math.max(ramPct, vramPct),
  };
}

/** GiB 一位小数(与任务管理器口径一致:1024^3) */
export function formatGigabytes(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(1);
}
