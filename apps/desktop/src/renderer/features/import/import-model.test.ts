import assert from "node:assert/strict";
import { test } from "vitest";
import {
  browseAvailability,
  embeddedBrowseReducer,
  initialEmbeddedBrowseState,
  type EmbeddedBrowseState,
} from "./import-model.ts";
import type { RemoteContentEventV1 } from "@vua/contracts";

/* 素材导入页云端段(M6 IMP-2 批 A,proposal 015 对账):能力两态判定与内嵌
 * 视图事件归约的纯函数覆盖。能力翻转(provider-bootstrap)随批 B;本测试
 * 锁定两态判据与事件语义,组件为薄渲染。 */

test("browseAvailability: 两态开关——仅显式 true 可用,未知/缺失保守不可用", () => {
  assert.deepEqual(browseAvailability(true), { kind: "available" });
  assert.deepEqual(browseAvailability(false), { kind: "unavailable" });
  assert.deepEqual(browseAvailability(undefined), { kind: "unavailable" });
  assert.deepEqual(browseAvailability("yes"), { kind: "unavailable" });
});

function reduce(state: EmbeddedBrowseState, event: RemoteContentEventV1): EmbeddedBrowseState {
  return embeddedBrowseReducer(state, event);
}

test("embeddedBrowseReducer: view-opened 打开跟踪,navigated 同步当前地址", () => {
  const opened = reduce(initialEmbeddedBrowseState, {
    kind: "view-opened",
    viewId: "rc-1",
    url: "https://booth.pm/",
  });
  assert.deepEqual(opened, {
    viewId: "rc-1",
    currentUrl: "https://booth.pm/",
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
});

test("embeddedBrowseReducer: view-closed 清空跟踪;他视图关闭不影响当前", () => {
  const opened = reduce(initialEmbeddedBrowseState, {
    kind: "view-opened",
    viewId: "rc-1",
    url: "https://booth.pm/",
  });
  // 空 viewId = session 级事件,不清当前视图跟踪
  const otherClosed = reduce(opened, { kind: "view-closed", viewId: "rc-other" });
  assert.equal(otherClosed.viewId, "rc-1");
  const closed = reduce(opened, { kind: "view-closed", viewId: "rc-1" });
  assert.deepEqual(closed, { viewId: null, currentUrl: null, lastBlocked: null });
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
