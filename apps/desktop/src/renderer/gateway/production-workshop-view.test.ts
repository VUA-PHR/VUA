import { describe, expect, it } from "vitest";
import type { AppErrorV01 } from "@vua/contracts";
import { errorCopyFor, failureLogText } from "./production-workshop-view.ts";
import { strings } from "../i18n/index.ts";

/**
 * 失败行词面纯函数测试(诚实纪律#2;W25 真机呈现缺口修复,第 142 批;
 * 148 批反向审查订正为并呈律):执行日志失败行必须携带错误详情——
 * messageKey 命中 errors 词表 = 本地化词面 + code 原词并呈(引擎素材
 * Failed 的 messageKey 历史上恒为 executionFailed 与 code 无关,只呈
 * 词面会遮蔽精确原因;核心第 150 批起按类别分化:供给段失败发射
 * provisionFailed,其余保持 executionFailed),未命中 = code 原词,
 * 绝不只呈「失败」两字让用户去任务记录翻原因。
 */

function materialError(overrides: Partial<AppErrorV01> = {}): AppErrorV01 {
  return {
    contractVersion: "0.1",
    code: "vua.material.bridge_failed",
    category: "external_failure",
    messageKey: "errors.material.executionFailed",
    recoverable: false,
    retryable: true,
    correlationId: "corr-material-1",
    ...overrides,
  };
}

describe("workshop failure-log word face (batch 142 honest-failure presentation)", () => {
  it("resolves a known errors.* messageKey to the localized copy", () => {
    expect(errorCopyFor("errors.material.executionFailed")).toBe(
      strings.errors.material.executionFailed,
    );
  });

  it("answers null for word-list-foreign messageKeys and broken family chains (caller falls back to the raw code, never guesses semantics)", () => {
    expect(errorCopyFor("vua.material.bridge_failed")).toBeNull();
    expect(errorCopyFor("errors.material.doesNotExist")).toBeNull();
    expect(errorCopyFor("errors")).toBeNull();
    expect(errorCopyFor("")).toBeNull();
  });

  it("appends the localized copy AND the raw code when the messageKey hits the table (the engine's coarse key historically traveled regardless of code - the verbatim code must never be shadowed; 148-batch dual-fact presentation)", () => {
    const base = strings.productionFlow.phase.failed;
    const line = failureLogText(base, materialError());
    expect(line).toBe(
      `${base}:${strings.errors.material.executionFailed} (vua.material.bridge_failed)`,
    );
    expect(line).toContain(strings.errors.material.executionFailed);
    expect(line).toContain("vua.material.bridge_failed");
    expect(line).not.toBe(base);
  });

  it("carries the localized word face plus the provision code for a provision failure (historical batch-146 shape: before core batch-150 the coarse executionFailed key traveled with provision codes too; the dual-fact line still presents both facts for any such input)", () => {
    const base = strings.productionFlow.phase.failed;
    const line = failureLogText(
      base,
      materialError({ code: "vua.material.provision_failed: vua.vpm.no_matching_package" }),
    );
    expect(line).toContain(strings.errors.material.executionFailed);
    expect(line).toContain("vua.material.provision_failed");
  });

  it("appends the raw code verbatim when the messageKey has no localized word face (e.g. vua.material.bridge_failed)", () => {
    const base = strings.productionFlow.phase.failedRecoverable;
    const line = failureLogText(
      base,
      materialError({ messageKey: "errors.material.unknownFace", code: "vua.material.bridge_failed" }),
    );
    expect(line).toBe(`${base}:vua.material.bridge_failed`);
  });

  it("keeps the bare base word when the error payload is absent (never fabricates a detail)", () => {
    const base = strings.productionFlow.phase.failed;
    expect(failureLogText(base, null)).toBe(base);
  });
});

/**
 * material 词表完整性检查(第 169 批桌面补齐,#45 候选件):桌面
 * errors.material 表必须恰持有引擎 errors.material.* 的完整 12 键发射面
 * (锚点 = crates 实读:unity-bridge material_exec failure_message_key
 * 分类分化〔executionFailed/provisionFailed〕+ material_intake 发射点
 * 〔sourceInvalid/sourceEmpty/sourceUnreadable/sourceDrift/planHashMismatch/
 * riskDecisionStale/riskDecisionRequired/cancelled/internal〕+
 * provider-host worker 恢复面〔recordFailed〕)。双向闭集钉:引擎新增
 * 键而词表未补 = 此钉红(防回退到 code 兜底的生硬呈现);词表多键 =
 * 此钉红(不留无发射面的死词面)。补齐前桌面仅 2 键,其余 10 键由 code
 * 原词兜底(诚实但生硬)——本批补齐后每键均有词面且并呈律不变。
 */
describe("material word-table completeness (batch 169 adoption of the engine's 12-key emission face)", () => {
  const ENGINE_MATERIAL_EMISSION_FACE = [
    "executionFailed",
    "provisionFailed",
    "sourceInvalid",
    "sourceEmpty",
    "sourceUnreadable",
    "sourceDrift",
    "planHashMismatch",
    "riskDecisionStale",
    "riskDecisionRequired",
    "cancelled",
    "internal",
    "recordFailed",
  ] as const;

  it("holds exactly the engine's 12-key errors.material.* emission face - no missing rows, no dead rows", () => {
    expect(Object.keys(strings.errors.material).sort()).toEqual(
      [...ENGINE_MATERIAL_EMISSION_FACE].sort(),
    );
  });

  it("resolves every emission-face key to a non-empty localized row via the standing lookup (no reserved-only placeholder rows left)", () => {
    const table = strings.errors.material as Record<string, string>;
    for (const key of ENGINE_MATERIAL_EMISSION_FACE) {
      const copy = errorCopyFor(`errors.material.${key}`);
      expect(copy).toBe(table[key]);
      expect(copy?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
