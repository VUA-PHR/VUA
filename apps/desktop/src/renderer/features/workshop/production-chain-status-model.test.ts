import { describe, expect, it } from "vitest";
import { taskStatuses, type TaskStatus } from "../../app/task-status.ts";
import { taskNeedsDecision } from "./production-chain-status-model.ts";

describe("车间执行状态面:任务决策派生(proposal 029 A6)", () => {
  it("waitingInput/paused/failed 需要用户处理(指路任务中心,不自建决策面)", () => {
    expect(taskNeedsDecision("waitingInput")).toBe(true);
    expect(taskNeedsDecision("paused")).toBe(true);
    expect(taskNeedsDecision("failed")).toBe(true);
  });

  it("终态与进行态不需要决策呈现(诚实空态,不渲染指路词)", () => {
    expect(taskNeedsDecision("queued")).toBe(false);
    expect(taskNeedsDecision("preparing")).toBe(false);
    expect(taskNeedsDecision("running")).toBe(false);
    expect(taskNeedsDecision("completed")).toBe(false);
    expect(taskNeedsDecision("completedWithWarnings")).toBe(false);
    expect(taskNeedsDecision("cancelled")).toBe(false);
  });

  it("九态全枚举必经判定(词表扩展时本钉逼出显式决策)", () => {
    const decided = new Set<string>();
    for (const status of taskStatuses as readonly TaskStatus[]) {
      if (taskNeedsDecision(status)) decided.add(status);
    }
    expect(decided.size).toBe(3);
    expect([...decided].sort()).toEqual(["failed", "paused", "waitingInput"]);
  });
});
