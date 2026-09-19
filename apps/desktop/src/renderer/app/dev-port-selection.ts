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

/** 默认 fixture 档位(解析回落与「未定制即移除存储键」的基准档) */
export const DEFAULT_FIXTURE_TIER: FixtureTier = "demo-mixed";

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
  if (stored === null || stored === "") return { targets: {}, fixtureTier: DEFAULT_FIXTURE_TIER };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { targets: {}, fixtureTier: DEFAULT_FIXTURE_TIER };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { targets: {}, fixtureTier: DEFAULT_FIXTURE_TIER };
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
    : DEFAULT_FIXTURE_TIER;
  return { targets, fixtureTier };
}

/** 会话级读取;存储不可用 = {}(保守,全 live) */
export function readDevPortSelection(): DevPortSelectionState {
  try {
    return parseDevPortSelection(sessionStorage.getItem(storageKeys.devPortSelection));
  } catch {
    return { targets: {}, fixtureTier: DEFAULT_FIXTURE_TIER };
  }
}

/**
 * 存储操作判定(纯函数,可测):空选择且默认档位 = 移除键(回全 live 全默认);
 * 其余一律写 JSON。W25 走查 D-B 修复:此前空 targets 时整键移除,导致
 * fixture 档位-only 变更(「演示系统」档位选择)根本不落盘,UI 重载后恒
 * 回默认档 demo-mixed——档位必须随批持久化,切换单向生效。
 */
export function devPortStorageOp(
  state: DevPortSelectionState,
): { kind: "remove" } | { kind: "set"; value: string } {
  const entries = Object.entries(state.targets).filter(
    ([, target]) => target === "live" || target === "fixture",
  );
  if (entries.length === 0 && state.fixtureTier === DEFAULT_FIXTURE_TIER) {
    return { kind: "remove" };
  }
  return {
    kind: "set",
    value: JSON.stringify({ ...Object.fromEntries(entries), fixtureTier: state.fixtureTier }),
  };
}

/** 会话级写入;空选择且默认档位 = 移除键(回全 live 全默认) */
export function writeDevPortSelection(state: DevPortSelectionState): void {
  try {
    const op = devPortStorageOp(state);
    if (op.kind === "remove") {
      sessionStorage.removeItem(storageKeys.devPortSelection);
    } else {
      sessionStorage.setItem(storageKeys.devPortSelection, op.value);
    }
  } catch {
    /* 存储不可用:选择仅本次内存生效 */
  }
}

/**
 * 切换按钮禁用判定(纯函数,可测):按钮在其目标态已达成时禁用——
 * 「切到演示 fixture」仅在端口已是 fixture 时禁用,「复位为真实连接」
 * 仅在端口已是 live 时禁用。W25 走查 D-B 修复:此前两按钮在同一禁用
 * 表达式上(target === "live" 双双禁用),live 基线(默认态)下两个按钮
 * 都点不了,per-port 演示切换被完全锁死在前端真实状态。
 */
export function devTargetButtonDisabled(target: DevPortTarget, action: DevPortTarget): boolean {
  return target === action;
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