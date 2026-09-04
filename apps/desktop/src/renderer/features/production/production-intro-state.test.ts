/**
 * 假加载页展示决策测试:固定时长/reduced-motion 分支 + 单次触发生命周期
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  INTRO_FADE_MS,
  INTRO_HOLD_MS,
  INTRO_HOLD_REDUCED_MS,
  introHoldMs,
  nextIntroPhase,
} from "./production-intro-state.ts";

test("introHoldMs: reduced-motion 下显著缩短停留", () => {
  assert.equal(introHoldMs(false), INTRO_HOLD_MS);
  assert.equal(introHoldMs(true), INTRO_HOLD_REDUCED_MS);
  assert.ok(INTRO_HOLD_REDUCED_MS < INTRO_HOLD_MS);
});

test("nextIntroPhase: 仅首次进入 production 模块时触发一次", () => {
  // 未进入 production:保持 idle
  assert.equal(nextIntroPhase("idle", false), "idle");
  // 首次进入:idle → showing
  assert.equal(nextIntroPhase("idle", true), "showing");
  // showing/done 是粘性的:之后反复进出 production 不再触发
  assert.equal(nextIntroPhase("showing", true), "showing");
  assert.equal(nextIntroPhase("showing", false), "showing");
  assert.equal(nextIntroPhase("done", true), "done");
  assert.equal(nextIntroPhase("done", false), "done");
});

test("退出常量:淡出时长为正且短于停留(先停留后淡出)", () => {
  assert.ok(INTRO_FADE_MS > 0);
  assert.ok(INTRO_FADE_MS < INTRO_HOLD_MS);
});
