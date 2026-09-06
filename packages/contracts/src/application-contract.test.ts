import { describe, expect, it } from "vitest";
import {
  APPLICATION_CONTRACT_VERSION,
  isApplicationRequestV01,
  isTerminalTaskStateV01,
} from "./application-contract.js";

describe("application contract v0.1", () => {
  it("accepts only the explicit B1 query and command shapes", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-1",
      correlationId: "correlation-1",
      kind: "query",
      method: "application.getSnapshot",
      params: {},
    })).toBe(true);

    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-2",
      correlationId: "correlation-2",
      commandId: "cancel-1",
      kind: "command",
      method: "task.requestCancellation",
      params: { taskId: "task-1", observedRevision: 8 },
    })).toBe(true);
  });

  it("rejects unknown versions, methods, extra authority, and mixed kinds", () => {
    const base = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-1",
      correlationId: "correlation-1",
      kind: "query",
      method: "task.get",
      params: { taskId: "task-1" },
    };
    expect(isApplicationRequestV01({ ...base, contractVersion: "1.0" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, method: "shell.execute" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, executable: "powershell.exe" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, kind: "command", commandId: "command-1" })).toBe(false);
  });

  it("accepts the F2 environment snapshot query and demo task command", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-3",
      correlationId: "correlation-3",
      kind: "query",
      method: "environment.getSnapshot",
      params: {},
    })).toBe(true);

    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-4",
      correlationId: "correlation-4",
      commandId: "demo-1",
      kind: "command",
      method: "task.startDemo",
      params: {},
    })).toBe(true);
  });

  it("rejects F2 shapes with wrong kind, extra params, or bad identifiers", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-5",
      correlationId: "correlation-5",
      kind: "command",
      method: "environment.getSnapshot",
      params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-6",
      correlationId: "correlation-6",
      kind: "query",
      method: "environment.getSnapshot",
      params: { zone: "play" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-7",
      correlationId: "correlation-7",
      commandId: "",
      kind: "command",
      method: "task.startDemo",
      params: {},
    })).toBe(false);
  });

  it("treats only the four committed outcomes as terminal", () => {
    expect(isTerminalTaskStateV01("running")).toBe(false);
    expect(isTerminalTaskStateV01("waiting_for_input")).toBe(false);
    expect(isTerminalTaskStateV01("succeeded")).toBe(true);
    expect(isTerminalTaskStateV01("succeeded_with_warnings")).toBe(true);
    expect(isTerminalTaskStateV01("failed")).toBe(true);
    expect(isTerminalTaskStateV01("cancelled")).toBe(true);
  });
});

describe("bdl-queries v0.2 application surface", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-bdl",
    correlationId: "correlation-bdl",
    kind: "query",
  } as const;

  it("accepts the five read-only BDL queries within their closed sets", () => {
    expect(isApplicationRequestV01({ ...base, method: "catalog.list", params: {} })).toBe(true);
    expect(isApplicationRequestV01({
      ...base,
      method: "catalog.list",
      params: { text: "uniform", availabilityStatus: "unknown", limit: 100, offset: 50 },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.detail", params: { productId: "booth:1000001" },
    })).toBe(true);
    expect(isApplicationRequestV01({ ...base, method: "catalog.status", params: {} })).toBe(true);
    expect(isApplicationRequestV01({ ...base, method: "warehouse.listEntries", params: {} })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.entryDetail", params: { warehouseItemId: "wh-entry-1" },
    })).toBe(true);
  });

  it("rejects entity filters, raw-word filters, and malformed identities", () => {
    expect(isApplicationRequestV01({
      ...base, method: "catalog.list", params: { entityType: "avatar" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.list", params: { availabilityStatus: "InStock" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.list", params: { limit: 201 },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "catalog.detail", params: { productId: "booth:abc" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.entryDetail", params: { warehouseItemId: "" },
    })).toBe(false);
  });
});

describe("amf-production v0.2 application surface", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-prod",
    correlationId: "correlation-prod",
  } as const;

  const validQuad = {
    sourceFolder: "C:/materials/source",
    projectRoot: "C:/projects/target",
    artifactOutputRoot: "C:/artifacts",
    projectId: "project",
  };

  const command = (method: string, commandId: string, params: Record<string, unknown>) =>
    isApplicationRequestV01({
      ...base,
      kind: "command",
      method,
      commandId,
      params,
    } as unknown);

  const query = (method: string, params: Record<string, unknown>) =>
    isApplicationRequestV01({
      ...base,
      kind: "query",
      method,
      params,
    } as unknown);

  it("accepts the seven v0.2 shapes with domain ids and closed vocabularies", () => {
    expect(command("production.startInspection", "command-1", validQuad)).toBe(true);
    expect(query("production.getInspection", { inspectionId: "insp-0123456789abcdef" })).toBe(true);
    expect(command("production.requestPlan", "command-2", {
      inspectionId: "insp-0123456789abcdef", mode: "direct_unity_package",
    })).toBe(true);
    expect(command("production.requestPlan", "command-3", {
      inspectionId: "insp-0123456789abcdef", mode: "local_reusable_vpm",
    })).toBe(true);
    expect(query("production.getPlan", { planId: "plan-0123456789abcdef" })).toBe(true);
    expect(command("production.confirmPlan", "command-4", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "snapshot_and_continue",
    })).toBe(true);
    expect(command("production.confirmPlan", "command-5", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "continue",
      rememberForSession: true,
    })).toBe(true);
    expect(command("production.recover", "command-6", {
      taskId: "task-1", decision: "rollback", decisionId: "udid-1",
    })).toBe(true);
    expect(command("production.recover", "command-7", {
      taskId: "task-1", decision: "continue", decisionId: "udid-2", planId: "plan-0123456789abcdef",
    })).toBe(true);
    expect(query("production.getBuildRecord", { buildRecordId: "record-plan-0123456789abcdef" })).toBe(true);
  });

  it("rejects closed-set violations: vocabulary, id patterns, and missing required params", () => {
    // 四元组缺参 / 空值(start-inspection.missing-params 向量的守卫侧镜像)
    expect(command("production.startInspection", "command-1", {
      sourceFolder: "C:/m",
    })).toBe(false);
    expect(command("production.startInspection", "command-2", {
      sourceFolder: "", projectRoot: "p", artifactOutputRoot: "a", projectId: "x",
    })).toBe(false);
    // 域身份模式(insp-/plan- 前缀 + 16 位小写十六进制)
    expect(query("production.getInspection", { inspectionId: "task-1" })).toBe(false);
    expect(query("production.getPlan", { planId: "plan-00000000000000000" })).toBe(false);
    // mode 词表闭集
    expect(command("production.requestPlan", "command-3", {
      inspectionId: "insp-0123456789abcdef", mode: "mystery_mode",
    })).toBe(false);
    // riskChoice 必填且在四枚举内;rememberForSession 词表外拒绝
    expect(command("production.confirmPlan", "command-4", {
      planId: "plan-0123456789abcdef", observedRevision: 2,
    })).toBe(false);
    expect(command("production.confirmPlan", "command-5", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "snapshot_first",
    })).toBe(false);
    expect(command("production.confirmPlan", "command-6", {
      planId: "plan-0123456789abcdef", observedRevision: 2, riskChoice: "continue",
      rememberForSession: "yes",
    })).toBe(false);
    expect(command("production.confirmPlan", "command-7", {
      planId: "plan-0123456789abcdef", observedRevision: 0, riskChoice: "continue",
    })).toBe(false);
    // recover:decisionId 必填;decision 词表闭集
    expect(command("production.recover", "command-8", {
      taskId: "task-1", decision: "rollback",
    })).toBe(false);
    expect(command("production.recover", "command-9", {
      taskId: "task-1", decision: "restart", decisionId: "udid-1",
    })).toBe(false);
  });
});
