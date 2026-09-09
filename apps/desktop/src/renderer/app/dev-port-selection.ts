import { fixtureNames } from "./resolve-scenario.ts";
import { storageKeys } from "./storage-keys.ts";

/**
 * 开发模式 per-port 连接目标选择(018,裁决 13 备稿授权;DEV-only 硬防线):
 * - 十领域端口逐一选 live(真实 Electron 链路)或 fixture(演示端口)——
 *   C1 合规读法=切换连接目标,非伪造状态;
 * - 生产构建恒 {}(全 live 语义=无 fixture 覆盖),词表外端口与词表外目标
 *   一律忽略——不猜测;
 * - 会话级(sessionStorage,照 DevScenarioBar 先例);任一端口 fixture 时
 *   页面「演示数据」徽标恒显(原则①,聚合语义在装配点落地)。
 */

export const devPortIds = [
  "environment",
  "tutorial",
  "modelProduction",
  "toolCatalog",
  "task",
  "settings",
  "acquire",
  "warehouseCommands",
  "projectOps",
  "packages",
] as const;

export type DevPortId = (typeof devPortIds)[number];

export type DevPortTarget = "live" | "fixture";

export type DevPortSelection = Partial<Record<DevPortId, DevPortTarget>>;

/** fixture 数据档位(场景资产按端口拆档的过渡形态:档位决定 fixture 端口
 *  的数据形态,沿用既有场景资产;词表外忽略) */
export type FixtureTier = (typeof fixtureNames)[number];

export const fixtureTierOptions: readonly FixtureTier[] = [...fixtureNames];

export interface DevPortSelectionState {
  readonly targets: DevPortSelection;
  readonly fixtureTier: FixtureTier;
}

/** 存储载荷解析:JSON 对象且键在端口词表、值在目标词表才收;其余忽略 */
export function parseDevPortSelection(stored: string | null): DevPortSelectionState {
  if (stored === null || stored === "") return { targets: {}, fixtureTier: "demo-mixed" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { targets: {}, fixtureTier: "demo-mixed" };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { targets: {}, fixtureTier: "demo-mixed" };
  }
  const record = parsed as Record<string, unknown>;
  const targets: DevPortSelection = {};
  for (const [key, value] of Object.entries(record)) {
    if (!(devPortIds as readonly string[]).includes(key)) continue;
    if (value !== "live" && value !== "fixture") continue;
    targets[key as DevPortId] = value;
  }
  const fixtureTier = (fixtureNames as readonly string[]).includes(
    record.fixtureTier as string,
  )
    ? (record.fixtureTier as FixtureTier)
    : "demo-mixed";
  return { targets, fixtureTier };
}

/** 会话级读取;存储不可用 = {}(保守,全 live) */
export function readDevPortSelection(): DevPortSelectionState {
  try {
    return parseDevPortSelection(sessionStorage.getItem(storageKeys.devPortSelection));
  } catch {
    return { targets: {}, fixtureTier: "demo-mixed" };
  }
}

/** 会话级写入;空选择 = 移除键(回全 live) */
export function writeDevPortSelection(state: DevPortSelectionState): void {
  try {
    const entries = Object.entries(state.targets).filter(
      ([, target]) => target === "live" || target === "fixture",
    );
    if (entries.length === 0) {
      sessionStorage.removeItem(storageKeys.devPortSelection);
      return;
    }
    sessionStorage.setItem(
      storageKeys.devPortSelection,
      JSON.stringify({ ...Object.fromEntries(entries), fixtureTier: state.fixtureTier }),
    );
  } catch {
    /* 存储不可用:选择仅本次内存生效 */
  }
}

/** 聚合语义(原则①):任一端口 fixture = 演示数据(徽标恒显依据) */
export function anyFixturePort(targets: DevPortSelection): boolean {
  return Object.values(targets).some((target) => target === "fixture");
}

/** 常用组合预设(018 批 2):全真实连接(=空覆盖)与全演示(十端口全 fixture) */
export function allLiveSelection(): DevPortSelection {
  return {};
}

export function allFixtureSelection(): DevPortSelection {
  return Object.fromEntries(devPortIds.map((port) => [port, "fixture" as const]));
}