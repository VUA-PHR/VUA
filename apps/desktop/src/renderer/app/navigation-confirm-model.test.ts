import assert from "node:assert/strict";
import { test } from "vitest";
import {
  emptyNavConfirmQueue,
  navConfirmAnswer,
  navConfirmEnqueue,
} from "./navigation-confirm-model.ts";
import type { NavigationConfirmRequestV1 } from "@vua/contracts";

/* 导航确认流(015 §12,批 B-3)队列状态机:逐次阻断式确认(A-1)的呈现侧
 * 纯函数;作答只作用于队首;用户不答=队列保持=导航不执行(无超时)。 */

function request(confirmId: string): NavigationConfirmRequestV1 {
  return { confirmId, url: `https://example.test/${confirmId}`, reason: "origin_not_allowed" };
}

test("navConfirmEnqueue: 新请求入队尾;同 confirmId 不重复入队", () => {
  const q1 = navConfirmEnqueue(emptyNavConfirmQueue, request("a"));
  assert.equal(q1.length, 1);
  const q2 = navConfirmEnqueue(q1, request("b"));
  assert.equal(q2.length, 2);
  assert.equal(q2[0]?.confirmId, "a");
  assert.equal(q2[1]?.confirmId, "b");
  const q3 = navConfirmEnqueue(q2, request("a"));
  assert.equal(q3.length, 2);
});

test("navConfirmAnswer: 只作答队首,余队保持顺序", () => {
  const queue = navConfirmEnqueue(
    navConfirmEnqueue(emptyNavConfirmQueue, request("a")),
    request("b"),
  );
  const first = navConfirmAnswer(queue, true);
  assert.equal(first.answered?.confirmId, "a");
  assert.equal(first.answered?.approved, true);
  assert.deepEqual(
    first.queue.map((item) => item.confirmId),
    ["b"],
  );
  const second = navConfirmAnswer(first.queue, false);
  assert.equal(second.answered?.confirmId, "b");
  assert.equal(second.answered?.approved, false);
  assert.equal(second.queue.length, 0);
});

test("navConfirmAnswer: 空队列调用不猜测,状态不变", () => {
  const result = navConfirmAnswer(emptyNavConfirmQueue, true);
  assert.equal(result.answered, null);
  assert.equal(result.queue.length, 0);
});
