/**
 * 壳能力单一事实源(015 §11 方案 a:能力拥有者静态声明;#36 缺陷4′
 * 能力面对齐切片,2026-09-19):
 * - app.snapshot 信封组装(gateway-router)与此处同源引用,消灭信封硬编码
 *   与壳自报的能力面形状分裂(#22/#36 live 形状分裂教训同一族);
 * - preload 是沙箱 preload,运行时只能 require electron 白名单模块,无法
 *   导入本文件——壳自报面按 DESKTOP_GATEWAY_VERSION 先例持本地字面量,
 *   漂移由 shell-capabilities.test.ts 同值钉死把守;
 * - 内嵌浏览基座(remote-content + U9 导航策略)随壳交付,呈现两态由渲染层
 *   据此驱动(去降级判据 015 §6 B-3:端到端可用才翻转,desktop 架构 1.1.0);
 *   能力面开放属功能决策,另行走登记——值翻转随批申报,不静默。
 */
export const SHELL_CAPABILITIES = {
  remoteBrowser: true,
} as const;
