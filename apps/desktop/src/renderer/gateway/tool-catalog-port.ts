import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * 工具合集领域窄端口(M0 ToolCatalogPort):能力目录视图。
 * 目录未接入时为 not-connected 诚实空态;不返回猜测工具(§2.6 禁止)。
 * ToolCard 四要素契约(v0.3.3 §8.1)先行冻结,供真实目录接入后使用。
 */

/** 工具卡四要素:能解决什么问题 / 是否已安装 / 数据会发送到哪里 / 由谁维护 */
export interface ToolCard {
  readonly id: string;
  /** 以下为数据负载,由真实目录提供 */
  readonly name: string;
  readonly purpose: string;
  readonly installed: boolean;
  readonly dataDestination: string;
  readonly maintainer: string;
  /** 用途分组(C-TOOLS,§8.1:按用途而不是按名字) */
  readonly category: ToolCategory;
  /** 官方网站;存在才渲染"打开官网"(系统浏览器,打开前显示影响范围) */
  readonly homepage?: string;
  /** 兼容状态说明;不暗示 VUA 对未验证工具提供安全或兼容保证(§8) */
  readonly compatNote?: string;
}

/** 用途分组词表(§8.1):设备与追踪 / 空间校准 / 捕捉与输入 */
export type ToolCategory = "devices" | "calibration" | "capture";

export type ToolCatalogView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "catalog"; tools: ToolCard[] };

export interface ToolCatalogPort {
  snapshot(): Promise<ToolCatalogView>;
  subscribe(callback: (view: ToolCatalogView) => void): Unsubscribe;
  capability(): Promise<CapabilityReport>;
}
