import type { PlanListEntryV02, RecordListEntryV02 } from "@vua/contracts";

/**
 * 生产链段呈现模型(019 批 C):纯函数,组件不内联业务决策。
 * 计划/记录条目来自 Gateway 端口的类型化收窄结果(contracts v0.2 形状),
 * 这里只做呈现投影:身份匹配与行排序,不发明字段、不猜测排序契约。
 */

/** AC-13:记录按本链执行计划身份匹配——不跳到固定历史示例 */
export function chainRecordsForPlan(
  entries: readonly RecordListEntryV02[],
  planId: string,
): readonly RecordListEntryV02[] {
  return entries.filter((entry) => entry.planId === planId);
}

/** 计划行呈现序:批准时间降序(无批准时间的 draft 保持稳定次序) */
export function planRowsForDisplay(
  entries: readonly PlanListEntryV02[],
): readonly PlanListEntryV02[] {
  return [...entries].sort((a, b) => b.approvedAt.localeCompare(a.approvedAt));
}
