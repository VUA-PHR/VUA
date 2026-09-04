/**
 * 应用内浏览窗口(S-IX-3 双轨·云端):把商品来源页装进应用管理的
 * 独立窗口,与"系统浏览器打开"并存——用户可自选留在应用内还是交给
 * 外部浏览器/第三方工具。
 *
 * Electron 迁移(本切片):独立浏览窗口要求 Main 管理的 WebContentsView
 * + 隔离 Session(开发大纲 F4),未随本切片迁移。当前恒返回 false——
 * 调用方降级为"系统浏览器打开",诚实呈现,不渲染不可用入口。
 * 后续切片实现时:仅放行 http/https、单例窗口、应用不持有来源站会话。
 */

/** 当前环境是否支持应用内浏览窗口(供 UI 决定是否渲染入口) */
export function browseWindowSupported(): boolean {
  return false;
}

export async function openBrowseWindow(url: string, title: string): Promise<boolean> {
  void title;
  try {
    const protocol = new URL(url).protocol;
    if (protocol !== "https:" && protocol !== "http:") return false;
  } catch {
    return false;
  }
  return false;
}
