import assert from "node:assert/strict";
import { test, vi } from "vitest";
import {
  IMPORT_ACCEPTED_AUTO_CLOSE_MS,
  createAutoCloseTimer,
  BOOTH_HOME_URL,
  BOOTH_SIGN_IN_URL,
  browseAvailability,
  classifyRemoteOpenError,
  createBrowsePanelLifecycle,
  displayUrl,
  embeddedBrowseReducer,
  initialBrowseUrl,
  initialEmbeddedBrowseState,
  narrowCompletedDownloads,
  normalizeBrowseAddress,
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
 * 即关语义(卸载后落定的 open 随即关闭)锁定不回退。
 * BOARD #39 修复批(2026-09-18):地址输入归一化与打开失败分类覆盖——
 * 裸域名补 https://(用户真机实测 booth.pm 无前缀被 Main 源站清单按
 * origin_not_allowed 拒绝)、不可解析输入本地失败态、Main 拒绝按
 * origin_not_allowed/其它两分类,不猜测不借用其它命令面文案。 */

test("browseAvailability: 两态开关——仅显式 true 可用,未知/缺失保守不可用", () => {
  assert.deepEqual(browseAvailability(true), { kind: "available" });
  assert.deepEqual(browseAvailability(false), { kind: "unavailable" });
  assert.deepEqual(browseAvailability(undefined), { kind: "unavailable" });
  assert.deepEqual(browseAvailability("yes"), { kind: "unavailable" });
});

test("BOOTH_HOME_URL: 默认首页在浏览允许清单内(booth.pm)", () => {
  assert.equal(BOOTH_HOME_URL, "https://booth.pm/");
});

test("BOOTH_SIGN_IN_URL: 登录引导页在账户域,origin 已随批入内嵌浏览允许清单", () => {
  // 路径勘误(2026-09-23 真机实测):/sign_in 404,/users/sign_in 200(HTTP HEAD -L)
  assert.equal(BOOTH_SIGN_IN_URL, "https://accounts.booth.pm/users/sign_in");
  assert.equal(new URL(BOOTH_SIGN_IN_URL).origin, "https://accounts.booth.pm");
});

test("initialBrowseUrl: 未登录线索引导登录页;已登录/未知回落主页(unknown 不冒充已检测)", () => {
  assert.equal(initialBrowseUrl("none"), BOOTH_SIGN_IN_URL);
  assert.equal(initialBrowseUrl("stored"), BOOTH_HOME_URL);
  assert.equal(initialBrowseUrl("unknown"), BOOTH_HOME_URL);
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
  // 2026-09-22 核心 v0.5 接线批信封常量 0.4→0.5 机械跟随(positive 用例
  // 骑现行词面);下方负例保留 "0.4" 字面——升版后旧版本词面本身即词表外,
  // 与缺键/错 operation 同判不可解释。
  schemaVersion: "0.5",
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

test("normalizeBrowseAddress: 裸域名补 https://(#39 用户实测形态 booth.pm)", () => {
  assert.deepEqual(normalizeBrowseAddress("booth.pm"), {
    kind: "open",
    url: "https://booth.pm/",
  });
  // 前后空白照地址栏习惯 trim 后归一
  assert.deepEqual(normalizeBrowseAddress("  booth.pm  "), {
    kind: "open",
    url: "https://booth.pm/",
  });
  // 子域与路径原样保留,只补 scheme
  assert.deepEqual(normalizeBrowseAddress("accounts.booth.pm/login?next=%2F"), {
    kind: "open",
    url: "https://accounts.booth.pm/login?next=%2F",
  });
});

test("normalizeBrowseAddress: 已带 scheme 的输入原样验证不加工(清单协议裁决归 Main)", () => {
  assert.deepEqual(normalizeBrowseAddress("https://booth.pm/zh-cn"), {
    kind: "open",
    url: "https://booth.pm/zh-cn",
  });
  // 默认首页(自动打开路径)经归一化不变
  assert.deepEqual(normalizeBrowseAddress(BOOTH_HOME_URL), {
    kind: "open",
    url: BOOTH_HOME_URL,
  });
  // 其它 scheme 不补前缀,可解析则透传 Main(由清单/协议判定拒绝)
  assert.deepEqual(normalizeBrowseAddress("file:///C:/tmp/x"), {
    kind: "open",
    url: "file:///C:/tmp/x",
  });
});

test("normalizeBrowseAddress: 不可解析输入判 invalid(本地失败态,不上 Main)", () => {
  // 无 scheme 且不含 "."(不看似域名):不补前缀,原样不可解析
  assert.deepEqual(normalizeBrowseAddress("localhost"), { kind: "invalid" });
  assert.deepEqual(normalizeBrowseAddress("random words here"), { kind: "invalid" });
  // 以 "/" 开头:相对路径形态,不补前缀
  assert.deepEqual(normalizeBrowseAddress("/path-only"), { kind: "invalid" });
  // 看似域名但补前缀后仍不可解析(空格非合法 host 字符)
  assert.deepEqual(normalizeBrowseAddress("foo bar.pm"), { kind: "invalid" });
  // 已带 scheme 但 host 为空,同样不可解析
  assert.deepEqual(normalizeBrowseAddress("https://"), { kind: "invalid" });
  // 空输入
  assert.deepEqual(normalizeBrowseAddress(""), { kind: "invalid" });
  assert.deepEqual(normalizeBrowseAddress("   "), { kind: "invalid" });
});

test("classifyRemoteOpenError: Main 清单外拒绝(origin_not_allowed)与其它失败两分类", () => {
  // Electron invoke reject 包装 message 保留 Main 侧错误串(open handler
  // 对清单外唯一抛 Error("origin_not_allowed"))
  assert.deepEqual(
    classifyRemoteOpenError(
      new Error("Error invoking remote method 'vua:remote-content:open': Error: origin_not_allowed"),
    ),
    { kind: "origin-not-allowed" },
  );
  // 其余错误(身份/时序面)如实通用失败,不猜测
  assert.deepEqual(classifyRemoteOpenError(new Error("unknown_remote_view")), {
    kind: "open-failed",
  });
  assert.deepEqual(classifyRemoteOpenError(new Error("invalid remote content request")), {
    kind: "open-failed",
  });
  // 非 Error 值同样兜底通用失败
  assert.deepEqual(classifyRemoteOpenError("network down"), { kind: "open-failed" });
});

test("createAutoCloseTimer:受理时滞单次触发(1500ms 默认),不提前不双发", () => {
  vi.useFakeTimers();
  try {
    let closed = 0;
    const timer = createAutoCloseTimer(() => {
      closed++;
    });
    assert.equal(timer.pending, false, "未武装时不挂定时器");
    timer.schedule();
    assert.equal(timer.pending, true, "武装后挂定时器");
    vi.advanceTimersByTime(IMPORT_ACCEPTED_AUTO_CLOSE_MS - 1);
    assert.equal(closed, 0, "时滞内不提前关闭(用户须看见「已受理」)");
    vi.advanceTimersByTime(1);
    assert.equal(closed, 1, "恰在 1500ms 触发一次");
    assert.equal(timer.pending, false, "触发后自清");
    vi.advanceTimersByTime(10_000);
    assert.equal(closed, 1, "触发后不双发");
  } finally {
    vi.useRealTimers();
  }
});

test("createAutoCloseTimer:cancel 幂等且防触发——手动先关/失败驻留路径", () => {
  vi.useFakeTimers();
  try {
    let closed = 0;
    const timer = createAutoCloseTimer(() => {
      closed++;
    }, 1000);
    timer.schedule();
    timer.cancel();
    timer.cancel();
    assert.equal(timer.pending, false, "cancel 后不挂定时器(幂等)");
    vi.advanceTimersByTime(5_000);
    assert.equal(closed, 0, "取消后不触发(弹窗已被手动关闭/失败驻留)");
    // 重开弹窗 = 新实例:旧实例取消不影响新实例计时
    timer.schedule();
    vi.advanceTimersByTime(1_000);
    assert.equal(closed, 1, "重新武装后正常触发");
  } finally {
    vi.useRealTimers();
  }
});

test("createAutoCloseTimer:重入 schedule 先清旧柄——同窗二次受理不双发", () => {
  vi.useFakeTimers();
  try {
    let closed = 0;
    const timer = createAutoCloseTimer(() => {
      closed++;
    }, 1500);
    timer.schedule();
    vi.advanceTimersByTime(1_000);
    timer.schedule();
    assert.equal(timer.pending, true, "重入武装仍恰一柄");
    vi.advanceTimersByTime(1_499);
    assert.equal(closed, 0, "旧时点不触发(已被重入清除)");
    vi.advanceTimersByTime(1);
    assert.equal(closed, 1, "恰在新时点触发一次");
    vi.advanceTimersByTime(1_500);
    assert.equal(closed, 1, "不双发");
  } finally {
    vi.useRealTimers();
  }
});
