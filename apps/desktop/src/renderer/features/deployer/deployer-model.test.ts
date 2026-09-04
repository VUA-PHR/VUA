import assert from "node:assert/strict";
import { test } from "vitest";
import { format } from "../../i18n/format.ts";
import { strings } from "../../i18n/strings.zh-CN.ts";
import {
  creatorEnvReady,
  neverChecked,
  relativeTimeKey,
  summarizeHealth,
  type CheckItem,
  type DeployerView,
  type ZoneCheckResult,
  type ZonePhase,
} from "./deployer-model.ts";

const ok = (id: string): CheckItem => ({
  id,
  zone: "play",
  title: id,
  status: "ok",
  description: "ok",
});

const createOk = (id: string): CheckItem => ({ ...ok(id), zone: "create" });

test("all checks green: ready key and next-step CTA", () => {
  const summary = summarizeHealth([ok("a"), ok("b")]);
  assert.equal(summary.ready, true);
  assert.equal(summary.pendingCount, 0);
  assert.equal(summary.overall, "ok");
  assert.equal(summary.headlineKey, "ready");
  assert.equal(summary.ctaKey, "enterNext");
});

test("empty list is never ready: no evidence, no safety conclusion", () => {
  const summary = summarizeHealth([]);
  assert.equal(summary.ready, false);
  assert.equal(summary.pendingCount, 0);
  assert.equal(summary.overall, "unknown");
  assert.equal(summary.headlineKey, "empty");
});

test("mixed checks: pending key carries count param, worst status wins", () => {
  const items: CheckItem[] = [
    ok("a"),
    { id: "b", zone: "play", title: "b", status: "warning", description: "needs review" },
    { id: "c", zone: "play", title: "c", status: "error", description: "needs fix" },
  ];
  const summary = summarizeHealth(items);
  assert.equal(summary.ready, false);
  assert.equal(summary.pendingCount, 2);
  assert.equal(summary.overall, "error");
  assert.equal(summary.headlineKey, "pending");
  assert.equal(summary.ctaKey, "fixAll");
  // 插值纪律:具名参数模板展开(验收:禁止拼接造句)
  assert.equal(
    format(strings.deployer.summary.pending, summary.headlineParams),
    "还差 2 项准备",
  );
});

test("warnings without errors: overall is warning, not error", () => {
  const summary = summarizeHealth([
    ok("a"),
    { id: "b", zone: "play", title: "b", status: "warning", description: "needs review" },
  ]);
  assert.equal(summary.overall, "warning");
  assert.equal(summary.pendingCount, 1);
});

test("ready headline resolves through the zone string table", () => {
  const summary = summarizeHealth([createOk("a")]);
  assert.equal(summary.headlineKey, "ready");
  assert.equal(strings.deployer.zones.create.readyHeadline, "可以开始制作 Avatar 了");
});

test("creator readiness: not-run is never ready", () => {
  assert.equal(creatorEnvReady(neverChecked()), false);
});

test("creator readiness: running / failed without evidence are never ready", () => {
  const playNotRun: ZonePhase = { kind: "not-run" };
  const running: ZonePhase = { kind: "running", startedAt: "2026-08-27T10:00:00+08:00", last: null };
  const failed: ZonePhase = { kind: "failed", last: null };
  assert.equal(creatorEnvReady({ zones: { play: playNotRun, create: running } }), false);
  assert.equal(creatorEnvReady({ zones: { play: playNotRun, create: failed } }), false);
});

test("creator readiness: failed keeps stale evidence but is not current readiness", () => {
  const stale: ZoneCheckResult = { items: [createOk("unity")], checkedAt: "2026-08-27T09:00:00+08:00" };
  const view: DeployerView = {
    zones: { play: { kind: "not-run" }, create: { kind: "failed", last: stale } },
  };
  assert.equal(creatorEnvReady(view), false);
});

test("creator readiness: all create-zone checks green means ready", () => {
  const view: DeployerView = {
    zones: {
      play: { kind: "not-run" },
      create: { kind: "results", items: [createOk("unity"), createOk("vpm")], checkedAt: "2026-08-27T10:00:00+08:00" },
    },
  };
  assert.equal(creatorEnvReady(view), true);
});

test("creator readiness: play-zone failures do not block creation", () => {
  const view: DeployerView = {
    zones: {
      play: {
        kind: "results",
        items: [{ ...ok("vrchat"), status: "error" }],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
      create: { kind: "results", items: [createOk("unity")], checkedAt: "2026-08-27T10:00:00+08:00" },
    },
  };
  assert.equal(creatorEnvReady(view), true);
});

test("creator readiness: any create-zone miss means not ready", () => {
  const view: DeployerView = {
    zones: {
      play: { kind: "not-run" },
      create: {
        kind: "results",
        items: [createOk("unity"), { ...createOk("vpm"), status: "warning" }],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
    },
  };
  assert.equal(creatorEnvReady(view), false);
});

test("creator readiness: results without create-zone items are not trusted", () => {
  const view: DeployerView = {
    zones: {
      play: { kind: "results", items: [ok("vrchat")], checkedAt: "2026-08-27T10:00:00+08:00" },
      create: { kind: "results", items: [], checkedAt: "2026-08-27T10:00:00+08:00" },
    },
  };
  assert.equal(creatorEnvReady(view), false);
});

test("relativeTimeKey: 分桶与截断(分钟/小时/天)", () => {
  const now = Date.parse("2026-08-28T12:00:00Z");
  assert.deepEqual(relativeTimeKey("2026-08-28T11:59:30Z", now), { key: "justNow", count: 0 });
  assert.deepEqual(relativeTimeKey("2026-08-28T11:41:00Z", now), { key: "minutesAgo", count: 19 });
  assert.deepEqual(relativeTimeKey("2026-08-28T09:00:00Z", now), { key: "hoursAgo", count: 3 });
  assert.deepEqual(relativeTimeKey("2026-08-23T12:00:00Z", now), { key: "daysAgo", count: 5 });
});

test("relativeTimeKey: 非法时间戳回退 null;未来时间钳到 justNow", () => {
  const now = Date.parse("2026-08-28T12:00:00Z");
  assert.equal(relativeTimeKey("not-a-date", now), null);
  assert.deepEqual(relativeTimeKey("2026-08-29T12:00:00Z", now), { key: "justNow", count: 0 });
});
