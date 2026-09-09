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

/** 存储载荷解析:JSON 对象且键在端口词表、值在目标词表才收;其余忽略 */
export function parseDevPortSelection(stored: string | null): DevPortSelection {
  if (stored === null || stored === "") return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const selection: DevPortSelection = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!(devPortIds as readonly string[]).includes(key)) continue;
    if (value !== "live" && value !== "fixture") continue;
    selection[key as DevPortId] = value;
  }
  return selection;
}

/** 会话级读取;存储不可用 = {}(保守,全 live) */
export function readDevPortSelection(): DevPortSelection {
  try {
    return parseDevPortSelection(sessionStorage.getItem(storageKeys.devPortSelection));
  } catch {
    return {};
  }
}

/** 会话级写入;空选择 = 移除键(回全 live) */
export function writeDevPortSelection(selection: DevPortSelection): void {
  try {
    const entries = Object.entries(selection).filter(
      ([, target]) => target === "live" || target === "fixture",
    );
    if (entries.length === 0) {
      sessionStorage.removeItem(storageKeys.devPortSelection);
      return;
    }
    sessionStorage.setItem(
      storageKeys.devPortSelection,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    /* 存储不可用:选择仅本次内存生效 */
  }
}

/** 聚合语义(原则①):任一端口 fixture = 演示数据(徽标恒显依据) */
export function anyFixturePort(selection: DevPortSelection): boolean {
  return Object.values(selection).some((target) => target === "fixture");
}
