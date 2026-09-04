/**
 * 内容包校验测试:validateContentPackV1 的拒绝条件与旧仓
 * parse_content_pack 对齐——版本、数量范围、id 字符集、两级唯一性。
 * 重建内容包(本模块 contentPack)的真实数据通过性由本文件末尾守卫 +
 * tutorial-port.test 的文案守卫共同覆盖。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  contentPack,
  packStepIds,
  packStepsOf,
  packTutorialIds,
  validateContentPackV1,
  type TutorialContentPackV1,
} from "./tutorial-content-pack.ts";

function pack(tutorials: { id: string; steps: string[] }[], version: 1 | 2 = 1) {
  return { version, tutorials } as TutorialContentPackV1;
}

test("合法包原样通过", () => {
  const ok = pack([{ id: "demo", steps: ["a", "b"] }]);
  assert.deepEqual(validateContentPackV1(ok), ok);
});

test("version 非 1 拒绝", () => {
  assert.throws(() => validateContentPackV1(pack([{ id: "d", steps: ["a"] }], 2)), /schema_version/);
});

test("教程数量越界拒绝(0 与 17)", () => {
  assert.throws(() => validateContentPackV1(pack([])), /tutorials_out_of_range/);
  const many = Array.from({ length: 17 }, (_, i) => ({ id: `t${i}`, steps: ["a"] }));
  assert.throws(() => validateContentPackV1(pack(many)), /tutorials_out_of_range/);
});

test("id 字符集:大写/下划线/空串/超长一律拒绝", () => {
  for (const bad of ["Demo", "de_mo", "", "x".repeat(65)]) {
    assert.throws(() => validateContentPackV1(pack([{ id: bad, steps: ["a"] }])), /tutorial_id/);
  }
  for (const bad of ["Step-A", "s_1", "x".repeat(65)]) {
    assert.throws(() => validateContentPackV1(pack([{ id: "d", steps: [bad] }])), /step_id/);
  }
});

test("教程 id 与步骤 id 两级唯一性", () => {
  assert.throws(
    () => validateContentPackV1(pack([{ id: "d", steps: ["a"] }, { id: "d", steps: ["b"] }])),
    /duplicate_tutorial/,
  );
  assert.throws(
    () => validateContentPackV1(pack([{ id: "d1", steps: ["a"] }, { id: "d2", steps: ["a"] }])),
    /duplicate_step/,
  );
});

test("步骤数量越界拒绝(0 与 33)", () => {
  assert.throws(() => validateContentPackV1(pack([{ id: "d", steps: [] }])), /steps_out_of_range/);
  const steps = Array.from({ length: 33 }, (_, i) => `s${i}`);
  assert.throws(() => validateContentPackV1(pack([{ id: "d", steps }])), /steps_out_of_range/);
});

test("重建内容包:六个教程、步骤非空、查询往返一致", () => {
  assert.deepEqual(packTutorialIds(), [
    "demo",
    "guide-start",
    "guide-basics",
    "guide-safety",
    "guide-devices",
    "guide-tutorials",
  ]);
  for (const tutorial of contentPack.tutorials) {
    assert.ok(tutorial.steps.length > 0, `${tutorial.id} 无步骤`);
    assert.deepEqual(packStepsOf(tutorial.id), tutorial.steps);
  }
  assert.equal(packStepsOf("no-such-tutorial"), null);
  assert.ok(packStepIds().length >= contentPack.tutorials.length);
});
