import assert from "node:assert/strict";
import { test } from "vitest";
import {
  BOOT_MILESTONES,
  allMilestonesReached,
  bootFraction,
  createBootProgress,
  pendingMilestone,
  splashShouldExit,
} from "./boot-progress-model.ts";

test("里程碑序列:枢纽创建即 renderer 已到达,其余等待", () => {
  const hub = createBootProgress();
  assert.equal(hub.reached().has("renderer"), true);
  assert.equal(hub.allReached(), false);
  assert.equal(pendingMilestone(hub.reached()), "gateway");
  assert.equal(bootFraction(hub.reached()), 1 / BOOT_MILESTONES.length);
});

test("里程碑推进:四段全到后 allReached,重复上报幂等,订阅者只收到一次推进", () => {
  const hub = createBootProgress();
  let calls = 0;
  hub.subscribe(() => {
    calls += 1;
  });
  hub.report("gateway");
  hub.report("gateway");
  hub.report("provider");
  hub.report("paint");
  assert.equal(hub.allReached(), true);
  assert.equal(calls, 3);
  assert.equal(pendingMilestone(hub.reached()), null);
  assert.equal(bootFraction(hub.reached()), 1);
});

test("退出裁决:预算内不退;预算后里程碑齐才退;未齐等待", () => {
  const base = { budgetMs: 2000, flattened: false, capMs: 8000 };
  assert.equal(splashShouldExit({ ...base, elapsedMs: 1000, allReached: true }), false);
  assert.equal(splashShouldExit({ ...base, elapsedMs: 2100, allReached: false }), false);
  assert.equal(splashShouldExit({ ...base, elapsedMs: 2100, allReached: true }), true);
});

test("退出裁决:硬上限必退;压平态驻留结束即退不等里程碑", () => {
  const base = { budgetMs: 2000, capMs: 8000 };
  assert.equal(splashShouldExit({ ...base, elapsedMs: 8100, flattened: false, allReached: false }), true);
  // 压平态仍播完(缩短的)驻留预算;预算内不退,预算后不等里程碑
  assert.equal(splashShouldExit({ ...base, elapsedMs: 400, flattened: true, allReached: false }), false);
  assert.equal(splashShouldExit({ ...base, elapsedMs: 2100, flattened: true, allReached: false }), true);
});
