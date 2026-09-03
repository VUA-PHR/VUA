import assert from "node:assert/strict";
import { test } from "vitest";
import { taskStatuses } from "../app/task-status.ts";
import { taskStatusForWorkflow, workflowRunStates } from "./workflow.ts";

test("工作流投影覆盖全部状态且均落在任务九态内", () => {
  for (const state of workflowRunStates) {
    const projected = taskStatusForWorkflow(state);
    assert.ok(
      (taskStatuses as readonly string[]).includes(projected),
      `${state} 投影结果 ${projected} 不在任务九态内`,
    );
  }
});

test("关键语义映射:待确认→等待输入,执行期→运行中", () => {
  assert.equal(taskStatusForWorkflow("await_confirmation"), "waitingInput");
  assert.equal(taskStatusForWorkflow("inspect"), "preparing");
  assert.equal(taskStatusForWorkflow("plan"), "preparing");
  assert.equal(taskStatusForWorkflow("execute"), "running");
  assert.equal(taskStatusForWorkflow("validate"), "running");
  assert.equal(taskStatusForWorkflow("completed"), "completed");
});

test("失败与过期可区分:recover 是进行中,expired 不是 failed", () => {
  // 回滚是进行中的恢复动作,不是失败终态
  assert.equal(taskStatusForWorkflow("recover"), "running");
  assert.equal(taskStatusForWorkflow("failed"), "failed");
  assert.equal(taskStatusForWorkflow("failed_recoverable"), "failed");
  // 确认失效、从未执行:投影为已取消而非失败,前端可区分"失败"与"从未执行"
  assert.equal(taskStatusForWorkflow("expired"), "cancelled");
});
