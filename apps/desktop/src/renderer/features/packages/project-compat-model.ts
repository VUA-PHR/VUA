import type {
  ImportCopyPlanV01,
  ImportCopyReceiptV01,
} from "@vua/contracts";
import type { ProjectOpsOutcome } from "../../gateway/index.ts";

/**
 * F6 副本导入确认链的呈现纯函数(裁决 1[U6 销账],2026-09-09:确认链两呈现
 * 段 B8/B9 的测试范围——render 级测试项目无先例,以状态机纯函数抽取实现
 * 可测性;组件消费本模块,决策与投影在此覆盖):
 * - B8 = apply 成功回执的呈现五项(新项目路径/已复制数据/已复制内容/来源
 *   关系已记录/重新检查完成),值全部来自服务端 receipt 事实,缺席如实 "—";
 * - B9 = provider 缺席时同一提交呈现诚实 unavailable 反馈(接线前诚实反馈,
 *   与 record 读面诚实缺席纪律一致)。
 */

/**
 * 字节 → 人读量级(1024 进位;B 档整数,KB 起一位小数去尾零)。
 * 正确性修复(2026-09-10,随裁决 1 B8/B9 补测暴露):旧实现(原组件内联版)
 * 进位次数与单位下标错位一档——2048B 显示「2 MB」、497MB 显示「497GB」,
 * 全部量级高报一档;单位数组含 B 档后对齐。测试锁死各档边界。
 */
export function bytesText(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    unit === 0 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
  return `${rounded} ${units[unit]}`;
}

/* ---- B8:回执呈现五项投影 ---- */

export interface ReceiptLine {
  readonly label: string;
  /** 空串 = 静态断言行(来源关系已记录),渲染时不带冒号与值 */
  readonly value: string;
}

export interface ReceiptLabels {
  readonly target: string;
  readonly bytes: string;
  readonly copied: string;
  readonly source: string;
  readonly inspect: string;
}

export function receiptLines(
  receipt: ImportCopyReceiptV01,
  labels: ReceiptLabels,
): readonly ReceiptLine[] {
  return [
    { label: labels.target, value: receipt.targetPath },
    { label: labels.bytes, value: bytesText(receipt.bytesCopied) },
    { label: labels.copied, value: receipt.copiedTopLevels.join(", ") },
    // 来源关系已记录:sourceLink 由服务端落档(014 审计面),呈现为静态断言
    { label: labels.source, value: "" },
    { label: labels.inspect, value: receipt.reInspection.unityVersion ?? "—" },
  ];
}

/* ---- 确认链 outcome → 呈现决策(B9 含 unavailable 反馈) ---- */

export type GuardTextTable = Readonly<Record<string, string>>;

export interface ConfirmChainTexts {
  /** 七项守卫闭集 → 本地化文案(词表外回落 fallback) */
  readonly guardTable: GuardTextTable;
  readonly guardFallback: string;
  /** provider 缺席反馈(B9:「项目操作服务尚未接入或暂不可用」) */
  readonly unavailable: string;
}

export type ConfirmChainDecision =
  | { readonly kind: "plan"; readonly plan: ImportCopyPlanV01 }
  | { readonly kind: "receipt"; readonly receipt: ImportCopyReceiptV01 }
  | { readonly kind: "feedback"; readonly feedback: string };

export function confirmChainDecision(
  outcome: ProjectOpsOutcome,
  texts: ConfirmChainTexts,
): ConfirmChainDecision {
  if (outcome.ok && "plan" in outcome) return { kind: "plan", plan: outcome.plan };
  if (outcome.ok && "receipt" in outcome) return { kind: "receipt", receipt: outcome.receipt };
  if (outcome.ok && "rejected" in outcome) {
    const guardText = texts.guardTable[outcome.rejected.guard] ?? texts.guardFallback;
    return { kind: "feedback", feedback: `${guardText} (${outcome.rejected.code})` };
  }
  // !ok = 传输面缺席:诚实呈现服务尚未接入/暂不可用,不猜测原因
  return { kind: "feedback", feedback: texts.unavailable };
}
