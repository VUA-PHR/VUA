import type { TaskStatus } from "../app/task-status.ts";

/**
 * WorkflowStage 的渲染层本地镜像(docs/protocols/unity-bridge-v1 的阶段词表)。
 * 正式 TS 契约随 packages/contracts 的 Unity Bridge 类型切片迁入,届时删除
 * 本镜像、改从 @vua/contracts 引入;漂移由 workflow.test 的全集约束把守。
 */
export type WorkflowStage =
  | "inspect"
  | "plan"
  | "await_confirmation"
  | "snapshot"
  | "execute"
  | "validate"
  | "completed"
  | "recover";

/**
 * 工作流执行状态与任务中心投影(G3 自审冻结,对接中台 P3 泛化状态机)。
 *
 * 职责分离(不自造第三套枚举):
 * - 领域事实:WorkflowStage 采用 docs/protocols/unity-bridge-v1 的阶段词表
 *   (本地镜像,见上);中台 P3 journal 按同一词表实现;
 * - 三个增补态(failed / failed_recoverable / expired)是运行期事实,contracts
 *   的 WorkflowStage 暂无失败与过期表达——属与中台对齐中的增补;若 contracts
 *   修订收录,则删除本地增补、改从 contracts 引入;
 * - 展示投影:任务中心(ui-ux §6.3 九态)是全部后台任务(含下载队列)的
 *   粗粒度展示层,工作流状态经 taskStatusForWorkflow 投影进入;下载任务没有
 *   "待确认/回滚",两枚举不合并。
 *
 * 语义注记(与中台对齐结论):
 * - "已确认"不是独立态:由 await_confirmation → execute 跃迁表达;
 * - expired:fingerprint / plan 变化导致确认失效、任务未执行——必须显式
 *   可表达,否则前端无法区分"失败"与"从未执行";
 * - 细粒度工作流状态文案在 strings.workflowStage(车间视图用),
 *   任务中心只消费投影后的 TaskStatus 文案。
 */
export type WorkflowRunState = WorkflowStage | "failed" | "failed_recoverable" | "expired";

/** 工作流阶段全集(unity-bridge v1 镜像;增补三态之外的部分) */
export const workflowStages: readonly WorkflowStage[] = [
  "inspect",
  "plan",
  "await_confirmation",
  "snapshot",
  "execute",
  "validate",
  "completed",
  "recover",
];

/** 全集:与 strings.workflowStage 一一对应(i18n 奇偶测试约束) */
export const workflowRunStates: readonly WorkflowRunState[] = [
  ...workflowStages,
  "failed",
  "failed_recoverable",
  "expired",
];

/**
 * 工作流状态 → 任务中心九态投影(纯函数,switch 穷尽——新增状态不映射
 * 即编译错误)。
 * 投影是有损的:recover 投影为 running(回滚是进行中的恢复动作),
 * expired 投影为 cancelled(确认失效、未执行)——细粒度由车间视图经
 * strings.workflowStage 表达,任务中心行内说明由任务标题/errorText 负载承载。
 */
export function taskStatusForWorkflow(state: WorkflowRunState): TaskStatus {
  switch (state) {
    case "inspect":
    case "plan":
      return "preparing";
    case "await_confirmation":
      return "waitingInput";
    case "snapshot":
    case "execute":
    case "validate":
    case "recover":
      return "running";
    case "completed":
      return "completed";
    case "failed":
    case "failed_recoverable":
      return "failed";
    case "expired":
      return "cancelled";
  }
}
