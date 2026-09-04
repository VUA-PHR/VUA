/**
 * G4 P3 DEV 入口载荷测试:
 * - 发布载荷覆盖内容包全部步骤 id(与 Rust 端内嵌注册表耦合守卫);
 * - 标签/模板/完成态/空态文案齐备(VR helper 不持有文案,缺一项即破图);
 * - 载荷为纯数据(可 JSON 序列化经 invoke 传输)。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import { contentPack } from "./tutorial-content-pack.ts";
import { buildCardContentPayload } from "./tutorial-overlay-dev.ts";

test("发布载荷覆盖内容包全部步骤且文案非空", () => {
  const payload = buildCardContentPayload();
  const allStepIds = contentPack.tutorials.flatMap((t) => t.steps);
  assert.deepEqual(Object.keys(payload.steps).sort(), [...allStepIds].sort());
  for (const id of allStepIds) {
    assert.ok(payload.steps[id]!.title.length > 0, `${id} title`);
    assert.ok(payload.steps[id]!.body.length > 0, `${id} body`);
  }
});

test("发布载荷:四语义动作标签与具名参数模板齐备", () => {
  const payload = buildCardContentPayload();
  for (const label of Object.values(payload.labels)) {
    assert.ok(label.length > 0);
  }
  assert.deepEqual(Object.keys(payload.labels).sort(), [
    "back",
    "dismiss",
    "next",
    "openOnDesktop",
  ]);
  assert.ok(payload.progressTemplate.includes("{index}"));
  assert.ok(payload.progressTemplate.includes("{total}"));
  assert.ok(payload.completed.title.length > 0);
  assert.ok(payload.completed.body.length > 0);
  assert.ok(payload.inactive.title.length > 0);
  assert.ok(payload.inactive.body.length > 0);
});

test("发布载荷为纯数据且呈现参数合法", () => {
  const payload = buildCardContentPayload();
  const round = JSON.parse(JSON.stringify(payload)) as unknown;
  assert.deepEqual(round, payload);
  assert.equal(payload.locale, "zh-CN");
  assert.ok(payload.textScale >= 0.5 && payload.textScale <= 3.0);
  assert.equal(typeof payload.reducedMotion, "boolean");
});
