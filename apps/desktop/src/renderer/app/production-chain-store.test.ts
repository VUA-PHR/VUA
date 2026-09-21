import { describe, expect, it } from "vitest";
import {
  emptyProductionChain,
  productionChainExecuteAccepted,
  productionChainGate,
  productionChainRecipeSaved,
  productionChainRecipeSelected,
  productionChainResolveAccepted,
  type ProductionChainState,
} from "./production-chain-store.ts";

/**
 * 生产链共享状态纯函数语义(019 批 C,AC-05/AC-07/AC-13;029 A4 增补):
 * - 身份链:配方 ← 保存回执或选择回执(recipe.get 回执文档身份,选择事实源
 *   动作);任务 ← 受理回执;记录 ← 计划身份匹配;
 * - AC-05:搭配草稿在场且 dirty ⇒ stale-draft 闸门(旧授权警示与推进禁用);
 *   草稿不在场 ⇒ ready(029 A4 判决:stale-draft 仅草稿在场且 dirty 成立);
 * - AC-07:任务身份入状态后不因后续转换丢失(切换 UI 保留);
 * - AC-13:执行受理携带计划身份,记录按身份匹配不跳固定示例;
 * - 选择语义(029 A4):文档身份不同 = 新链(旧链任务/记录身份让位),
 *   相同 = 幂等不打断在途链。
 */

const acceptedResolve: ProductionChainState = {
  ...emptyProductionChain,
  recipe: { recipeId: "recipe-1", revision: 2 },
  resolve: { kind: "accepted", taskId: "task-r", correlationId: "corr-r" },
};

describe("production-chain-store", () => {
  it("空态:无配方身份,闸门为 no-recipe", () => {
    expect(emptyProductionChain.recipe).toBeNull();
    expect(productionChainGate(emptyProductionChain, { present: false, dirty: false }).kind).toBe(
      "no-recipe",
    );
  });

  it("保存回执把配方身份写入链(AC-13 身份链起点)", () => {
    const next = productionChainRecipeSaved(emptyProductionChain, "recipe-9", 3);
    expect(next.recipe).toEqual({ recipeId: "recipe-9", revision: 3 });
    expect(productionChainGate(next, { present: false, dirty: false }).kind).toBe("ready");
  });

  it("AC-05:草稿在场且 dirty 即旧授权闸门,保存对齐后恢复 ready", () => {
    expect(productionChainGate(acceptedResolve, { present: true, dirty: true }).kind).toBe(
      "stale-draft",
    );
    expect(productionChainGate(acceptedResolve, { present: true, dirty: false }).kind).toBe(
      "ready",
    );
  });

  it("AC-05(029 A4):草稿不在场时 stale-draft 不成立——选择驱动链即 ready", () => {
    // dirty 但无条目(如已保存后撤销回空):无「待保存内容」,「请先保存」
    // 警示不成立,链照常 ready
    expect(productionChainGate(acceptedResolve, { present: false, dirty: true }).kind).toBe(
      "ready",
    );
    expect(productionChainGate(acceptedResolve, { present: false, dirty: false }).kind).toBe(
      "ready",
    );
  });

  it("029 A4:选择事实源——回执文档身份入链即 ready(无草稿在场)", () => {
    const selected = productionChainRecipeSelected(emptyProductionChain, "recipe-7", 1);
    expect(selected.recipe).toEqual({ recipeId: "recipe-7", revision: 1 });
    expect(productionChainGate(selected, { present: false, dirty: false }).kind).toBe("ready");
    // 草稿在场且 dirty 仍然闸(AC-05 语义不破)
    expect(productionChainGate(selected, { present: true, dirty: true }).kind).toBe("stale-draft");
  });

  it("029 A4:选择不同文档身份 = 新链,旧链解析/执行受理与记录身份让位", () => {
    const withExecution = productionChainExecuteAccepted(
      acceptedResolve,
      "task-j",
      "corr-j",
      "plan-1",
    );
    const reselected = productionChainRecipeSelected(withExecution, "recipe-2", 5);
    expect(reselected.recipe).toEqual({ recipeId: "recipe-2", revision: 5 });
    expect(reselected.resolve).toEqual({ kind: "idle" });
    expect(reselected.execute).toEqual({ kind: "idle" });
    expect(reselected.buildId).toBeNull();
  });

  it("029 A4:选择相同文档身份 = 幂等,不打断在途链", () => {
    const reselected = productionChainRecipeSelected(acceptedResolve, "recipe-1", 2);
    expect(reselected).toBe(acceptedResolve);
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
    productionChainRecipeSelected(acceptedResolve, "other", 9);
    expect(acceptedResolve).toEqual(before);
  });
});
