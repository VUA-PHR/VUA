/**
 * Warehouse 本地轨的纯函数模型(C-ACQUIRE,F4-6 条目模型)。
 * 大小展示:条目工件登记面必填字节数,本函数只处理已知字节数;
 * 单位键与 i18n strings.warehouse.acquire 的 sizeB/sizeKb/sizeMb/sizeGb 对应。
 * 卡片与模式行是页面的数据源纯函数:条目 × 工件展开保留图册卡片交互
 * (组件零重写),模式行(覆盖 or 跟随全局)是 F4-9 编辑入口的展示位。
 */

import type {
  WarehouseArtifact,
  WarehouseArtifactMode,
  WarehouseEntry,
} from "../../gateway/index.ts";

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

/** 卡片墙数据源:条目 × 工件展开(工件卡携带条目上下文) */
export interface AcquireArtifactCard {
  /** 列表 key:条目身份 + 内容身份(同条目内 sha 唯一) */
  readonly key: string;
  readonly entry: WarehouseEntry;
  readonly artifact: WarehouseArtifact;
}

export function artifactCards(
  entries: readonly WarehouseEntry[],
): readonly AcquireArtifactCard[] {
  return entries.flatMap((entry) =>
    entry.artifacts.map((artifact) => ({
      key: `${entry.warehouseItemId}:${artifact.artifactSha256}`,
      entry,
      artifact,
    })),
  );
}

/** 卡片搜索:显示名 / 文件夹名 / 相对路径子串匹配(大小写不敏感;空词全过) */
export function artifactCardMatches(card: AcquireArtifactCard, query: string): boolean {
  const text = query.trim().toLowerCase();
  if (text === "") return true;
  return (
    card.entry.displayName.toLowerCase().includes(text) ||
    card.entry.folderName.toLowerCase().includes(text) ||
    card.artifact.relativePath.toLowerCase().includes(text)
  );
}

/** 产物模式行:覆盖与否 + 生效模式(覆盖 ?? 全局,读取面已动态解析) */
export interface EntryModeLine {
  readonly overridden: boolean;
  readonly effective: WarehouseArtifactMode;
}

export function entryModeLine(entry: WarehouseEntry): EntryModeLine {
  return { overridden: entry.artifactMode !== null, effective: entry.effectiveArtifactMode };
}

/* ---- F4-9 条目动作(bdl-commands v0.1 写命令的入口可见性) ----
 * 可见性是服务端守卫的镜像呈现,不是客户端守卫:动作发出后守卫事实仍归
 * 服务端(协议八码),这里的条件只决定"入口是否出现",与协议语义一致:
 * - 两组动作都只在生效模式为 generate_vpm 时出现;
 * - 生成入口:生效模式 generate_vpm + 持有原始素材 + 尚无生成副本
 *   (生成副本永不静默替换);
 * - 删除入口:生效模式 generate_vpm + 生成副本在场(审计性破坏操作的
 *   前置事实);删除动作以高危样式 + 二次确认呈现(UI 层纪律)。
 */

export type WarehouseEntryAction = "generateVpm" | "deleteOriginals";

export function entryActions(entry: WarehouseEntry): readonly WarehouseEntryAction[] {
  if (entry.effectiveArtifactMode !== "generate_vpm") return [];
  const hasOriginal = entry.artifacts.some((artifact) => artifact.role === "original");
  const hasGenerated = entry.artifacts.some((artifact) => artifact.role === "generated_vpm");
  const actions: WarehouseEntryAction[] = [];
  if (hasOriginal && !hasGenerated) actions.push("generateVpm");
  if (hasGenerated) actions.push("deleteOriginals");
  return actions;
}
