import assert from "node:assert/strict";
import { test } from "vitest";
import {
  emptyLifecycle,
  lifecycleOf,
  parseStoredLifecycle,
  serializeLifecycle,
  setPurchaseMark,
} from "./asset-lifecycle.ts";

test("解析: 非法 JSON / 未知版本 / 非对象一律回退空态", () => {
  assert.deepEqual(parseStoredLifecycle(null), emptyLifecycle);
  assert.deepEqual(parseStoredLifecycle("not json"), emptyLifecycle);
  assert.deepEqual(parseStoredLifecycle('{"version":2,"assets":{}}'), emptyLifecycle);
  assert.deepEqual(parseStoredLifecycle('{"version":1}'), emptyLifecycle);
  assert.deepEqual(parseStoredLifecycle('"string"'), emptyLifecycle);
});

test("解析: 只恢复用户确认标记,其余维度恒初始值", () => {
  const raw = JSON.stringify({
    version: 1,
    assets: {
      "booth:1": { purchase: "user_confirmed", download: "downloaded" },
      "booth:2": { purchase: "unknown" },
      "booth:3": "garbage",
    },
  });
  const stored = parseStoredLifecycle(raw);
  // 伪造的 download 维度不被采信;unknown 与畸形条目不恢复
  assert.deepEqual(Object.keys(stored.assets), ["booth:1"]);
  assert.equal(lifecycleOf(stored, "booth:1").purchase, "user_confirmed");
  assert.equal(lifecycleOf(stored, "booth:1").download, "not_downloaded");
  assert.equal(lifecycleOf(stored, "booth:2").purchase, "unknown");
});

test("标记: 确认写入记录,取消移除记录(不留 unknown 墓碑)", () => {
  const marked = setPurchaseMark(emptyLifecycle, "booth:1", true);
  assert.equal(lifecycleOf(marked, "booth:1").purchase, "user_confirmed");
  const unmarked = setPurchaseMark(marked, "booth:1", false);
  assert.deepEqual(unmarked, emptyLifecycle);
  assert.equal(lifecycleOf(unmarked, "booth:1").purchase, "unknown");
});

test("序列化往返: 标记经 JSON 持久化后可恢复", () => {
  const marked = setPurchaseMark(emptyLifecycle, "booth:1", true);
  const restored = parseStoredLifecycle(serializeLifecycle(marked));
  assert.deepEqual(restored, marked);
});
