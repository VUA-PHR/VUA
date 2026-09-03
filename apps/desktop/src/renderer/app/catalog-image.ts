/**
 * 目录缩略图 URL 适配。
 *
 * Electron 迁移:旧 Tauri vuaimg 自定义协议(Rust 侧白名单校验 + 落盘缓存)
 * 按裁决不继承;远程图片直连原 URL,浏览器/Electron 网络栈自身 HTTP 缓存
 * 兜底,语义等价。域名白名单与磁盘缓存随 F4(Warehouse 远程素材)切片
 * 以 Electron 机制重建。
 */
export function catalogImageUrl(url: string): string {
  return url;
}
