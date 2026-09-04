import assert from "node:assert/strict";
import { test } from "vitest";
import { format } from "./format.ts";
import { strings } from "./strings.zh-CN.ts";
import { fixtureStrings } from "./strings.fixtures.zh-CN.ts";
import { TERMS, termLabel, termSequence, type TermId } from "./terms.ts";
import { capabilityDetailKeys, capabilityStates } from "../gateway/types.ts";
import { workflowRunStates } from "../gateway/workflow.ts";

test("format expands named params", () => {
  assert.equal(format(strings.deployer.summary.pending, { count: 2 }), "还差 2 项准备");
  assert.equal(format("{zone}的就绪状态", { zone: "游玩环境" }), "游玩环境的就绪状态");
});

test("format keeps placeholders for missing params (visible in dev)", () => {
  assert.equal(format("还差 {count} 项准备", {}), "还差 {count} 项准备");
});

test("term ids and term annotations stay in 1:1 parity", () => {
  assert.deepEqual(Object.keys(TERMS).sort(), Object.keys(strings.terms).sort());
});

test("termLabel renders term + local annotation; bare term when annotation is empty", () => {
  assert.equal(termLabel("warehouse"), "Warehouse 仓储");
  assert.equal(termLabel("release"), "Release 出厂");
  assert.equal(termLabel("amf"), "AMF");
  for (const id of Object.keys(TERMS) as TermId[]) {
    assert.ok(termLabel(id).startsWith(TERMS[id]), `${id} 显示必须以术语原形开头`);
  }
});

test("termSequence joins stage labels with arrows", () => {
  assert.equal(
    termSequence(["assembly", "production", "inspection"]),
    "Assembly 装配 → Production 生产 → Inspection 检测",
  );
});

test("deployer zones and workshop conclusion keys match their model unions", () => {
  assert.deepEqual(Object.keys(strings.deployer.zones).sort(), ["create", "play"]);
  assert.deepEqual(Object.keys(strings.workshop.conclusion).sort(), [
    "blocked",
    "completed",
    "needsConfirmation",
    "notStarted",
    "running",
  ]);
  assert.deepEqual(Object.keys(strings.workshop.stageState).sort(), [
    "blocked",
    "completed",
    "current",
    "needsConfirmation",
    "pending",
  ]);
});

test("capability states and workflow stages match their model unions", () => {
  assert.deepEqual(
    Object.keys(strings.capability.states).sort(),
    [...capabilityStates].sort(),
  );
  assert.deepEqual(
    Object.keys(strings.capability.details).sort(),
    [...capabilityDetailKeys].sort(),
  );
  assert.deepEqual(
    Object.keys(strings.workflowStage).sort(),
    [...workflowRunStates].sort(),
  );
});

test("no template embeds a product term (terms must flow via placeholders)", () => {
  const walk = (value: unknown, path: string): string[] => {
    if (typeof value === "string") {
      return Object.values(TERMS).some((term) => value.includes(term)) ? [path] : [];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item, i) => walk(item, `${path}[${i}]`));
    }
    if (value !== null && typeof value === "object") {
      return Object.entries(value).flatMap(([key, item]) => walk(item, `${path}.${key}`));
    }
    return [];
  };
  assert.deepEqual(walk(strings, "strings"), []);
  assert.deepEqual(walk(fixtureStrings, "fixtureStrings"), []);
});
