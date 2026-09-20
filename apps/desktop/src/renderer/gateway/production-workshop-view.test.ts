import { describe, expect, it } from "vitest";
import type { AppErrorV01 } from "@vua/contracts";
import { errorCopyFor, failureLogText } from "./production-workshop-view.ts";
import { strings } from "../i18n/index.ts";

/**
 * 失败行词面纯函数测试(诚实纪律#2;W25 真机呈现缺口修复,第 142 批):
 * 执行日志失败行必须携带错误详情——messageKey 命中 errors 词表用本地化
 * 词面,否则 code 原词呈现,绝不只呈「失败」两字让用户去任务记录翻原因。
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

  it("appends the localized copy when the messageKey hits the table (failure carries its reason, never the bare two-character word)", () => {
    const base = strings.productionFlow.phase.failed;
    const line = failureLogText(base, materialError());
    expect(line).toBe(`${base}:${strings.errors.material.executionFailed}`);
    expect(line).not.toBe(base);
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
