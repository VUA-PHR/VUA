/**
 * 模型生产模块首次进入覆盖层(假加载页)的展示决策(纯逻辑,可测)。
 *
 * 定位(用户需求 2026-08):为最终交付的模块初始化画面预留文字/图片/动画
 * 三个内容槽位。当前没有真实初始化任务,按固定时长展示后淡出退出;
 * G10 车间接入真实初始化(素材扫描、环境探测、首次索引构建)后,本模块
 * 改由任务状态驱动显示与退出,槽位结构不变。
 */
export const INTRO_HOLD_MS = 1800;
export const INTRO_HOLD_REDUCED_MS = 600;
export const INTRO_FADE_MS = 320;

/** reduced-motion 下缩短停留且不播动画(动画由 CSS 全局规则压掉) */
export function introHoldMs(reducedMotion: boolean): number {
  return reducedMotion ? INTRO_HOLD_REDUCED_MS : INTRO_HOLD_MS;
}

/** 覆盖层生命周期:idle(未进入过生产模块) → showing → done(本次启动不再出现) */
export type ProductionIntroPhase = "idle" | "showing" | "done";

export function nextIntroPhase(
  phase: ProductionIntroPhase,
  enteredProduction: boolean,
): ProductionIntroPhase {
  if (phase === "idle" && enteredProduction) return "showing";
  return phase;
}
