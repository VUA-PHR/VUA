import { createCatalogBrowser, type CatalogBrowserPort } from "../gateway/index.ts";

/**
 * 目录浏览端口实例:应用内唯一的装配点(与 tutorial-port-instance 同一模式)。
 * 桌面壳内走 live 真实链路(gateway/catalog-browser-instance.ts 装配);
 * 无 preload 宿主时退 not-connected 诚实空态,DEV fixture 不经此处。
 */
export const catalogBrowser: CatalogBrowserPort = createCatalogBrowser();
