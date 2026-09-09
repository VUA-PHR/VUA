/**
 * 打开外部 URL(双轨:Warehouse 详情"在浏览器打开来源页")。
 *
 * Electron 迁移:渲染器不持有 shell 能力;统一走 window.open,由
 * Electron Main 的 setWindowOpenHandler 按 U9 四分法分流(2026-09-09 裁决):
 * http/https 目标不再交系统浏览器——清单内直行/清单外确认后转当前内嵌
 * 视图;外部协议手势+确认后交系统打开;伪协议无条件拒。返回是否成功,
 * 失败由调用方决定如何呈现(诚实状态,不静默)。
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  // 弹窗被拦截时 window.open 返回 null,如实上报失败
  return window.open(url, "_blank", "noopener,noreferrer") !== null;
}
