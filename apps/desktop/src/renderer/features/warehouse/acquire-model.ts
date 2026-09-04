/**
 * 本地素材接管的纯函数模型(C-ACQUIRE)。
 * 大小展示:未知(null)由页面回落"大小未知",本函数只处理已知字节数;
 * 单位键与 i18n strings.warehouse.acquire 的 sizeB/sizeKb/sizeMb/sizeGb 对应。
 */

export type SizeUnitKey = "sizeB" | "sizeKb" | "sizeMb" | "sizeGb";

export interface SizeText {
  readonly amount: string;
  readonly unitKey: SizeUnitKey;
}

/** 字节数 → 本地化所需的 { amount, unitKey };不足 1024 进位,一位小数去尾零 */
export function sizeText(sizeBytes: number): SizeText {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) return { amount: "0", unitKey: "sizeB" };
  const units: readonly SizeUnitKey[] = ["sizeB", "sizeKb", "sizeMb", "sizeGb"];
  let value = sizeBytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // B 为整数;KB/MB/GB 保留一位小数并去尾零(46.0 → "46",46.1 → "46.1")
  const amount =
    unit === 0 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
  return { amount, unitKey: units[unit] ?? "sizeB" };
}
