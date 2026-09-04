import { createCatalogBrowser, type CatalogBrowserPort } from "../gateway/index.ts";

/**
 * 目录浏览端口实例:应用内唯一的装配点(与 tutorial-port-instance 同一模式)。
 * DEV 硬防线在 gateway/catalog-browser-instance.ts:生产构建恒为
 * not-connected 诚实空态,快照数据不进正式包。
 */
export const catalogBrowser: CatalogBrowserPort = createCatalogBrowser();
