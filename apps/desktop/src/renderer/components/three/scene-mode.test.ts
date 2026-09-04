/**
 * WebGL 场景降级判定与指针平滑测试(S-VFX-0)
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import { decideSceneMode, smoothDamp } from "./scene-mode.ts";

const ALL_ON = {
  effectsEnabled: true,
  highContrast: false,
  forcedColors: false,
  reducedMotion: false,
  webglSupported: true,
};

test("decideSceneMode: 全部条件满足时动画模式", () => {
  assert.equal(decideSceneMode(ALL_ON), "animated");
});

test("decideSceneMode: reduced-motion 降级为静态单帧", () => {
  assert.equal(decideSceneMode({ ...ALL_ON, reducedMotion: true }), "static");
});

test("decideSceneMode: 特效关闭 / HC 双通道 / WebGL 不可用均不挂载", () => {
  assert.equal(decideSceneMode({ ...ALL_ON, effectsEnabled: false }), "off");
  assert.equal(decideSceneMode({ ...ALL_ON, highContrast: true }), "off");
  assert.equal(decideSceneMode({ ...ALL_ON, forcedColors: true }), "off");
  assert.equal(decideSceneMode({ ...ALL_ON, webglSupported: false }), "off");
});

test("decideSceneMode: 关闭条件优先于 reduced-motion(不挂载而非静态)", () => {
  assert.equal(
    decideSceneMode({ ...ALL_ON, effectsEnabled: false, reducedMotion: true }),
    "off",
  );
  assert.equal(
    decideSceneMode({ ...ALL_ON, webglSupported: false, reducedMotion: true }),
    "off",
  );
});

test("smoothDamp: 指数趋近目标,永不 overshoot", () => {
  let v = 0;
  for (let i = 0; i < 600; i += 1) {
    v = smoothDamp(v, 1, 6, 1 / 60);
  }
  assert.ok(Math.abs(v - 1) < 1e-3);
  // 单步不超过目标
  assert.ok(smoothDamp(0, 1, 6, 1 / 60) < 1);
  // 帧率无关:大步长也收敛且不越过目标
  assert.ok(smoothDamp(0, 1, 6, 0.5) < 1);
});

test("smoothDamp: dt 为 0 时保持原值", () => {
  assert.equal(smoothDamp(0.42, 1, 6, 0), 0.42);
});
