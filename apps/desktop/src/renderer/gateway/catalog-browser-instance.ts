import type { CatalogBrowserPort } from "./catalog-browser-port.ts";
import { createEmptyCatalogBrowser } from "./empty-gateway.ts";

/**
 * 目录浏览端口装配(原则①硬防线,与 create.ts 同一模式):
 * 当前恒为 not-connected 诚实空态。旧仓 vendored BDB 真实快照与
 * DEV 演示装配按迁移裁决不带入新仓库;演示与真实目录数据随 F4
 * 远程素材切片,对准 AMF 素材 intake 协议重建,届时本函数是
 * 唯一的替换点(页面零重写)。
 */
export function createCatalogBrowser(): CatalogBrowserPort {
  return createEmptyCatalogBrowser();
}
