import { describe, expect, it } from "vitest";
import type { RecordListEntryV02 } from "@vua/contracts";
import {
  isBuildRecordStatusV03,
  narrowBuildRecordFacts,
  recordListStatusLabel,
  recordListStatusTone,
  recordStatusTone,
  sortRecordRowsByFinishedAtDesc,
} from "./release-records-model.ts";

/** 出厂页构建记录读面模型(P2):build-record v0.3 文档呈现事实收窄 */
const status = {
  succeeded: "成功",
  succeeded_with_warnings: "成功(有警告)",
  failed: "失败",
  cancelled: "已取消",
  rolled_back: "已回滚",
  recovered: "已恢复",
} as const;

/** v0.3 冻结形状的最小完整文档(字段值满足 schema 形状) */
function fullDocument(): Record<string, unknown> {
  return {
    schemaVersion: "0.3",
    buildId: "018f6b2a-7c1d-7e2a-9abc-0def12345678",
    recipeId: "018f6b2a-7c1d-7e2a-9abc-0def12345679",
    recipeRevision: 3,
    planId: "018f6b2a-7c1d-7e2a-9abc-0def1234567a",
    planHash: "sha256:" + "a".repeat(64),
    planSchemaVersion: "0.3",
    environmentId: "018f6b2a-7c1d-7e2a-9abc-0def1234567b",
    startedAt: "2026-09-12T00:00:00Z",
    finishedAt: "2026-09-12T00:05:00Z",
    status: "succeeded",
    inputs: {
      recipeDigest: "sha256:" + "b".repeat(64),
      localResolutionDigest: "sha256:" + "c".repeat(64),
      planHash: "sha256:" + "a".repeat(64),
    },
    jobs: [
      { jobId: "j1", commandId: "cmd-1", kind: "attach_to_bone", planHash: "sha256:" + "a".repeat(64), dryRun: false, replayed: false, status: "succeeded", resolvedSourceUsed: { sourceKind: "original", artifactSha256: "sha256:" + "d".repeat(64) } },
      { jobId: "j2", commandId: "cmd-2", kind: "exclude_object", planHash: "sha256:" + "a".repeat(64), dryRun: false, replayed: false, status: "rejected", rejectReason: "vua.guard.demo", resolvedSourceUsed: { sourceKind: "original", artifactSha256: "sha256:" + "d".repeat(64) } },
    ],
    recoveryPoints: [],
    evidenceSummary: { evidenceIds: ["ev-1", "ev-2", "ev-3"] },
  };
}

describe("narrowBuildRecordFacts", () => {
  it("完整文档:身份/六态/jobs 三态计数/偏差/证据引用计数全收窄", () => {
    const facts = narrowBuildRecordFacts(fullDocument());
    expect(facts).not.toBeNull();
    expect(facts?.buildId).toBe("018f6b2a-7c1d-7e2a-9abc-0def12345678");
    expect(facts?.status).toBe("succeeded");
    expect(facts?.jobCounts).toEqual({ total: 2, succeeded: 1, failed: 0, rejected: 1 });
    expect(facts?.planDeviationCount).toBe(0);
    expect(facts?.evidenceIdCount).toBe(3);
  });

  it("planDeviations 在场 = 条数呈现(可选字段,缺席 = 0 不猜测)", () => {
    const doc = { ...fullDocument(), planDeviations: [{ jobId: "j1", deviationKind: "source_fallback", detail: "x" }] };
    expect(narrowBuildRecordFacts(doc)?.planDeviationCount).toBe(1);
    expect(narrowBuildRecordFacts(fullDocument())?.planDeviationCount).toBe(0);
  });

  it("evidenceSummary 缺席 = evidenceIdCount null(缺席即证据,UI 明示,不猜测为 0)", () => {
    const doc = fullDocument();
    delete doc.evidenceSummary;
    const facts = narrowBuildRecordFacts(doc);
    expect(facts?.evidenceIdCount).toBeNull();
  });

  it("必需事实缺失/类型不符 = null(整条不可解释,不猜测)", () => {
    expect(narrowBuildRecordFacts(null)).toBeNull();
    expect(narrowBuildRecordFacts("nope")).toBeNull();
    expect(narrowBuildRecordFacts([])).toBeNull();
    for (const key of ["buildId", "recipeId", "recipeRevision", "planId", "startedAt", "finishedAt", "status", "jobs"]) {
      const doc = fullDocument();
      delete doc[key];
      expect(narrowBuildRecordFacts(doc), `缺 ${key}`).toBeNull();
    }
    const badRevision = fullDocument();
    badRevision.recipeRevision = 0;
    expect(narrowBuildRecordFacts(badRevision)).toBeNull();
    const badRevisionType = fullDocument();
    badRevisionType.recipeRevision = "3";
    expect(narrowBuildRecordFacts(badRevisionType)).toBeNull();
  });

  it("status 词表外 = null(六态闭集外不猜测)", () => {
    const doc = fullDocument();
    doc.status = "running";
    expect(narrowBuildRecordFacts(doc)).toBeNull();
    const doc2 = fullDocument();
    doc2.status = 42;
    expect(narrowBuildRecordFacts(doc2)).toBeNull();
  });

  it("jobs 条目 status 词表外或非对象 = null(收据不可解释,不低估计数)", () => {
    const doc = fullDocument();
    const jobs = doc.jobs as Array<Record<string, unknown>>;
    jobs[0]!.status = "whatever";
    expect(narrowBuildRecordFacts(doc)).toBeNull();
    const doc2 = fullDocument();
    (doc2.jobs as unknown[])[0] = "junk";
    expect(narrowBuildRecordFacts(doc2)).toBeNull();
  });

  it("recovered 六态收窄通过(recovered 呈现语义挂靠)", () => {
    const doc = fullDocument();
    doc.status = "recovered";
    expect(narrowBuildRecordFacts(doc)?.status).toBe("recovered");
  });
});

describe("status 投影", () => {
  it("六态判定与色调:failed/rolled_back 异常红,其余中性;词表外原样呈现", () => {
    expect(isBuildRecordStatusV03("succeeded")).toBe(true);
    expect(isBuildRecordStatusV03("running")).toBe(false);
    expect(recordStatusTone("failed")).toBe("error");
    expect(recordStatusTone("rolled_back")).toBe("error");
    expect(recordStatusTone("succeeded")).toBe("neutral");
    expect(recordStatusTone("recovered")).toBe("neutral");
    // 列表行(端口收窄只保证非空串):词表外原样呈现,不猜测为词表内值
    expect(recordListStatusLabel("succeeded", status)).toBe("成功");
    expect(recordListStatusLabel("mystery", status)).toBe("mystery");
    expect(recordListStatusTone("mystery")).toBe("neutral");
  });
});

describe("sortRecordRowsByFinishedAtDesc", () => {
  const row = (buildId: string, finishedAt: string): RecordListEntryV02 => ({
    buildId,
    planId: "p",
    status: "succeeded",
    finishedAt,
  });

  it("完成时间降序;不改输入数组(纯投影)", () => {
    const rows = [row("a", "2026-09-10T00:00:00Z"), row("b", "2026-09-12T00:00:00Z"), row("c", "2026-09-11T00:00:00Z")];
    const before = structuredClone(rows);
    const sorted = sortRecordRowsByFinishedAtDesc(rows);
    expect(sorted.map((r) => r.buildId)).toEqual(["b", "c", "a"]);
    expect(rows).toEqual(before);
  });
});
