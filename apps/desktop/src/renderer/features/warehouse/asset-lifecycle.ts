import { storageKeys } from "../../app/storage-keys.ts";

/**
 * 素材生命周期本地状态(G8):版本化 localStorage 持久化。
 *
 * 纪律(跨仓评审裁决 + 原则①):
 * - purchase 的唯一来源是用户标记(unknown | user_confirmed):VUA 不读取
 *   BOOTH 账户数据,下载记录也只能证明"取得过文件",不得自动升级为已购买;
 * - download / unpack / import 是相互独立的状态维度,G8 恒为初始值,
 *   后续里程碑由真实适配器写入;projectUsages 当前恒空列表;
 * - 各维度可同时成立(如下载+解压+导入+被三项目引用),不是互斥枚举;
 * - UI 徽标只渲染非 unknown 事实,不为初始值维度造"未下载"噪音。
 */

export type PurchaseMark = "unknown" | "user_confirmed";

export interface AssetLifecycle {
  readonly purchase: PurchaseMark;
  /** G8 恒 "not_downloaded";真实下载状态由 G12 可信下载适配器写入 */
  readonly download: "not_downloaded";
  readonly unpack: "not_unpacked";
  readonly import: "not_imported";
  readonly projectUsages: readonly string[];
}

/** 版本化存储形态:v1。演进时新增版本号并在解析层做迁移 */
export interface StoredLifecycleV1 {
  readonly version: 1;
  readonly assets: Readonly<Record<string, AssetLifecycle>>;
}

export const emptyLifecycle: StoredLifecycleV1 = { version: 1, assets: {} };

const initialRecord: AssetLifecycle = {
  purchase: "unknown",
  download: "not_downloaded",
  unpack: "not_unpacked",
  import: "not_imported",
  projectUsages: [],
};

/** 某商品的生命周期;无记录时返回全初始值(不写入存储) */
export function lifecycleOf(stored: StoredLifecycleV1, productId: string): AssetLifecycle {
  return stored.assets[productId] ?? initialRecord;
}

/**
 * 宽容解析:非法 JSON、未知版本、畸形条目一律回退为空态对应部分——
 * 本地缓存永远不是事实来源,损坏时宁可回到 unknown 也不猜测。
 */
export function parseStoredLifecycle(raw: string | null): StoredLifecycleV1 {
  if (raw === null) return emptyLifecycle;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyLifecycle;
  }
  if (typeof parsed !== "object" || parsed === null) return emptyLifecycle;
  const candidate = parsed as { version?: unknown; assets?: unknown };
  if (candidate.version !== 1) return emptyLifecycle;
  if (typeof candidate.assets !== "object" || candidate.assets === null) {
    return emptyLifecycle;
  }
  const assets: Record<string, AssetLifecycle> = {};
  for (const [productId, value] of Object.entries(
    candidate.assets as Record<string, unknown>,
  )) {
    const purchase = (value as { purchase?: unknown })?.purchase;
    // 只有用户确认标记值得恢复;其余维度 G8 恒初始值
    if (purchase === "user_confirmed") {
      assets[productId] = { ...initialRecord, purchase: "user_confirmed" };
    }
  }
  return { version: 1, assets };
}

export function serializeLifecycle(stored: StoredLifecycleV1): string {
  return JSON.stringify(stored);
}

/**
 * 标记/取消"已购买":取消即移除记录(回到 unknown),
 * 不保留 purchase: "unknown" 的墓碑条目。
 */
export function setPurchaseMark(
  stored: StoredLifecycleV1,
  productId: string,
  confirmed: boolean,
): StoredLifecycleV1 {
  const assets = { ...stored.assets };
  if (confirmed) {
    assets[productId] = { ...initialRecord, purchase: "user_confirmed" };
  } else {
    delete assets[productId];
  }
  return { version: 1, assets };
}

/** 读取持久化的生命周期(localStorage 不可用时回退空态) */
export function loadLifecycle(): StoredLifecycleV1 {
  try {
    return parseStoredLifecycle(localStorage.getItem(storageKeys.lifecycle));
  } catch {
    return emptyLifecycle;
  }
}

/** 持久化生命周期(存储不可用时仅本次会话生效,与 App 壳同一策略) */
export function saveLifecycle(stored: StoredLifecycleV1): void {
  try {
    localStorage.setItem(storageKeys.lifecycle, serializeLifecycle(stored));
  } catch {
    /* localStorage 不可用时仅本次会话生效 */
  }
}
