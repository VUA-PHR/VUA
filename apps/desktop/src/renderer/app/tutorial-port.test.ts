/**
 * 教程端口契约测试:
 * - inactive 占位实现的安全形状(浏览器预览/未接入路径);
 * - 步骤 id 耦合守卫:内容包(schemas/tutorial/v1/content.v1.json)的每个
 *   步骤 id 必须在字符串表中有文案(跨进程契约,改一侧不改另一侧时在此暴露;
 *   Rust 端 include_str! 内嵌同一份内容包)。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import { strings } from "../i18n/index.ts";
import { contentPack } from "./tutorial-content-pack.ts";
import { createInactiveTutorialPort } from "./tutorial-port.ts";

test("inactive 端口:快照为安全空态", async () => {
  const port = createInactiveTutorialPort();
  const snapshot = await port.snapshot();
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.status, "inactive");
  assert.equal(snapshot.sessionId, null);
  assert.equal(snapshot.tutorialId, null);
  assert.equal(snapshot.revision, 0);
  assert.equal(snapshot.currentStepId, null);
  assert.deepEqual(snapshot.allowedActions, []);
});

test("inactive 端口:dispatch 一律 rejected 且不抛出", async () => {
  const port = createInactiveTutorialPort();
  const result = await port.dispatch("next");
  assert.equal(result.kind, "rejected");
  assert.equal(result.snapshot.status, "inactive");
});

test("inactive 端口:subscribe 返回可用的退订函数", () => {
  const port = createInactiveTutorialPort();
  const unsubscribe = port.subscribe(() => {
    throw new Error("inactive port must not emit");
  });
  assert.equal(typeof unsubscribe, "function");
  unsubscribe();
});

test("步骤 id 守卫:内容包每个步骤 id 都有字符串表文案", () => {
  const pack = contentPack;
  const allStepIds = pack.tutorials.flatMap((t) => t.steps);
  // 内容包校验已保证全局唯一;此处再防一手校验被绕过
  assert.equal(new Set(allStepIds).size, allStepIds.length);
  for (const id of allStepIds) {
    const step = strings.tutorial.steps[id as keyof typeof strings.tutorial.steps];
    assert.ok(step, `缺少步骤 ${id} 的文案`);
    assert.ok(step.title.length > 0, `${id} 缺 title`);
    assert.ok(step.body.length > 0, `${id} 缺 body`);
  }
});

test("游戏引导五页各有一个内容包教程", () => {
  const pack = contentPack;
  const ids = new Set(pack.tutorials.map((t) => t.id));
  for (const pageTutorialId of [
    "guide-start",
    "guide-basics",
    "guide-safety",
    "guide-devices",
    "guide-tutorials",
  ]) {
    assert.ok(ids.has(pageTutorialId), `内容包缺教程 ${pageTutorialId}`);
  }
});
