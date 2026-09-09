import { storageKeys } from "./storage-keys.ts";

/**
 * UI 根注册表(多套 UI 批 A,UI-01/UI-05;需求 §3/§4/§6):
 * - 两套可信随产品构建的 UI:现有 UI(第一套,已接入)与森林绿搭配 UI
 *   (批 D 前置,本批呈现不可用态);
 * - 共享容器(GatewayProvider/共享容器状态)生命周期高于 UI 根——切换
 *   UI 根不重建 Gateway、不触碰端口订阅;
 * - 语义导航上下文:page 由共享容器状态持有,UI 根切换自然保留(UI-02
 *   导航行);
 * - 会话级选择(sessionStorage,首批对照验证入口在开发设置);词表外
 *   回落 current(现有 UI),不猜测。
 */

export const uiRootIds = ["current", "forest-green"] as const;

export type UiRootId = (typeof uiRootIds)[number];

/** 目标 UI 可用性(诚实纪律 UI-08):森林绿未接入=不可用,如实呈现 */
export function isUiRootAvailable(root: UiRootId): boolean {
  return root === "current";
}

/** 存储载荷解析:词表外回落 current(现有 UI 为第一套与回落缺省) */
export function parseUiRootSelection(stored: string | null): UiRootId {
  return stored === "forest-green" ? "forest-green" : "current";
}

/** 会话级读取;存储不可用 = current(保守回落) */
export function readUiRootSelection(): UiRootId {
  try {
    return parseUiRootSelection(sessionStorage.getItem(storageKeys.uiRootSelection));
  } catch {
    return "current";
  }
}

/** 会话级写入 */
export function writeUiRootSelection(root: UiRootId): void {
  try {
    sessionStorage.setItem(storageKeys.uiRootSelection, root);
  } catch {
    /* 存储不可用:选择仅本次内存生效 */
  }
}
