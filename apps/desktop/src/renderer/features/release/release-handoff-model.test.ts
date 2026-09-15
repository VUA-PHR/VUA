/**
 * release.openForHandoff 呈现模型测试(023 消费切片):
 * - projectHandoffTask:九态投影/事实守卫/错误负载透传/词表外原样;
 * - 诚实纪律钉死:succeeded 携带词表外上传状态字段的事实 → fact-unexplainable
 *  (不猜测不裁剪呈现);快照形状不符 → null(保持上一视图);
 * - taskStateLabelKey / isReleaseHandoffErrorCode:闭集对表,词表外 null/原样。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { projectHandoffTask, isReleaseHandoffErrorCode, taskStateLabelKey } from "./release-handoff-model.ts";

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
