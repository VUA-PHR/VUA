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

/* ---- W15 设置-实验性两级选项(设置页内发起的条目级操作) ----
 * 与 entryActions 同一面服务端守卫的镜像,但呈现诉求不同:仓储抽屉是
 * "入口隐藏/出现",设置页是"置灰 + 原因"。守卫事实仍归服务端(协议
 * 八码),这里的条件只决定入口可用性与置灰原因文案,与协议语义一致。
 */

/** 两级选项置灰原因(i18n 键,settings.experimental.gate*) */
export type ExperimentalGateReason =
  | "modeNotGenerateVpm"
  | "noOriginal"
  | "alreadyGenerated"
  | "noGeneratedCopy";

export interface ExperimentalGate {
  readonly available: boolean;
  /** available=false 时的置灰原因;available=true 恒为 null */
  readonly reason: ExperimentalGateReason | null;
}

export interface ExperimentalActionGates {
  readonly generateVpm: ExperimentalGate;
  readonly deleteOriginals: ExperimentalGate;
}

/** 设置页两级选项前置镜像(条件与 entryActions 逐一对应) */
export function experimentalActionGates(entry: WarehouseEntry): ExperimentalActionGates {
  const modeOk = entry.effectiveArtifactMode === "generate_vpm";
  const hasOriginal = entry.artifacts.some((artifact) => artifact.role === "original");
  const hasGenerated = entry.artifacts.some((artifact) => artifact.role === "generated_vpm");
  return {
    // 生成 = 生效 generate_vpm + 有原始件 + 尚无生成副本(副本永不静默替换)
    generateVpm: !modeOk
      ? { available: false, reason: "modeNotGenerateVpm" }
      : !hasOriginal
        ? { available: false, reason: "noOriginal" }
        : hasGenerated
          ? { available: false, reason: "alreadyGenerated" }
          : { available: true, reason: null },
    // 删除原始 = 生效 generate_vpm + 生成副本在场(审计性破坏操作的前置事实)
    deleteOriginals: !modeOk
      ? { available: false, reason: "modeNotGenerateVpm" }
      : !hasGenerated
        ? { available: false, reason: "noGeneratedCopy" }
        : { available: true, reason: null },
  };
}

/** W15 条目选择器数据投影:值 = 条目身份,标签 = 显示名,副行 = 文件夹名 */
export interface SettingsEntryOption {
  readonly value: string;
  readonly label: string;
  readonly folderName: string;
}

export function settingsEntryOptions(
  entries: readonly WarehouseEntry[],
): readonly SettingsEntryOption[] {
  return entries.map((entry) => ({
    value: entry.warehouseItemId,
    label: entry.displayName,
    folderName: entry.folderName,
  }));
}

/**
 * 写命令错误 → 本地化文案查表(仓储抽屉与设置页共用):code 是协议冻结面,
 * 键为点号转下划线;未知码回落通用失败文案;传输面三态回落服务未接入。
 */
export function commandErrorText(
  error: { kind: "unavailable" | "request_rejected" | "application"; code?: string },
  commandErrors: Readonly<Record<string, string>>,
): string {
  if (error.kind === "application" && typeof error.code === "string") {
    return commandErrors[error.code.replaceAll(".", "_")] ?? commandErrors.fallback!;
  }
  return commandErrors.vua_warehouse_unavailable!;
}

/* ---- W15 重做:全局默认模式的读面推断(设置页全局开关的初值) ----
 * wire 无独立的全局默认查询;条目读面中无覆盖条目的生效模式即
 * 「覆盖 ?? composed 全局默认」的动态解析结果,可据此推断。全部条目
 * 均有覆盖(或空仓库)时不可知——如实 unknown,UI 标注而非猜测初值。
 */

export type GlobalDefaultInference =
  | { readonly kind: "known"; readonly mode: WarehouseArtifactMode }
  | { readonly kind: "unknown" };

export function inferGlobalDefaultMode(
  entries: readonly WarehouseEntry[],
): GlobalDefaultInference {
  const probe = entries.find((entry) => entry.artifactMode === null);
  return probe === undefined
    ? { kind: "unknown" }
    : { kind: "known", mode: probe.effectiveArtifactMode };
}

/** 条目当前持有生成副本的身份集合(008 路径 a 接线的信号源) */
export function generatedVpmEntryIds(entries: readonly WarehouseEntry[]): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (entry.artifacts.some((artifact) => artifact.role === "generated_vpm")) {
      ids.add(entry.warehouseItemId);
    }
  }
  return ids;
}

/**
 * 新完成生成的条目身份(008 路径 a 桌面接线,W19):当前快照持有生成副本、
 * 而先前快照没有——即两次快照之间完成了生成。条目事实等价于生成 Done
 * (任务面快照不携带条目身份,条目读面是域内可得的等价信号);删除的守卫
 * 与审计仍在服务端,桌面只是发起时机。
 */
export function newlyGeneratedEntryIds(
  previous: ReadonlySet<string>,
  entries: readonly WarehouseEntry[],
): readonly string[] {
  const current = generatedVpmEntryIds(entries);
  const fresh: string[] = [];
  for (const id of current) {
    if (!previous.has(id)) fresh.push(id);
  }
  return fresh;
}
