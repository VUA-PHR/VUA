/**
 * WebGL 场景启用判定(纯函数,Node 单测覆盖;DOM 读取封装在 useSceneMode.ts)。
 *
 * 渐进增强原则:CSS 场景是基线,WebGL 只是增强层——
 * 任一降级条件命中即不挂载画布,界面功能零影响。
 */

export type SceneMode = "off" | "static" | "animated";

export interface SceneModeInput {
  /** data-effects !== "off"(特效总开关,VR/省资源场景手动关闭) */
  effectsEnabled: boolean;
  /** data-hc === "on"(手动高对比度) */
  highContrast: boolean;
  /** forced-colors: active(系统强制色) */
  forcedColors: boolean;
  /** prefers-reduced-motion: reduce → 渲一帧静态,不跑循环 */
  reducedMotion: boolean;
  /** WebGL 上下文可用 */
  webglSupported: boolean;
}

export function decideSceneMode(input: SceneModeInput): SceneMode {
  if (
    !input.effectsEnabled ||
    input.highContrast ||
    input.forcedColors ||
    !input.webglSupported
  ) {
    return "off";
  }
  return input.reducedMotion ? "static" : "animated";
}

/** 指数平滑(帧率无关):current 以 smoothing 速率趋近 target */
export function smoothDamp(
  current: number,
  target: number,
  smoothing: number,
  dt: number,
): number {
  return current + (target - current) * (1 - Math.exp(-smoothing * dt));
}
