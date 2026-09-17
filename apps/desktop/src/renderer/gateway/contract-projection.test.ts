import { describe, expect, it } from "vitest";
import { APPLICATION_CONTRACT_VERSION, type EnvironmentCheckItemV01, type TaskSnapshotV01 } from "@vua/contracts";
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

  it("applies the consumer-side presence severity default and localizes presence words in the description", () => {
    const view = projectEnvironmentSnapshot(snapshot);
    const play = view.deployer.zones.play;
    const create = view.deployer.zones.create;
    if (play.kind !== "results" || create.kind !== "results") throw new Error("expected results phases");
    const [steam, vrRuntime, unity] = [play.items[0], play.items[1], create.items[0]];
    // #31 修复:presence 三词投影为四语状态词;error_code(仅
    // detection_failed 携带)保留工程事实码原词
    expect(steam).toMatchObject({ description: strings.deployer.presence.detected });
    expect(vrRuntime).toMatchObject({ description: strings.deployer.presence.notDetected });
    expect(unity).toMatchObject({ description: "vua.env.probe_failed" });
  });

  it("projects the full engine check-id closed set to localized card titles", () => {
    // #31 修复:引擎 inspect_zone 当前 id 闭集(play 13 项＋create 4 独有 id)
    // 全部注册,不再透传原词
    const engineIds = [
      "steam",
      "vrchat",
      "steamvr",
      "openxr_runtime",
      "oculus_runtime",
      "pico_runtime",
      "vive_runtime",
      "virtual_desktop",
      "alvr",
      "gpu",
      "network",
      "windows",
      "disk_space",
      "unity_hub",
      "unity_editors",
      "vpm_cli",
      "vcc",
    ] as const;
    const view = projectEnvironmentSnapshot({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 1,
      capturedAt: "2026-09-16T01:00:00.000Z",
      items: engineIds.map((checkId) => ({
        checkId,
        zone: "play" as const,
        presence: "detected" as const,
        facts: {},
      })),
    });
    const play = view.deployer.zones.play;
    if (play.kind !== "results") throw new Error("expected a results phase");
    const checks = strings.deployer.checks as unknown as Readonly<Record<string, string>>;
    const keyOf: Readonly<Record<string, string>> = {
      steam: "steam",
      vrchat: "vrchat",
      steamvr: "steamvr",
      openxr_runtime: "openxrRuntime",
      oculus_runtime: "oculusRuntime",
      pico_runtime: "picoRuntime",
      vive_runtime: "viveRuntime",
      virtual_desktop: "virtualDesktop",
      alvr: "alvr",
      gpu: "gpu",
      network: "network",
      windows: "windows",
      disk_space: "diskSpace",
      unity_hub: "unityHub",
      unity_editors: "unityEditors",
      vpm_cli: "vpmCli",
      vcc: "vcc",
    };
    for (const [index, checkId] of engineIds.entries()) {
      const item = play.items[index];
      const key = keyOf[checkId];
      if (key === undefined) throw new Error(`missing title key for ${checkId}`);
      expect(item?.title).toBe(checks[key]);
      expect(item?.title).not.toBe(checkId);
    }
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

/* ---- live wire 形状钉死(BOARD #36 缺陷③,#22 教训:live 形状用例必
 * 含,mock 绿不算数)----
 * provider-host environment_get_snapshot 的 items 为引擎 serde 逐条输出
 * (操作者 CDP 键集实证 2026-09-17:schemaVersion+checkId+zone+presence+
 * errorCode+facts);errorCode 在 presence ≠ detection_failed 时序列化为
 * null(serde Option 无 skip),投影以 nullish 合并消化为状态词。
 * #31 卡片标题空的机理即此链:wire 曾走 `id` 键,投影读 checkId 得
 * undefined → checkTitle 透传 undefined → h2 空。核心裁决 wire=checkId
 * (引擎侧 serde rename 已修,wt-2 c9d3d83),本组用例把消费面钉死在
 * 冻结 TS 面词上,并拒绝向偏差键回摆。 ---- */
describe("environment check item live wire shape (BOARD #36 defect 3)", () => {
  /** provider-host 真实逐条 wire 形状(键闭集照 CDP 实证) */
  const liveItem = (overrides: Record<string, unknown> = {}) =>
    ({
      schemaVersion: 1,
      checkId: "steam",
      zone: "play",
      presence: "detected",
      errorCode: null,
      facts: {},
      ...overrides,
    }) as unknown as EnvironmentCheckItemV01;

  const projectLive = (items: readonly EnvironmentCheckItemV01[]) =>
    projectEnvironmentSnapshot({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      revision: 1,
      capturedAt: "2026-09-18T02:00:00.000Z",
      items,
    });

  it("projects the provider-host live item shape: title keys on checkId with localized copy", () => {
    const view = projectLive([
      liveItem(),
      liveItem({
        checkId: "unity_editors",
        zone: "create",
        presence: "detection_failed",
        errorCode: "vua.env.probe_failed",
      }),
    ]);
    const play = view.deployer.zones.play;
    const create = view.deployer.zones.create;
    if (play.kind !== "results" || create.kind !== "results") throw new Error("expected results phases");
    // #31 验收点:标题来自词表(checkId 取键),不再是空串/undefined
    expect(play.items[0]).toMatchObject({
      id: "steam",
      title: strings.deployer.checks.steam,
      status: "ok",
      description: strings.deployer.presence.detected,
    });
    // errorCode: null(live 语义)消化为状态词;detection_failed 携带工程事实码原词
    expect(create.items[0]).toMatchObject({
      id: "unity_editors",
      title: strings.deployer.checks.unityEditors,
      status: "error",
      description: "vua.env.probe_failed",
    });
  });

  it("keeps the per-item schemaVersion wire key declarable and unconsumed by the projection", () => {
    // TS 面已补可选声明(BOARD #36 第二分歧自决 2026-09-18):live 逐条
    // schemaVersion 键在类型面可表达;投影不消费(加性无害,核心账本)。
    const item: EnvironmentCheckItemV01 = liveItem();
    expect(item.schemaVersion).toBe(1);
  });

  it("refuses the pre-fix deviant `id` key: no fallback, no guessed title", () => {
    // 引擎修正前偏差形状(操作者 CDP 实证):wire 走 id、无 checkId。
    // 消费面不兼容偏差键——title 透传 undefined(诚实空,不猜测、不伪造);
    // 若日后有人加 `id ?? checkId` 回摆兼容,本用例失败。
    const view = projectLive([
      { id: "steam", zone: "play", presence: "detected", errorCode: null, facts: {} } as unknown as EnvironmentCheckItemV01,
    ]);
    const play = view.deployer.zones.play;
    if (play.kind !== "results") throw new Error("expected a results phase");
    expect(play.items[0]?.title).toBeUndefined();
    expect(play.items[0]?.id).toBeUndefined();
  });
});
