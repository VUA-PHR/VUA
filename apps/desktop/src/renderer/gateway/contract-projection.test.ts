import { describe, expect, it } from "vitest";
import { APPLICATION_CONTRACT_VERSION, type TaskSnapshotV01 } from "@vua/contracts";
import { strings } from "../i18n/index.js";
import {
  projectEnvironmentSnapshot,
  projectTaskItem,
  projectTaskState,
} from "./contract-projection.js";

function task(overrides: Partial<TaskSnapshotV01> = {}): TaskSnapshotV01 {
  return {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    taskId: "task-1",
    revision: 3,
    correlationId: "correlation-1",
    state: "running",
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-04T00:00:00.000Z",
    ...overrides,
  };
}

describe("contract task state projection", () => {
  it("maps every v0.1 task state to the presentation nine states", () => {
    expect(projectTaskState("queued")).toBe("queued");
    expect(projectTaskState("preparing")).toBe("preparing");
    expect(projectTaskState("running")).toBe("running");
    expect(projectTaskState("waiting_for_input")).toBe("waitingInput");
    expect(projectTaskState("paused")).toBe("paused");
    expect(projectTaskState("succeeded")).toBe("completed");
    expect(projectTaskState("succeeded_with_warnings")).toBe("completedWithWarnings");
    expect(projectTaskState("failed")).toBe("failed");
    expect(projectTaskState("cancelled")).toBe("cancelled");
  });

  it("labels demo tasks and keeps other task ids honest", () => {
    expect(projectTaskItem(task({ taskId: "demo-1" })).title).toBe(strings.taskCenter.demoTaskTitle);
    expect(projectTaskItem(task({ taskId: "inspect-42" })).title).toBe("inspect-42");
  });

  it("derives cancellability from application facts only", () => {
    expect(projectTaskItem(task()).cancellable).toBe(true);
    expect(projectTaskItem(task({ cancellationRequested: true })).cancellable).toBe(false);
    expect(projectTaskItem(task({ state: "cancelled" })).cancellable).toBe(false);
    expect(projectTaskItem(task({ state: "succeeded" })).cancellable).toBe(false);
  });

  it("marks restart-leftover tasks as inspect_required, never as running", () => {
    const leftover = task({
      state: "running",
      recoveryDisposition: "inspect_required",
    });
    const item = projectTaskItem(leftover);
    expect(item.status).toBe("running");
    expect(item.errorText).toBe("inspect_required");
    expect(item.cancellable).toBe(true);
  });

  it("carries the contract error code as the engineering error text", () => {
    const failed = task({
      state: "failed",
      error: {
        contractVersion: APPLICATION_CONTRACT_VERSION,
        code: "vua.demo.failed",
        category: "external_failure",
        messageKey: "errors.demo.failed",
        recoverable: true,
        retryable: false,
        correlationId: "correlation-1",
      },
    });
    expect(projectTaskItem(failed).errorText).toBe("vua.demo.failed");
    expect(projectTaskItem(task()).errorText).toBeUndefined();
  });
});

describe("contract environment snapshot projection", () => {
  const snapshot = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    revision: 7,
    capturedAt: "2026-09-04T01:00:00.000Z",
    items: [
      { checkId: "steam", zone: "play" as const, presence: "detected" as const, facts: {} },
      { checkId: "vr_runtime", zone: "play" as const, presence: "not_detected" as const, facts: {} },
      {
        checkId: "unity_editors",
        zone: "create" as const,
        presence: "detection_failed" as const,
        errorCode: "vua.env.probe_failed",
        facts: {},
      },
    ],
  };

  it("groups items per zone into results phases with the capture time", () => {
    const view = projectEnvironmentSnapshot(snapshot);
    expect(view.schemaVersion).toBe(1);
    const play = view.deployer.zones.play;
    const create = view.deployer.zones.create;
    if (play.kind !== "results" || create.kind !== "results") throw new Error("expected results phases");
    expect(play.checkedAt).toBe("2026-09-04T01:00:00.000Z");
    expect(play.items).toEqual([
      expect.objectContaining({ id: "steam", status: "ok" }),
      expect.objectContaining({ id: "vr_runtime", status: "warning" }),
    ]);
    expect(create.items).toEqual([expect.objectContaining({ id: "unity_editors", status: "error" })]);
  });

  it("applies the consumer-side presence severity default and keeps engineering facts in the description", () => {
    const view = projectEnvironmentSnapshot(snapshot);
    const play = view.deployer.zones.play;
    const create = view.deployer.zones.create;
    if (play.kind !== "results" || create.kind !== "results") throw new Error("expected results phases");
    const [steam, vrRuntime, unity] = [play.items[0], play.items[1], create.items[0]];
    expect(steam).toMatchObject({ description: "detected" });
    expect(vrRuntime).toMatchObject({ description: "not_detected" });
    expect(unity).toMatchObject({ description: "vua.env.probe_failed" });
  });

  it("projects known check ids to four-language card titles and passes unknown ids through", () => {
    // 已注册 id:标题走消费侧文案注册表(disk_space 双区同 id 同题)
    const view = projectEnvironmentSnapshot({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 1,
      capturedAt: "2026-09-12T01:00:00.000Z",
      items: [
        { checkId: "steam", zone: "play" as const, presence: "detected" as const, facts: {} },
        { checkId: "disk_space", zone: "play" as const, presence: "detected" as const, facts: {} },
        { checkId: "disk_space", zone: "create" as const, presence: "detected" as const, facts: {} },
        { checkId: "vcc", zone: "create" as const, presence: "detected" as const, facts: {} },
        { checkId: "unity_editors", zone: "create" as const, presence: "detected" as const, facts: {} },
      ],
    });
    const play = view.deployer.zones.play;
    const create = view.deployer.zones.create;
    if (play.kind !== "results" || create.kind !== "results") throw new Error("expected results phases");
    expect(play.items.map((item) => item.title)).toEqual([
      strings.deployer.checks.steam,
      strings.deployer.checks.diskSpace,
    ]);
    expect(create.items.map((item) => item.title)).toEqual([
      strings.deployer.checks.diskSpace,
      strings.deployer.checks.vcc,
      strings.deployer.checks.unityEditors,
    ]);
    // 未注册 id(引擎未来新增):标题如实透传 checkId,不猜测
    const unknown = projectEnvironmentSnapshot({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 1,
      capturedAt: "2026-09-12T01:00:00.000Z",
      items: [{ checkId: "future_check", zone: "play" as const, presence: "detected" as const, facts: {} }],
    });
    const unknownPlay = unknown.deployer.zones.play;
    if (unknownPlay.kind !== "results") throw new Error("expected a results phase");
    expect(unknownPlay.items[0]?.title).toBe("future_check");
  });

  it("keeps an empty zone as an honest empty result, not a ready verdict", () => {
    const view = projectEnvironmentSnapshot({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 1,
      capturedAt: "2026-09-04T01:00:00.000Z",
      items: [],
    });
    const play = view.deployer.zones.play;
    if (play.kind !== "results") throw new Error("expected a results phase");
    expect(play).toEqual({
      kind: "results",
      checkedAt: "2026-09-04T01:00:00.000Z",
      items: [],
    });
    expect(view.versions).toEqual({ play: [], create: [] });
  });
});
