/**
 * 资源节约模式(设置-主题):手动开关与 SteamVR 自动触发的合成。
 * 纯函数可测;DOM/存储读写封装在 App.tsx。
 *
 * 生效语义:任一路径打开即全量压平动画/光效并卸载 WebGL 背景
 * (data-effects="off" 闸口,见 design-system/tokens/tokens.css 与
 * components/three/scene-mode.ts);手动与自动互不覆盖对方的偏好存储。
 */

export interface ResourceSaverInput {
  /** 手动打开(设置持久化;?effects=off 走查覆盖视为强制打开) */
  readonly manualOn: boolean;
  /** SteamVR 运行时自动打开(持久化偏好) */
  readonly autoEnabled: boolean;
  /** SteamVR 是否在运行(检测器未接入前恒 false,见 GitHub issue #27) */
  readonly steamVRRunning: boolean;
}

export function resourceSaverActive(input: ResourceSaverInput): boolean {
  return input.manualOn || (input.autoEnabled && input.steamVRRunning);
}

/** 状态文案归因:手动优先;仅自动触发时标注自动(供设置页状态行) */
export function resourceSaverSource(
  input: ResourceSaverInput,
): "off" | "manual" | "auto" {
  if (input.manualOn) return "manual";
  return input.autoEnabled && input.steamVRRunning ? "auto" : "off";
}
