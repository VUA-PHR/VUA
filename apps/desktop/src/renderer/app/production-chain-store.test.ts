import { describe, expect, it } from "vitest";
import {
  emptyProductionChain,
  productionChainExecuteAccepted,
  productionChainGate,
  productionChainRecipeSaved,
  productionChainResolveAccepted,
  type ProductionChainState,
} from "./production-chain-store.ts";

/**
 * 生产链共享状态纯函数语义(019 批 C,AC-05/AC-07/AC-13):
 * - 身份链:配方 ← 保存回执;任务 ← 受理回执;记录 ← 计划身份匹配;
 * - AC-05:草稿 dirty ⇒ stale-draft 闸门(旧授权警示与推进禁用);
 * - AC-07:任务身份入状态后不因后续转换丢失(切换 UI 保留);
 * - AC-13:执行受理携带计划身份,记录按身份匹配不跳固定示例。
 */

const acceptedResolve: ProductionChainState = {
  ...emptyProductionChain,
  recipe: { recipeId: "recipe-1", revision: 2 },
  resolve: { kind: "accepted", taskId: "task-r", correlationId: "corr-r" },
};

describe("production-chain-store", () => {
  it("空态:无配方身份,闸门为 no-recipe", () => {
    expect(emptyProductionChain.recipe).toBeNull();
    expect(productionChainGate(emptyProductionChain, false).kind).toBe("no-recipe");
  });

  it("保存回执把配方身份写入链(AC-13 身份链起点)", () => {
    const next = productionChainRecipeSaved(emptyProductionChain, "recipe-9", 3);
    expect(next.recipe).toEqual({ recipeId: "recipe-9", revision: 3 });
    expect(productionChainGate(next, false).kind).toBe("ready");
  });

  it("AC-05:草稿 dirty 即旧授权闸门,保存对齐后恢复 ready", () => {
    expect(productionChainGate(acceptedResolve, true).kind).toBe("stale-draft");
    expect(productionChainGate(acceptedResolve, false).kind).toBe("ready");
  });

  it("AC-07:解析受理任务身份在后续转换中保留(切换 UI 不丢)", () => {
    const executed = productionChainExecuteAccepted(
      acceptedResolve,
      "task-j",
      "corr-j",
      "plan-1",
    );
    expect(executed.resolve).toEqual({
      kind: "accepted",
      taskId: "task-r",
      correlationId: "corr-r",
    });
    expect(executed.execute).toEqual({
      kind: "accepted",
      taskId: "task-j",
      correlationId: "corr-j",
      planId: "plan-1",
    });
  });

  it("AC-13:装配受理携带计划身份;记录身份独立登记", () => {
    const executed = productionChainExecuteAccepted(
      acceptedResolve,
      "task-j",
      "corr-j",
      "plan-7",
    );
    // 记录匹配依据是执行计划身份,而非固定示例
    expect(executed.execute.kind === "accepted" && executed.execute.planId).toBe("plan-7");
  });

  it("纯函数不改变输入状态(不可变转换)", () => {
    const before = structuredClone(acceptedResolve);
    productionChainExecuteAccepted(acceptedResolve, "t", "c", "p");
    expect(acceptedResolve).toEqual(before);
  });
});
