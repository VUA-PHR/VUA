import assert from "node:assert/strict";
import { test } from "vitest";
import {
  BOOTH_HOME_URL,
  browseAvailability,
  createBrowsePanelLifecycle,
  displayUrl,
  embeddedBrowseReducer,
  initialEmbeddedBrowseState,
  narrowCompletedDownloads,
  type EmbeddedBrowseState,
} from "./import-model.ts";
import type { RemoteContentEventV1 } from "@vua/contracts";

/* 素材导入页云端段(M6 IMP-2 批 A,proposal 015 对账):能力两态判定与内嵌
 * 视图事件归约的纯函数覆盖。能力翻转(provider-bootstrap)随批 B;本测试
 * 锁定两态判据与事件语义,组件为薄渲染。
 * 用户实测缺口修复(2026-09-12):默认首页常量、导航历史可走性同步与
 * 地址脱敏显示在本文件补齐锁定。
 * BOARD #36 缺陷②修复批(2026-09-18):downloads.listCompleted 收窄纯函数
 * 覆盖——live 形状 = bdl-queries 三键信封(缺陷②根因:平铺读恒 undefined
 * →诚实 unavailable 假象),正例/负例/空态/形态不齐逐项钉死。
 * BOARD #37 修复批(2026-09-18):生命周期代次时序覆盖——StrictMode 双挂载
 * (mount→cleanup→mount)下原 disposedRef 布尔永真致所有 open 落定即自关
 * (根因),代次模型使首挂过期 open 失配关闭、活跃挂载 open 保留;#25 卸载
 * 即关语义(卸载后落定的 open 随即关闭)锁定不回退。 */

test("browseAvailability: 两态开关——仅显式 true 可用,未知/缺失保守不可用", () => {
  assert.deepEqual(browseAvailability(true), { kind: "available" });
  assert.deepEqual(browseAvailability(false), { kind: "unavailable" });
  assert.deepEqual(browseAvailability(undefined), { kind: "unavailable" });
  assert.deepEqual(browseAvailability("yes"), { kind: "unavailable" });
});

test("BOOTH_HOME_URL: 默认首页在浏览允许清单内(booth.pm)", () => {
  assert.equal(BOOTH_HOME_URL, "https://booth.pm/");
});

test("displayUrl: origin+路径显示,弃查询串与片段;解析失败如实回显原文", () => {
  assert.equal(displayUrl("https://booth.pm/items/1234"), "https://booth.pm/items/1234");
  assert.equal(
    displayUrl("https://booth.pm/search?q=avatar&token=secret#results"),
    "https://booth.pm/search",
  );
  assert.equal(
    displayUrl("https://accounts.booth.pm/login?next=%2F"),
    "https://accounts.booth.pm/login",
  );
  assert.equal(displayUrl("not a url"), "not a url");
});

function reduce(state: EmbeddedBrowseState, event: RemoteContentEventV1): EmbeddedBrowseState {
  return embeddedBrowseReducer(state, event);
}

test("embeddedBrowseReducer: view-opened 打开跟踪(历史可走性复位),navigated 同步当前地址与历史", () => {
  const opened = reduce(initialEmbeddedBrowseState, {
    kind: "view-opened",
    viewId: "rc-1",
    url: "https://booth.pm/",
  });
  assert.deepEqual(opened, {
    viewId: "rc-1",
    currentUrl: "https://booth.pm/",
    canGoBack: false,
    canGoForward: false,
    lastBlocked: null,
  });
  const navigated = reduce(opened, {
    kind: "navigated",
    viewId: "rc-1",
    url: "https://booth.pm/items/1",
    canGoBack: true,
    canGoForward: false,
  });
  assert.equal(navigated.currentUrl, "https://booth.pm/items/1");
  assert.equal(navigated.viewId, "rc-1");
  // 导航条后退/前进按钮禁用判据:navigated 事件同步可走性
  assert.equal(navigated.canGoBack, true);
  assert.equal(navigated.canGoForward, false);
  const forward = reduce(navigated, {
    kind: "navigated",
    viewId: "rc-1",
    url: "https://booth.pm/items/2",
    canGoBack: true,
    canGoForward: true,
  });
  assert.equal(forward.canGoBack, true);
  assert.equal(forward.canGoForward, true);
});

test("embeddedBrowseReducer: view-closed 清空跟踪(含历史可走性);他视图关闭不影响当前", () => {
  const opened = reduce(initialEmbeddedBrowseState, {
    kind: "view-opened",
    viewId: "rc-1",
    url: "https://booth.pm/",
  });
  const navigated = reduce(opened, {
    kind: "navigated",
    viewId: "rc-1",
    url: "https://booth.pm/items/1",
    canGoBack: true,
    canGoForward: true,
  });
  // 空 viewId = session 级事件,不清当前视图跟踪
  const otherClosed = reduce(navigated, { kind: "view-closed", viewId: "rc-other" });
  assert.equal(otherClosed.viewId, "rc-1");
  const closed = reduce(navigated, { kind: "view-closed", viewId: "rc-1" });
  assert.deepEqual(closed, {
    viewId: null,
    currentUrl: null,
    canGoBack: false,
    canGoForward: false,
    lastBlocked: null,
  });
});

test("embeddedBrowseReducer: blocked 留痕呈现(诚实上报,不静默)", () => {
  const opened = reduce(initialEmbeddedBrowseState, {
    kind: "view-opened",
    viewId: "rc-1",
    url: "https://booth.pm/",
  });
  const blocked = reduce(opened, {
    kind: "blocked",
    viewId: "rc-1",
    url: "https://example.test/popup",
    reason: "popup_denied",
  });
  assert.equal(blocked.lastBlocked, "https://example.test/popup");
  assert.equal(blocked.viewId, "rc-1");
});

/* ---- 生命周期代次(BOARD #37 修复批,2026-09-18) ---- */

test("browsePanelLifecycle: StrictMode 双挂载时序——首挂过期 open 失配关闭孤儿,活跃挂载 open 保留(#37 根因修复点)", () => {
  const lifecycle = createBrowsePanelLifecycle();
  const firstMount = lifecycle.mount(); // StrictMode 挂载#1
  assert.equal(firstMount, 1);
  const autoOpenFirst = lifecycle.capture(); // 首挂自动打开(booth.pm)
  lifecycle.unmount(); // StrictMode 清理#1
  lifecycle.mount(); // StrictMode 挂载#2(原 disposedRef 在此之后永真)
  const autoOpenSecond = lifecycle.capture(); // 次挂自动打开
  // 首挂的 open 在次挂后才落定:代次失配 = 孤儿视图随即关闭,不留泄漏
  assert.equal(lifecycle.isStale(autoOpenFirst), true);
  // 次挂(活跃挂载)的 open 落定:代次匹配 = 保留(#37 此前被竞态兜底误关)
  assert.equal(lifecycle.isStale(autoOpenSecond), false);
  // 用户此后点「打开」:同一活跃代次,不再被瞬间自关
  const manualOpen = lifecycle.capture();
  assert.equal(lifecycle.isStale(manualOpen), false);
});

test("browsePanelLifecycle: 真实卸载语义(#25 不回退)——卸载后落定的 open 失配,随即关闭不留失联视图", () => {
  const lifecycle = createBrowsePanelLifecycle();
  lifecycle.mount();
  const inFlight = lifecycle.capture(); // open 已发起未落定
  assert.equal(lifecycle.isStale(inFlight), false);
  lifecycle.unmount(); // 切页卸载(清理同时显式关闭已托管视图)
  // open 在卸载后才落定:视图随即关闭,不残留失联视图
  assert.equal(lifecycle.isStale(inFlight), true);
});

test("browsePanelLifecycle: 生产单次挂载全周期——捕获即活跃代次,open 正常保留", () => {
  const lifecycle = createBrowsePanelLifecycle();
  assert.equal(lifecycle.mount(), 1);
  const generation = lifecycle.capture();
  assert.equal(generation, 1);
  assert.equal(lifecycle.isStale(generation), false);
});

/* ---- downloads.listCompleted 收窄(BOARD #36 缺陷②,2026-09-18) ---- */

const wireRow = (overrides: Record<string, unknown> = {}) => ({
  adoptedWarehouseItemIds: [],
  completedAt: "2026-09-17T20:00:00.000Z",
  downloadId: "dl-1",
  receivedBytes: 2048,
  sourceUrl: "https://booth.pm/download/1",
  suggestedFileName: "pack.unitypackage",
  ...overrides,
});

const bdlEnvelope = (result: unknown) => ({
  schemaVersion: "0.4",
  operation: "downloads.listCompleted",
  result,
});

test("narrowCompletedDownloads: live 三键信封正例收窄,行原样透传", () => {
  const rows = narrowCompletedDownloads(bdlEnvelope({ downloads: [wireRow()] }));
  assert.ok(Array.isArray(rows));
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], wireRow());
});

test("narrowCompletedDownloads: 空 downloads = 诚实空数组(空态即终态)", () => {
  assert.deepEqual(narrowCompletedDownloads(bdlEnvelope({ downloads: [] })), []);
});

test("narrowCompletedDownloads: 非信封形状(契约平铺值/缺键/词表外 operation/schemaVersion)判不可解释", () => {
  // 缺陷②的旧形状:平铺 {downloads} 无信封 → null(不可解释,非空态)
  assert.equal(narrowCompletedDownloads({ downloads: [wireRow()] }), null);
  assert.equal(narrowCompletedDownloads({ schemaVersion: "0.4", result: { downloads: [] } }), null);
  assert.equal(
    narrowCompletedDownloads({ schemaVersion: "0.4", operation: "catalog.list", result: {} }),
    null,
  );
  assert.equal(
    narrowCompletedDownloads({
      schemaVersion: "9.9",
      operation: "downloads.listCompleted",
      result: { downloads: [] },
    }),
    null,
  );
  assert.equal(narrowCompletedDownloads(null), null);
  assert.equal(narrowCompletedDownloads("ok"), null);
});

test("narrowCompletedDownloads: result 缺 downloads 行数组或行形态不齐判不可解释", () => {
  assert.equal(narrowCompletedDownloads(bdlEnvelope({})), null);
  assert.equal(narrowCompletedDownloads(bdlEnvelope({ downloads: "all" })), null);
  // 行缺键(suggestedFileName 缺席)= 提供方响应不可解释,整批判 null
  const missingKey = wireRow();
  delete (missingKey as { suggestedFileName?: unknown }).suggestedFileName;
  assert.equal(narrowCompletedDownloads(bdlEnvelope({ downloads: [missingKey] })), null);
  // 行多余键 = 形态不齐,同纪律
  assert.equal(
    narrowCompletedDownloads(bdlEnvelope({ downloads: [{ ...wireRow(), adopted: true }] })),
    null,
  );
  // suggestedFileName null = 端口未报告的合法值(契约面 Option)
  const nullable = narrowCompletedDownloads(
    bdlEnvelope({ downloads: [wireRow({ suggestedFileName: null })] }),
  );
  assert.ok(Array.isArray(nullable));
  assert.equal(nullable[0]?.suggestedFileName, null);
});
