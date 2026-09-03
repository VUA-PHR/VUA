import assert from "node:assert/strict";
import { test } from "vitest";
import {
  ensureLongTaskObserver,
  longTaskCount,
  perfMark,
  perfMeasure,
  recentMeasures,
  subscribePerfSamples,
} from "./perf-probe.ts";

test("perfMeasure 记录采样并返回耗时", () => {
  const before = recentMeasures().length;
  perfMark("probe-test-start");
  perfMark("probe-test-end");
  const duration = perfMeasure("probe-test", "probe-test-start", "probe-test-end");
  assert.ok(duration !== null && duration >= 0);
  assert.equal(recentMeasures().length, before + 1);
  assert.equal(recentMeasures().at(-1)?.name, "probe-test");
});

test("perfMeasure 在 mark 缺失时返回 null 而不抛出", () => {
  assert.equal(perfMeasure("probe-missing", "no-such-mark"), null);
});

test("采样缓冲上限 20,超出丢弃最旧", () => {
  perfMark("probe-cap");
  for (let i = 0; i < 30; i += 1) {
    perfMeasure(`probe-cap-${i}`, "probe-cap");
  }
  assert.equal(recentMeasures().length, 20);
  assert.equal(recentMeasures().at(-1)?.name, "probe-cap-29");
  assert.equal(recentMeasures().at(0)?.name, "probe-cap-10");
});

test("订阅者收到新采样通知,退订后不再收到", () => {
  let hits = 0;
  const unsubscribe = subscribePerfSamples(() => {
    hits += 1;
  });
  perfMark("probe-sub");
  perfMeasure("probe-sub-m", "probe-sub");
  assert.ok(hits >= 1);
  const after = hits;
  unsubscribe();
  perfMeasure("probe-sub-m2", "probe-sub");
  assert.equal(hits, after);
});

test("longtask 观察幂等且环境不支持时不抛错", () => {
  ensureLongTaskObserver();
  ensureLongTaskObserver();
  assert.ok(longTaskCount() >= 0);
});
