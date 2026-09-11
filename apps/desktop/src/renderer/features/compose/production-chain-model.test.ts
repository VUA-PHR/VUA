import { describe, expect, it } from "vitest";
import type { PlanListEntryV02, RecordListEntryV02 } from "@vua/contracts";
import { chainRecordsForPlan, planRowsForDisplay } from "./production-chain-model.ts";

/** 生产链段呈现模型(019 批 C):身份匹配与呈现序 */
const plan = (planId: string, status: PlanListEntryV02["status"], approvedAt: string): PlanListEntryV02 => ({
  planId,
  recipeId: "recipe-1",
  status,
  approvedAt,
});

const record = (buildId: string, planId: string): RecordListEntryV02 => ({
  buildId,
  planId,
  status: "succeeded",
  finishedAt: "2026-09-12T00:00:00Z",
});

describe("chainRecordsForPlan", () => {
  it("AC-13:只保留本链执行计划身份的记录,不跳固定历史示例", () => {
    const rows = [record("b-1", "plan-A"), record("b-2", "plan-B"), record("b-3", "plan-A")];
    const mine = chainRecordsForPlan(rows, "plan-A");
    expect(mine.map((row) => row.buildId)).toEqual(["b-1", "b-3"]);
  });

  it("本链无记录 = 空数组(诚实空态,不回落历史)", () => {
    const rows = [record("b-1", "plan-B")];
    expect(chainRecordsForPlan(rows, "plan-A")).toEqual([]);
  });
});

describe("planRowsForDisplay", () => {
  it("批准时间降序呈现(draft 排后)", () => {
    const rows = [
      plan("p-old", "approved", "2026-09-10T00:00:00Z"),
      plan("p-new", "approved", "2026-09-12T00:00:00Z"),
      plan("p-draft", "draft", "2026-09-11T00:00:00Z"),
    ];
    expect(planRowsForDisplay(rows).map((row) => row.planId)).toEqual([
      "p-new",
      "p-draft",
      "p-old",
    ]);
  });

  it("不改输入数组(纯投影)", () => {
    const rows = [plan("p-a", "approved", "2026-09-10T00:00:00Z"), plan("p-b", "draft", "2026-09-11T00:00:00Z")];
    const before = structuredClone(rows);
    planRowsForDisplay(rows);
    expect(rows).toEqual(before);
  });
});
