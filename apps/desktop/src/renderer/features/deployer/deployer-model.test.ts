import assert from "node:assert/strict";
import { test } from "vitest";
import { format } from "../../i18n/format.ts";
import { strings } from "../../i18n/strings.zh-CN.ts";
import {
  CHECK_GROUPS,
  CREATE_GATE_IDS,
  creatorEnvReady,
  isCreateGateItem,
  neverChecked,
  relativeTimeKey,
  summarizeGroup,
  summarizeHealth,
  zoneSummaryItems,
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

/* ---- 替代组(CHECK_GROUPS):VR 运行时任选其一 ---- */

const grouped = (id: string, status: CheckItem["status"]): CheckItem => ({
  ...ok(id),
  status,
  groupId: "vr_runtime",
});

test("替代组注册表:vr_runtime 组覆盖引擎全部运行时检查项", () => {
  const group = CHECK_GROUPS.find((entry) => entry.id === "vr_runtime");
  assert.ok(group);
  assert.equal(group.zone, "play");
  assert.deepEqual([...group.memberIds].sort(), [
    "alvr",
    "bigscreen_beyond",
    "hp_omnicept",
    "oculus_runtime",
    "openxr_runtime",
    "pico_runtime",
    "pimax_runtime",
    "psvr2",
    "steamvr",
    "varjo_runtime",
    "virtual_desktop",
    "vive_runtime",
  ]);
});

test("组已满足:未安装成员是 info 中性项,不产生待办,整组绿灯", () => {
  // 用户场景(2026-09-18):SteamVR/Oculus/PICO 已检测到,
  // VIVE/Virtual Desktop/ALVR 未安装不应再"还差 3 项"
  const items = [
    ok("steam"),
    grouped("steamvr", "ok"),
    grouped("oculus_runtime", "ok"),
    grouped("vive_runtime", "info"),
    grouped("virtual_desktop", "info"),
    grouped("alvr", "info"),
  ];
  const summary = summarizeHealth(items);
  assert.equal(summary.ready, true);
  assert.equal(summary.pendingCount, 0);
  assert.equal(summary.overall, "ok");
  assert.equal(summary.headlineKey, "ready");
});

test("组未满足:整组只计 1 项待办,而非每成员一项", () => {
  const items = [
    ok("steam"),
    grouped("steamvr", "warning"),
    grouped("oculus_runtime", "warning"),
    grouped("vive_runtime", "warning"),
  ];
  const summary = summarizeHealth(items);
  assert.equal(summary.ready, false);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.overall, "warning");
  assert.equal(format(strings.deployer.summary.pending, summary.headlineParams), "还差 1 项准备");
});

test("组未满足且有成员检测失败:整组计 1 项,总览升 error(观测失败不降级)", () => {
  const items = [grouped("steamvr", "warning"), grouped("alvr", "error")];
  const summary = summarizeHealth(items);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.overall, "error");
});

test("summarizeGroup 裁决:任一 ok 即组 ok;无 ok 有 error 即 error;否则 warning", () => {
  assert.equal(summarizeGroup([grouped("a", "info"), grouped("b", "ok")]), "ok");
  assert.equal(summarizeGroup([grouped("a", "warning"), grouped("b", "error")]), "error");
  assert.equal(summarizeGroup([grouped("a", "warning"), grouped("b", "info")]), "warning");
  // 组已满足时残留的检测失败成员不拖垮组裁决(成员行仍以红灯如实呈现)
  assert.equal(summarizeGroup([grouped("a", "ok"), grouped("b", "error")]), "ok");
});

test("info 中性项不计待办;独立项行为不变(回归)", () => {
  const summary = summarizeHealth([
    { ...ok("a"), status: "info" },
    { ...ok("b"), status: "warning" },
  ]);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.overall, "warning");
});

/* ---- 生产门组成(2026-09-20 用户裁决:「没有 ALCOM 或者没有 VCC 不应作为
 * 阻塞」+库优先架构;Unity 编辑器已检测是唯一硬前置,门内项用引擎词表
 * checkId;此前"创作辖区全项 ok 才开门"的组成随裁决废止)---- */

test("生产门注册表:唯一硬前置是 Unity 编辑器(引擎词表 id)", () => {
  assert.deepEqual([...CREATE_GATE_IDS], ["unity_editors"]);
  assert.equal(isCreateGateItem("unity_editors"), true);
  // 信息性展示项不进门(vpm_cli 内嵌库恒在;vcc/alcom/磁盘是可选管理器与容量事实)
  assert.equal(isCreateGateItem("vpm_cli"), false);
  assert.equal(isCreateGateItem("vcc"), false);
  assert.equal(isCreateGateItem("disk_space"), false);
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
  const stale: ZoneCheckResult = {
    items: [createOk("unity_editors")],
    checkedAt: "2026-08-27T09:00:00+08:00",
  };
  const view: DeployerView = {
    zones: { play: { kind: "not-run" }, create: { kind: "failed", last: stale } },
  };
  assert.equal(creatorEnvReady(view), false);
});

test("生产门:仅 Unity 编辑器已检测即开门,信息性项全缺不挡门(用户裁决钉例)", () => {
  const view: DeployerView = {
    zones: {
      play: { kind: "not-run" },
      create: {
        kind: "results",
        items: [
          createOk("unity_editors"),
          { ...createOk("vpm_cli"), status: "warning" },
          { ...createOk("vcc"), status: "warning" },
          { ...createOk("alcom"), status: "warning" },
          { ...createOk("disk_space"), status: "warning" },
        ],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
    },
  };
  assert.equal(creatorEnvReady(view), true);
});

test("生产门:Unity 编辑器缺失(未检测到)门关", () => {
  const view: DeployerView = {
    zones: {
      play: { kind: "not-run" },
      create: {
        kind: "results",
        items: [
          { ...createOk("unity_editors"), status: "warning" },
          createOk("vpm_cli"),
          createOk("vcc"),
        ],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
    },
  };
  assert.equal(creatorEnvReady(view), false);
});

test("生产门:门内项检测失败(detection_failed)门关,信息性项检测失败不拖门", () => {
  const gateFailed: DeployerView = {
    zones: {
      play: { kind: "not-run" },
      create: {
        kind: "results",
        items: [{ ...createOk("unity_editors"), status: "error" }, createOk("vcc")],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
    },
  };
  assert.equal(creatorEnvReady(gateFailed), false);
  const infoFailed: DeployerView = {
    zones: {
      play: { kind: "not-run" },
      create: {
        kind: "results",
        items: [createOk("unity_editors"), { ...createOk("vcc"), status: "error" }],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
    },
  };
  assert.equal(creatorEnvReady(infoFailed), true);
});

test("creator readiness: play-zone failures do not block creation", () => {
  const view: DeployerView = {
    zones: {
      play: {
        kind: "results",
        items: [{ ...ok("vrchat"), status: "error" }],
        checkedAt: "2026-08-27T10:00:00+08:00",
      },
      create: { kind: "results", items: [createOk("unity_editors")], checkedAt: "2026-08-27T10:00:00+08:00" },
    },
  };
  assert.equal(creatorEnvReady(view), true);
});

test("生产门:无门内检测证据不开门(全信息性项结果不构成门证据)", () => {
  const view: DeployerView = {
    zones: {
      play: { kind: "results", items: [ok("vrchat")], checkedAt: "2026-08-27T10:00:00+08:00" },
      create: {
        kind: "results",
        items: [createOk("vpm_cli"), createOk("vcc")],
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

/* ---- 计数口径(2026-09-20 用户裁决:「还差 N 项准备」只数门内项)---- */

test("计数口径:创作辖区摘要只取门内项,游玩辖区全量计入", () => {
  const createItems = [
    createOk("unity_editors"),
    { ...createOk("vpm_cli"), status: "warning" },
    { ...createOk("vcc"), status: "warning" },
  ] as CheckItem[];
  assert.deepEqual(
    zoneSummaryItems("create", createItems).map((item) => item.id),
    ["unity_editors"],
  );
  // 汇总语义:信息性项缺失不再产出"还差 N 项"待办(门内 Unity ok → ready)
  const summary = summarizeHealth(zoneSummaryItems("create", createItems));
  assert.equal(summary.ready, true);
  assert.equal(summary.pendingCount, 0);
  // Unity 缺 → 唯一门内待办
  const gateMissing = summarizeHealth(
    zoneSummaryItems("create", [
      { ...createOk("unity_editors"), status: "warning" },
      { ...createOk("vcc"), status: "warning" },
    ]),
  );
  assert.equal(gateMissing.ready, false);
  assert.equal(gateMissing.pendingCount, 1);
  assert.equal(
    format(strings.deployer.summary.pending, gateMissing.headlineParams),
    "还差 1 项准备",
  );
  // 游玩辖区无门概念:全量计入(替代组计数照旧)
  const playItems: CheckItem[] = [ok("steam"), { ...ok("vrchat"), status: "warning" }];
  assert.equal(zoneSummaryItems("play", playItems).length, 2);
  assert.equal(summarizeHealth(zoneSummaryItems("play", playItems)).pendingCount, 1);
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
