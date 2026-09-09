import assert from "node:assert/strict";
import { test } from "vitest";
import {
  bytesText,
  confirmChainDecision,
  receiptLines,
  type ConfirmChainTexts,
} from "./project-compat-model.ts";
import type { ImportCopyPlanV01, ImportCopyReceiptV01 } from "@vua/contracts";

/* 裁决 1[U6 销账](2026-09-09 用户裁定):确认链两呈现段的测试范围——
 * B8 = apply 成功回执呈现五项(新项目路径/已复制数据/已复制内容/来源关系
 * 已记录/重新检查完成);B9 = provider 缺席时同一提交呈现诚实 unavailable
 * 反馈。render 级测试项目无先例,呈现决策与投影抽为纯函数后在此覆盖;
 * 组件(ProjectCompatPage)消费同一函数,接线为薄渲染。 */

const labels = {
  target: "<target>",
  bytes: "<bytes>",
  copied: "<copied>",
  source: "<source>",
  inspect: "<inspect>",
};

const texts: ConfirmChainTexts = {
  guardTable: { target_exists: "<guard-target-exists>", plan_drift: "<guard-plan-drift>" },
  guardFallback: "<guard-fallback>",
  unavailable: "<unavailable-feedback>",
};

function receiptOf(overrides: Partial<ImportCopyReceiptV01>): ImportCopyReceiptV01 {
  return {
    kind: "receipt",
    sourcePath: "C:/source/proj",
    targetPath: "C:/vua/copy",
    targetProjectName: "copy",
    copiedTopLevels: ["Assets", "Packages"],
    excludedEntries: ["Library", "Temp"],
    bytesCopied: 521_338_880,
    sourceLink: {
      sourcePath: "C:/source/proj",
      sourceAssociations: ["alcom_registered"],
      importedAt: "2026-09-10T00:00:00.000Z",
      taskCorrelation: "corr-1",
    },
    reInspection: {
      unityVersion: "2022.3.22f1",
      unityClassification: "production_target",
      manifestPresent: true,
      manifestSchemaOk: true,
    },
    ...overrides,
  };
}

/* ---- B8:回执呈现五项 ---- */

test("receiptLines: 呈现五项齐全,值全部来自服务端 receipt 事实", () => {
  const lines = receiptLines(receiptOf({}), labels);
  assert.equal(lines.length, 5);
  assert.deepEqual(lines[0], { label: "<target>", value: "C:/vua/copy" });
  assert.deepEqual(lines[1], { label: "<bytes>", value: "497.2 MB" });
  assert.deepEqual(lines[2], { label: "<copied>", value: "Assets, Packages" });
  // 来源关系已记录 = 静态断言行(空值,渲染不带冒号)
  assert.deepEqual(lines[3], { label: "<source>", value: "" });
  assert.deepEqual(lines[4], { label: "<inspect>", value: "2022.3.22f1" });
});

test("receiptLines: 重新检查缺席如实占位,不猜测版本", () => {
  const lines = receiptLines(
    receiptOf({ reInspection: {
      unityVersion: null,
      unityClassification: "migration_source",
      manifestPresent: false,
      manifestSchemaOk: false,
    } }),
    labels,
  );
  assert.equal(lines[4]!.value, "—");
});

test("bytesText: 各档边界与一位小数去尾零(单位错位缺陷回归锚)", () => {
  assert.equal(bytesText(512), "512 B");
  assert.equal(bytesText(1023), "1023 B");
  assert.equal(bytesText(1024), "1 KB");
  assert.equal(bytesText(2048), "2 KB");
  assert.equal(bytesText(1536), "1.5 KB");
  assert.equal(bytesText(521_338_880), "497.2 MB");
  assert.equal(bytesText(3 * 1024 ** 3), "3 GB");
});

/* ---- 确认链 outcome → 呈现决策(plan/receipt/guard/unavailable) ---- */

test("confirmChainDecision: plan 受理 → plan 面板", () => {
  const plan = { kind: "plan" } as ImportCopyPlanV01;
  const decision = confirmChainDecision({ ok: true, plan }, texts);
  assert.deepEqual(decision, { kind: "plan", plan });
});

test("confirmChainDecision: apply 成功 → receipt 回执(B8 正向路径)", () => {
  const receipt = receiptOf({});
  const decision = confirmChainDecision({ ok: true, receipt }, texts);
  assert.deepEqual(decision, { kind: "receipt", receipt });
});

test("confirmChainDecision: 守卫拒绝 → guard 文案映射＋稳定码", () => {
  const decision = confirmChainDecision(
    { ok: true, rejected: { kind: "rejected", guard: "plan_drift", code: "vua.project.plan_drift", detail: "d" } },
    texts,
  );
  assert.deepEqual(decision, {
    kind: "feedback",
    feedback: "<guard-plan-drift> (vua.project.plan_drift)",
  });
});

test("confirmChainDecision: 词表外守卫回落 fallback 文案", () => {
  // 运行时防御面:guard 值域外输入按回落文案呈现(类型断言模拟越值输入)
  const decision = confirmChainDecision(
    { ok: true, rejected: { kind: "rejected", guard: "unknown_guard" as never, code: "vua.project.unknown_guard", detail: "d" } },
    texts,
  );
  assert.deepEqual(decision, {
    kind: "feedback",
    feedback: "<guard-fallback> (vua.project.unknown_guard)",
  });
});

test("confirmChainDecision: provider 缺席 → 诚实 unavailable 反馈(B9)", () => {
  // 真实 provider 场景:同一提交,不猜测原因、不吞错,原样呈现反馈文案
  for (const error of [{ kind: "unavailable" as const }, { kind: "request_rejected" as const }]) {
    const decision = confirmChainDecision({ ok: false, error }, texts);
    assert.deepEqual(decision, { kind: "feedback", feedback: "<unavailable-feedback>" });
  }
});
