/**
 * 覆盖层窗口视图模型(2026-09-26 additive 裁决:覆盖层窗口成为引导宿主)。
 * 纯逻辑:首视图从加载查询解析(创建窗口的一方经 ?view= 投递,渲染层
 * 不信任任意来源的跳转——词表外值回落默认视图引导,不猜态),以及
 * 视图切换事件的形状守卫(事件载荷即 OverlayViewV1 词面本身,非信封)。
 */
import type { OverlayViewV1 } from "@vua/contracts";

export type OverlayView = OverlayViewV1;

/** 视图闭集与默认视图:引导(默认) | 状态 */
export const OVERLAY_VIEWS: readonly OverlayView[] = ["guide", "status"];

export const OVERLAY_DEFAULT_VIEW: OverlayView = "guide";

/** 首视图解析:词表内值原样,缺省/词表外一律回落默认视图(引导) */
export function parseOverlayView(value: string | null): OverlayView {
  return value === "status" || value === "guide" ? value : OVERLAY_DEFAULT_VIEW;
}

/** 事件载荷守卫:Main 投递的视图切换事件,词表外值丢弃(调用方不切换) */
export function isOverlayView(value: unknown): value is OverlayView {
  return value === "status" || value === "guide";
}
