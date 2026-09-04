/**
 * MediaSlot 状态机测试:加载/就绪/失败/重试语义
 * (ui-ux §2.8:骨架屏只表示加载中;失败必须诚实可达、可重试)。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  MEDIA_AUTO_RETRY_INTERVAL_MS,
  MEDIA_AUTO_RETRY_MAX,
  mediaReducer,
  shouldAutoRetry,
} from "./media-state.ts";

test("初始 loading,load 后就绪", () => {
  assert.equal(mediaReducer("loading", "load"), "ready");
});

test("加载失败进入 failed;failed 下 load 仍可就绪(迟到的成功)", () => {
  assert.equal(mediaReducer("loading", "error"), "failed");
  assert.equal(mediaReducer("failed", "load"), "ready");
});

test("仅失败态可重试;ready/loading 下 retry 是 no-op", () => {
  assert.equal(mediaReducer("failed", "retry"), "loading");
  assert.equal(mediaReducer("ready", "retry"), "ready");
  assert.equal(mediaReducer("loading", "retry"), "loading");
});

test("ready 下 error 也会回到 failed(重试后再次失败)", () => {
  assert.equal(mediaReducer("ready", "error"), "failed");
});

test("自动重试额度:retryCount 未达上限可重试,达上限停试", () => {
  assert.equal(shouldAutoRetry(0), true);
  assert.equal(shouldAutoRetry(MEDIA_AUTO_RETRY_MAX - 1), true);
  assert.equal(shouldAutoRetry(MEDIA_AUTO_RETRY_MAX), false);
  assert.equal(shouldAutoRetry(MEDIA_AUTO_RETRY_MAX + 1), false);
  // 显式自定义上限(数值可调承诺)
  assert.equal(shouldAutoRetry(3, 3), false);
});

test("自动重试参数保持正数且量级合理(防误改成 0/负数导致死循环请求)", () => {
  assert.ok(MEDIA_AUTO_RETRY_INTERVAL_MS >= 1000);
  assert.ok(MEDIA_AUTO_RETRY_MAX >= 1);
});
