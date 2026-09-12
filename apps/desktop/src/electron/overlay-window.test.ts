import { describe, expect, it } from "vitest";
import {
  OVERLAY_WINDOW_HEIGHT,
  OVERLAY_WINDOW_LEVEL,
  OVERLAY_WINDOW_WIDTH,
  OVERLAY_SURFACE_PARAM,
  decideOverlayWindowAction,
  overlayVisibilityAfterDecision,
} from "./overlay-window.js";

describe("overlay 窗口决策(proposal 017 实现面备注,桌面域内切片)", () => {
  it("无窗口 → 创建(create)", () => {
    expect(decideOverlayWindowAction({ exists: false, visible: false })).toBe("create");
  });

  it("在位不可见 → 显示(show)", () => {
    expect(decideOverlayWindowAction({ exists: true, visible: false })).toBe("show");
  });

  it("在位可见 → 隐藏(hide)", () => {
    expect(decideOverlayWindowAction({ exists: true, visible: true })).toBe("hide");
  });

  it("动作后可见性回执:create/show=true,hide=false", () => {
    expect(overlayVisibilityAfterDecision("create")).toBe(true);
    expect(overlayVisibilityAfterDecision("show")).toBe(true);
    expect(overlayVisibilityAfterDecision("hide")).toBe(false);
  });

  it("形态参数钉在 F7a spike 验证结论(460×640,screen-saver 级,表面参数不漂移)", () => {
    expect(OVERLAY_WINDOW_WIDTH).toBe(460);
    expect(OVERLAY_WINDOW_HEIGHT).toBe(640);
    expect(OVERLAY_WINDOW_LEVEL).toBe("screen-saver");
    expect(OVERLAY_SURFACE_PARAM).toBe("overlay-desktop");
  });
});
