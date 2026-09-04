import assert from "node:assert/strict";
import { test } from "vitest";
import { neverChecked, type DeployerView } from "../deployer/deployer-model.ts";
import { buildDiagnostics } from "./diagnostics.ts";

const checkedView: DeployerView = {
  zones: {
    play: {
      kind: "results",
      checkedAt: "2026-08-27T10:00:00+08:00",
      items: [
        {
          id: "vrchat",
          zone: "play",
          title: "VRChat 本体",
          status: "ok",
          description: "路径 C:/Users/secret 不应出现在诊断包",
        },
      ],
    },
    create: { kind: "not-run" },
  },
};

test("诊断包脱敏:不含描述文本,只投影 id/status/时间戳", () => {
  const bundle = buildDiagnostics({
    dataSource: "fixture",
    goals: null,
    deployer: checkedView,
    now: new Date("2026-08-27T02:00:00Z"),
  });
  const json = JSON.stringify(bundle);
  assert.equal(json.includes("路径"), false);
  assert.equal(json.includes("C:/Users"), false);
  assert.deepEqual(bundle.environment.play, {
    phase: "results",
    checkedAt: "2026-08-27T10:00:00+08:00",
    items: [{ id: "vrchat", status: "ok" }],
  });
  assert.deepEqual(bundle.environment.create, { phase: "not-run" });
  assert.equal(bundle.schemaVersion, 1);
  assert.equal(bundle.exportedAt, "2026-08-27T02:00:00.000Z");
});

test("诊断包:running/failed 相位携带旧证据,not-run 无证据", () => {
  const runningView: DeployerView = {
    zones: {
      play: { kind: "running", startedAt: "2026-08-27T10:01:00+08:00", last: null },
      create: neverChecked().zones.create,
    },
  };
  const bundle = buildDiagnostics({
    dataSource: "none",
    goals: { version: 1, onboarding: "completed", goals: ["env"], environments: ["play"] },
    deployer: runningView,
  });
  assert.deepEqual(bundle.environment.play, { phase: "running" });
  assert.deepEqual(bundle.goals, {
    version: 1,
    onboarding: "completed",
    goals: ["env"],
    environments: ["play"],
  });
});
