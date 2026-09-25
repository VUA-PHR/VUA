import assert from "node:assert/strict";
import { test } from "vitest";
import {
  envGoalEnabled,
  goalEnabled,
  migratePageId,
  parseStoredGoals,
  resolveEntry,
  sanitizeGoals,
  serializeGoals,
  type StoredGoalsV1,
} from "./onboarding-model.ts";

const completedAll: StoredGoalsV1 = {
  version: 1,
  onboarding: "completed",
  goals: ["env", "guide"],
  environments: ["play", "create"],
};

test("parse: invalid JSON, unknown version and missing fields are treated as not-onboarded", () => {
  assert.equal(parseStoredGoals(null), null);
  assert.equal(parseStoredGoals("not json{"), null);
  assert.equal(parseStoredGoals('"completed"'), null);
  assert.equal(parseStoredGoals(JSON.stringify({ version: 2, onboarding: "completed" })), null);
  assert.equal(parseStoredGoals(JSON.stringify({ version: 1, onboarding: "done" })), null);
  assert.equal(parseStoredGoals(JSON.stringify({ version: 1, onboarding: "completed" })), null);
  assert.equal(
    parseStoredGoals(JSON.stringify({ version: 1, onboarding: "completed", goals: [] })),
    null,
  );
});

test("parse: valid payload round-trips and unknown goal ids are dropped", () => {
  const parsed = parseStoredGoals(
    JSON.stringify({
      version: 1,
      onboarding: "skipped",
      goals: ["env", "bogus", "env"],
      environments: ["play", "bogus"],
    }),
  );
  assert.deepEqual(parsed, {
    version: 1,
    onboarding: "skipped",
    goals: ["env"],
    environments: ["play"],
  });
});

test("sanitize: unselecting env clears stale environment sub-goals", () => {
  // 勾选环境部署后又取消:旧子目标不得继续生效
  assert.deepEqual(sanitizeGoals(["guide"], ["play", "create"]), {
    goals: ["guide"],
    environments: [],
  });
  assert.deepEqual(sanitizeGoals(["env", "guide"], ["create"]), {
    goals: ["env", "guide"],
    environments: ["create"],
  });
});

test("serialize always writes a clean, parseable payload", () => {
  const raw = serializeGoals("completed", ["env", "guide"], ["play"]);
  assert.deepEqual(parseStoredGoals(raw), {
    version: 1,
    onboarding: "completed",
    goals: ["env", "guide"],
    environments: ["play"],
  });
  // 序列化前同样清洗:env 未选时 environments 落盘为空
  const cleared = serializeGoals("completed", ["guide"], ["play"]);
  assert.deepEqual(parseStoredGoals(cleared)?.environments, []);
});

test("goal gates require both the env goal and the specific environment", () => {
  assert.equal(goalEnabled(completedAll, "guide"), true);
  assert.equal(goalEnabled(completedAll, "tools"), false);
  assert.equal(goalEnabled(null, "env"), false);
  assert.equal(envGoalEnabled(completedAll, "play"), true);
  assert.equal(
    envGoalEnabled({ ...completedAll, environments: ["create"] }, "play"),
    false,
  );
  assert.equal(
    envGoalEnabled({ ...completedAll, goals: ["guide"] }, "play"),
    false,
  );
});

test("legacy page ids migrate to the v0.3.2 IA", () => {
  assert.equal(migratePageId("deployer-play"), "env-play");
  assert.equal(migratePageId("deployer-create"), "env-create");
  assert.equal(migratePageId("warehouse"), "warehouse");
});

test("entry: unfinished onboarding cannot be bypassed by a stored last page", () => {
  assert.deepEqual(resolveEntry(null, "warehouse"), {
    showOnboarding: true,
    page: "env-play",
  });
  // 损坏数据同样视为未完成,不能被 vua-last-page 绕过
  assert.equal(resolveEntry(parseStoredGoals("{"), "warehouse").showOnboarding, true);
});

test("entry: completed onboarding restores a valid last page, legacy ids migrated", () => {
  assert.deepEqual(resolveEntry(completedAll, "workshop"), {
    showOnboarding: false,
    page: "workshop",
  });
  assert.deepEqual(resolveEntry(completedAll, "deployer-create"), {
    showOnboarding: false,
    page: "env-create",
  });
  // 非法/未知历史页(含退役的 home 落点)回退默认落点——2026-09-25
  // 用户裁决:指挥台页退役,默认落点为环境部署
  assert.deepEqual(resolveEntry(completedAll, "nope"), {
    showOnboarding: false,
    page: "env-play",
  });
  assert.deepEqual(resolveEntry(completedAll, "home"), {
    showOnboarding: false,
    page: "env-play",
  });
  assert.deepEqual(resolveEntry(completedAll, null), {
    showOnboarding: false,
    page: "env-play",
  });
});
