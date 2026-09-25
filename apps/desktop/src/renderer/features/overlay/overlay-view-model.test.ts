/**
 * 覆盖层视图模型校验(2026-09-26 additive):
 * - 词表闭集二值,默认视图为引导;
 * - 加载查询解析:词表内原样,缺省/词表外回落默认(不猜态);
 * - 事件载荷守卫:词表外值拒绝。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  isOverlayView,
  OVERLAY_DEFAULT_VIEW,
  OVERLAY_VIEWS,
  parseOverlayView,
} from "./overlay-view-model.ts";

test("view vocabulary is the closed two-value set with guide as default", () => {
  assert.deepEqual(OVERLAY_VIEWS, ["guide", "status"]);
  assert.equal(OVERLAY_DEFAULT_VIEW, "guide");
});

test("parseOverlayView admits vocabulary values and falls back for missing/foreign values", () => {
  assert.equal(parseOverlayView("guide"), "guide");
  assert.equal(parseOverlayView("status"), "status");
  assert.equal(parseOverlayView(null), "guide");
  assert.equal(parseOverlayView(""), "guide");
  assert.equal(parseOverlayView("bogus"), "guide");
});

test("isOverlayView guards the event payload", () => {
  assert.equal(isOverlayView("guide"), true);
  assert.equal(isOverlayView("status"), true);
  assert.equal(isOverlayView("bogus"), false);
  assert.equal(isOverlayView(null), false);
  assert.equal(isOverlayView({ view: "guide" }), false);
});
