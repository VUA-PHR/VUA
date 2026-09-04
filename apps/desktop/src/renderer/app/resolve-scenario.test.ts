import assert from "node:assert/strict";
import { test } from "vitest";
import { fixtureNames, resolveScenarioName } from "./resolve-scenario.ts";

test("production always resolves to not-run, ignoring any requested name", () => {
  assert.equal(resolveScenarioName(false, null), "not-run");
  assert.equal(resolveScenarioName(false, "demo-mixed"), "not-run");
  assert.equal(resolveScenarioName(false, "demo-all-green"), "not-run");
  assert.equal(resolveScenarioName(false, "not-run"), "not-run");
});

test("dev defaults to the mixed fixture", () => {
  assert.equal(resolveScenarioName(true, null), "demo-mixed");
});

test("dev accepts explicit fixture names and the honest empty state", () => {
  for (const name of fixtureNames) {
    assert.equal(resolveScenarioName(true, name), name);
  }
  assert.equal(resolveScenarioName(true, "not-run"), "not-run");
});

test("dev falls back to default on unknown names", () => {
  assert.equal(resolveScenarioName(true, "demo-rm-rf"), "demo-mixed");
  assert.equal(resolveScenarioName(true, ""), "demo-mixed");
});
