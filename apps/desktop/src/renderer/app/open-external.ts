/**
 * 在系统浏览器打开外部 URL(双轨:Warehouse 详情"在浏览器打开来源页")。
 *
 * Electron 迁移:渲染器不持有 shell 能力;统一走 window.open,由
 * Electron Main 的 setWindowOpenHandler(仅放行 http/https)转交
 * shell.openExternal。返回是否成功,失败由调用方决定如何呈现
 * (诚实状态,不静默)。
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  // 弹窗被拦截时 window.open 返回 null,如实上报失败
  return window.open(url, "_blank", "noopener,noreferrer") !== null;
}
