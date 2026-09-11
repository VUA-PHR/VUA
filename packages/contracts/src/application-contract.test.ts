import { describe, expect, it } from "vitest";
import {
  APPLICATION_CONTRACT_VERSION,
  isApplicationRequestV01,
  isTerminalTaskStateV01,
  type CatalogProductDetailV03,
  type TaskDonePayloadV01,
  type TaskSnapshotV01,
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

describe("bdl-queries v0.3 TS mirror", () => {
  // proposal 002:镜像面与 schemas/bdl-queries/v0.3 的 result 对齐——
  // ageRestriction 是 schema required 字段(登记缺陷回归锁):显式值与
  // null 两态的对象都必须携带该字段,镜像面缺字段在编译期即失败
  const detailBase = {
    productId: "booth:1000001",
    title: "Sample Product",
    price: { amount: "1500", currency: "JPY" },
    imageUrl: null,
    imageUrls: [],
    availabilityRaw: "unknown",
    availabilityStatus: "unknown",
    entityCount: 0 as const,
    entityTypes: [],
    description: null,
    shopName: "Sample Shop",
    shopUrl: "https://sample.booth.pm/",
    adult: false,
    videoUrls: [],
    sourceCategory: null,
    subproducts: [],
  };

  it("mirrors the ageRestriction explicit-value shape required by the v0.3 schema", () => {
    const adult: CatalogProductDetailV03 = { ...detailBase, ageRestriction: "R-18" };
    expect(adult.ageRestriction).toBe("R-18");
  });

  it("mirrors the ageRestriction null shape required by the v0.3 schema", () => {
    const general: CatalogProductDetailV03 = { ...detailBase, ageRestriction: null };
    expect(general.ageRestriction).toBe(null);
  });
});

describe("bdl-commands v0.1 application surface", () => {
  const base = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    requestId: "request-whcmd",
    correlationId: "correlation-whcmd",
    kind: "command",
  } as const;

  it("accepts the three warehouse write commands within their closed sets", () => {
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-1", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "generate_vpm" },
    })).toBe(true);
    // null = 清除条目级覆盖(回落「覆盖 ?? 全局默认」动态解析)
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-2", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: null },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-3", method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(true);
    // v0.3 词表可选字段:导入编排自动生成携带 importCorrelationId(010 承诺 6)
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-3a", method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1", importCorrelationId: "corr-import-1" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-4", method: "warehouse.deleteOriginals",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(true);
  });

  it("rejects mode vocabulary escapes, closed-set violations, and missing command ids", () => {
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-5", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "R-18" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-6", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: "" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-7", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-8", method: "warehouse.setArtifactMode",
      params: { warehouseItemId: "wh-entry-1", mode: null, extra: 1 },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.generateVpm",
      params: { warehouseItemId: "wh-entry-1" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-9", method: "warehouse.deleteOriginals",
      params: { warehouseItemId: "", mode: null },
    })).toBe(false);
  });

  it("admits the v0.4 download-adoption command with identity-only closed params", () => {
    // bdl-commands v0.4(IMP-3):只携带下载身份,非空数组
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-1", method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-01hexample0000000000000a", "dl-01hexample0000000000000b"] },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-2", method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-1"] },
    })).toBe(true);
  });

  it("admits the 013 three-query read face with closed params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.listProjects", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.inspectProject", params: { projectPath: "C:/proj" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.lockStatus", params: { projectPath: "C:/proj" },
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.inspectProject", params: {},
    })).toBe(false);
  });

  it("admits the 013 environmentManagers read query with empty params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.environmentManagers", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "project.environmentManagers",
      params: { projectId: "p-1" },
    })).toBe(false);
  });

  it("admits the bdl-queries v0.4 completed-downloads read query with empty params", () => {
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "downloads.listCompleted", params: {},
    })).toBe(true);
    expect(isApplicationRequestV01({
      ...base, kind: "query", method: "downloads.listCompleted",
      params: { downloadId: "dl-1" },
    })).toBe(false);
  });

  it("rejects download-adoption closed-set violations", () => {
    // 空数组、缺字段、非字符串元素、词表外字段、缺 commandId 一律拒绝
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-3", method: "warehouse.importDownloads",
      params: { downloadIds: [] },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-4", method: "warehouse.importDownloads",
      params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-5", method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-1", 42] },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, commandId: "cmd-dl-6", method: "warehouse.importDownloads",
      // 客户端断言(路径/大小)永不是请求字段(C-3:契约保持 host/路径无关)
      params: { downloadIds: ["dl-1"], stagingPath: "C:/tmp/x" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      ...base, method: "warehouse.importDownloads",
      params: { downloadIds: ["dl-1"] },
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

describe("task snapshot result reflux (BOARD #22, proposal 020)", () => {
  const baseSnapshot = {
    contractVersion: APPLICATION_CONTRACT_VERSION,
    taskId: "proj-1",
    revision: 4,
    correlationId: "corr-1",
    state: "succeeded",
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-12T05:30:00Z",
  } satisfies TaskSnapshotV01;

  it("carries the Done payload verbatim on succeeded snapshots", () => {
    // project-ops 族载荷自描述 schemaVersion/operation；快照面对内部形状零承诺。
    const donePayload = {
      schemaVersion: "0.2",
      operation: "project.import-copy",
      result: { kind: "receipt", copiedEntries: ["Assets"] },
    } satisfies TaskDonePayloadV01;
    const snapshot: TaskSnapshotV01 = { ...baseSnapshot, result: donePayload };
    expect(snapshot.result?.["operation"]).toBe("project.import-copy");
  });

  it("treats result as optional and absent on failure faces", () => {
    const failed: TaskSnapshotV01 = {
      ...baseSnapshot,
      state: "failed",
      error: {
        code: "vua.task.timeout",
        category: "timeout",
        messageKey: "errors.task.timeout",
        correlationId: "corr-1",
        recoverable: true,
        retryable: true,
      },
    };
    expect(Object.prototype.hasOwnProperty.call(failed, "result")).toBe(false);
    // 失败事实走 error 字段，绝不伪装成结果文档。
    expect(failed.error?.code).toBe("vua.task.timeout");
  });

  it("lets TaskDonePayloadV01 absorb any operation word list shape", () => {
    // production 族载荷（resolve/job.execute）无自描述键——快照面同样承载，
    // 形状归 production-use-case 词表，本面不窄化。
    const payload: TaskDonePayloadV01 = {
      planId: "plan-00000000000000001",
      planStatus: "draft",
      missingCount: 0,
    };
    const snapshot: TaskSnapshotV01 = { ...baseSnapshot, result: payload };
    expect(snapshot.result?.["planStatus"]).toBe("draft");
  });
});
