/**
 * release.openForHandoff 呈现模型测试(023 消费切片):
 * - projectHandoffTask:九态投影/事实守卫/错误负载透传/词表外原样;
 * - 诚实纪律钉死:succeeded 携带词表外上传状态字段的事实 → fact-unexplainable
 *  (不猜测不裁剪呈现);快照形状不符 → null(保持上一视图);
 * - taskStateLabelKey / isReleaseHandoffErrorCode:闭集对表,词表外 null/原样;
 * - U19 交棒准入:handoffAdmission 六态闭集×显式期望表(新增态缺键即编译错
 *  ＋测试败,防回摆)＋缺失/词表外 → unconfirmed;handoffIntentErrorText
 *  准入闸两码词面组合＋{state} 插值四表对拍＋闭集外原样透传。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
  projectHandoffTask,
  isReleaseHandoffErrorCode,
  taskStateLabelKey,
  handoffAdmission,
  handoffIntentErrorText,
  RELEASE_HANDOFF_RECORD_STATE_BLOCKED,
  RELEASE_HANDOFF_RECORD_STATE_UNKNOWN,
} from "./release-handoff-model.ts";
import { BUILD_RECORD_STATUSES_V03, type BuildRecordStatusV03 } from "./release-records-model.ts";
import { format } from "../../i18n/format.ts";
import { strings as en } from "../../i18n/strings.en.ts";
import { strings as zhCN } from "../../i18n/strings.zh-CN.ts";
import { strings as ja } from "../../i18n/strings.ja.ts";
import { strings as ko } from "../../i18n/strings.ko.ts";

const FACT = {
  schemaVersion: "0.1",
  buildId: "build-1",
  projectId: "proj-1",
  editor: { exePath: "C:/Unity/Unity.exe", version: "2022.3.22f1" },
  occurredAt: "2026-09-16T03:30:00Z",
};

function snapshot(state: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    contractVersion: "0.1",
    taskId: "task-1",
    revision: 1,
    correlationId: "corr-1",
    state,
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-16T03:30:00Z",
    ...extra,
  };
}

describe("projectHandoffTask", () => {
  test("非终态九态原词 → running 视图原样透传", () => {
    for (const state of ["queued", "preparing", "running", "waiting_for_input", "paused"]) {
      assert.deepEqual(projectHandoffTask(snapshot(state)), { kind: "running", state });
    }
  });

  test("{ contractVersion, task } 包装形态 → 拆包投影", () => {
    const wrapped = { contractVersion: "0.1", task: snapshot("running") };
    assert.deepEqual(projectHandoffTask(wrapped), { kind: "running", state: "running" });
  });

  test("succeeded 携可解释交接事实 → succeeded 视图(事实透传)", () => {
    assert.deepEqual(projectHandoffTask(snapshot("succeeded", { result: FACT })), {
      kind: "succeeded",
      fact: FACT,
    });
  });

  test("succeeded_with_warnings 携事实 → succeeded 视图", () => {
    assert.deepEqual(projectHandoffTask(snapshot("succeeded_with_warnings", { result: FACT })), {
      kind: "succeeded",
      fact: FACT,
    });
  });

  test("事实携带词表外上传状态字段(诚实纪律负例) → fact-unexplainable", () => {
    const polluted = { ...FACT, uploadState: "done" };
    assert.deepEqual(projectHandoffTask(snapshot("succeeded", { result: polluted })), {
      kind: "fact-unexplainable",
    });
  });

  test("succeeded 但事实缺失 → fact-unexplainable(不合成事实)", () => {
    assert.deepEqual(projectHandoffTask(snapshot("succeeded")), { kind: "fact-unexplainable" });
  });

  test("failed 快照 → failed 视图携错误码/messageKey;错误缺席 → null 字段", () => {
    assert.deepEqual(
      projectHandoffTask(
        snapshot("failed", {
          error: {
            contractVersion: "0.1",
            code: "vua.task.handshake_timeout",
            category: "timeout",
            messageKey: "errors.task.handshakeTimeout",
            recoverable: true,
            retryable: true,
            correlationId: "c",
          },
        }),
      ),
      {
        kind: "failed",
        state: "failed",
        errorCode: "vua.task.handshake_timeout",
        messageKey: "errors.task.handshakeTimeout",
      },
    );
    assert.deepEqual(projectHandoffTask(snapshot("failed")), {
      kind: "failed",
      state: "failed",
      errorCode: null,
      messageKey: null,
    });
  });

  test("cancelled → cancelled 视图", () => {
    assert.deepEqual(projectHandoffTask(snapshot("cancelled")), { kind: "cancelled" });
  });

  test("快照形状不符(state 缺失/非对象) → null(保持上一视图)", () => {
    assert.equal(projectHandoffTask(null), null);
    assert.equal(projectHandoffTask("nope"), null);
    assert.equal(projectHandoffTask({ contractVersion: "0.1" }), null);
    assert.equal(projectHandoffTask({ task: { taskId: "t" } }), null);
  });
});

describe("taskStateLabelKey", () => {
  test("九态原词 → taskStatus 文案键(与 contract-projection 同表)", () => {
    assert.equal(taskStateLabelKey("queued"), "queued");
    assert.equal(taskStateLabelKey("waiting_for_input"), "waitingInput");
    assert.equal(taskStateLabelKey("succeeded"), "completed");
    assert.equal(taskStateLabelKey("succeeded_with_warnings"), "completedWithWarnings");
  });

  test("词表外原词 → null(UI 原样呈现,不猜测)", () => {
    assert.equal(taskStateLabelKey("out_of_vocabulary"), null);
  });
});

describe("isReleaseHandoffErrorCode", () => {
  test("闭集四码判真;词表外判假(原样透传呈现)", () => {
    assert.equal(isReleaseHandoffErrorCode("vua.release_handoff.unavailable"), true);
    assert.equal(isReleaseHandoffErrorCode("vua.release_handoff.invalid_params"), true);
    assert.equal(isReleaseHandoffErrorCode("vua.release_handoff.build_unknown"), true);
    assert.equal(isReleaseHandoffErrorCode("vua.release_handoff.editor_unresolved"), true);
    assert.equal(isReleaseHandoffErrorCode("vua.release_handoff.upload_done"), false);
    assert.equal(isReleaseHandoffErrorCode("something.else"), false);
  });
});

/** U19 准入期望闭集(显式表:六态每态一行;contracts 六态扩员→本表缺键
 *  即编译错,遍历 BUILD_RECORD_STATUSES_V03 断言全键→缺期望即测试败) */
const ADMISSION_EXPECTATIONS: Record<BuildRecordStatusV03, ReturnType<typeof handoffAdmission>> = {
  succeeded: { kind: "allowed", warnings: false },
  succeeded_with_warnings: { kind: "allowed", warnings: true },
  failed: { kind: "blocked", state: "failed" },
  cancelled: { kind: "blocked", state: "cancelled" },
  rolled_back: { kind: "blocked", state: "rolled_back" },
  recovered: { kind: "blocked-recovered" },
};

describe("handoffAdmission(U19 交棒准入呈现投影)", () => {
  test("六态闭集×显式期望表(全部记录状态枚举 → 期望 UI 结果闭集)", () => {
    for (const status of BUILD_RECORD_STATUSES_V03) {
      assert.deepEqual(
        handoffAdmission(status),
        ADMISSION_EXPECTATIONS[status],
        `状态 ${status} 的准入呈现偏离期望表`,
      );
    }
  });

  test("闭集基数=6(防静默增删;增删必须同步 contracts 与期望表)", () => {
    assert.equal(BUILD_RECORD_STATUSES_V03.length, 6);
  });

  test("null(记录缺失/读取失败) → unconfirmed 拒绝桶", () => {
    assert.deepEqual(handoffAdmission(null), { kind: "unconfirmed" });
  });

  test("词表外状态原词 → unconfirmed(不猜测,诚实纪律 1)", () => {
    assert.deepEqual(handoffAdmission("out_of_vocabulary"), { kind: "unconfirmed" });
    assert.deepEqual(handoffAdmission(""), { kind: "unconfirmed" });
  });
});

describe("handoffIntentErrorText(U19 准入闸词面组合)", () => {
  const FACES = {
    failedUnknown: en.release.records.handoff.failedUnknown,
    failedWithCode: en.release.records.handoff.failedWithCode,
    codeInvalidParams: en.release.records.handoff.codeInvalidParams,
    codeBuildUnknown: en.release.records.handoff.codeBuildUnknown,
    codeEditorUnresolved: en.release.records.handoff.codeEditorUnresolved,
    stateBlocked: en.errors.releaseHandoff.stateBlocked,
    stateUnknown: en.errors.releaseHandoff.stateUnknown,
  };

  test("record_state_unknown → 记录无法确认词面(无插值)", () => {
    assert.equal(
      handoffIntentErrorText(RELEASE_HANDOFF_RECORD_STATE_UNKNOWN, {}, FACES),
      FACES.stateUnknown,
    );
  });

  test("record_state_blocked 携 state → {state} 插值词面", () => {
    assert.equal(
      handoffIntentErrorText(
        RELEASE_HANDOFF_RECORD_STATE_BLOCKED,
        { state: "failed" },
        FACES,
      ),
      format(FACES.stateBlocked, { state: "failed" }),
    );
    assert.equal(
      handoffIntentErrorText(
        RELEASE_HANDOFF_RECORD_STATE_BLOCKED,
        { state: "rolled_back" },
        FACES,
      ),
      format(FACES.stateBlocked, { state: "rolled_back" }),
    );
  });

  test("record_state_blocked 缺 state → 退回原码词面(不输出半句)", () => {
    assert.equal(
      handoffIntentErrorText(RELEASE_HANDOFF_RECORD_STATE_BLOCKED, {}, FACES),
      format(FACES.failedWithCode, { code: RELEASE_HANDOFF_RECORD_STATE_BLOCKED }),
    );
    assert.equal(
      handoffIntentErrorText(RELEASE_HANDOFF_RECORD_STATE_BLOCKED, { state: 42 }, FACES),
      format(FACES.failedWithCode, { code: RELEASE_HANDOFF_RECORD_STATE_BLOCKED }),
    );
  });

  test("既有闭集三码词面映射不回摆;null → failedUnknown;闭集外原样透传", () => {
    assert.equal(
      handoffIntentErrorText("vua.release_handoff.invalid_params", {}, FACES),
      FACES.codeInvalidParams,
    );
    assert.equal(
      handoffIntentErrorText("vua.release_handoff.build_unknown", {}, FACES),
      FACES.codeBuildUnknown,
    );
    assert.equal(
      handoffIntentErrorText("vua.release_handoff.editor_unresolved", {}, FACES),
      FACES.codeEditorUnresolved,
    );
    assert.equal(handoffIntentErrorText(null, {}, FACES), FACES.failedUnknown);
    assert.equal(
      handoffIntentErrorText("vua.release_handoff.upload_done", {}, FACES),
      format(FACES.failedWithCode, { code: "vua.release_handoff.upload_done" }),
    );
  });

  test("{state} 插值四表对拍:占位符同集,插值组合无残留占位符", () => {
    const tables = [
      ["en", en] as const,
      ["zh-CN", zhCN] as const,
      ["ja", ja] as const,
      ["ko", ko] as const,
    ];
    for (const [name, table] of tables) {
      const face = table.errors.releaseHandoff.stateBlocked;
      const composed = format(face, { state: "failed" });
      assert.ok(!composed.includes("{state}"), `${name} stateBlocked 插值残留占位符`);
      assert.ok(composed.includes("failed"), `${name} stateBlocked 未含 state 原词`);
      // stateUnknown 无插值:四表原样无占位符
      assert.ok(
        !table.errors.releaseHandoff.stateUnknown.includes("{"),
        `${name} stateUnknown 不应携带占位符`,
      );
    }
  });
});
