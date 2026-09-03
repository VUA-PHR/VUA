/**
 * 后台任务状态枚举(ui-ux-standard §7.4,九态)。
 * 进入模型层:任务中心 / 车间 / 下载队列等所有后台任务统一使用本枚举,
 * 显示文案一律查 strings.taskStatus(键与本类型一一对应),不得自行造词。
 * 组件卸载、窗口关闭或切换模块不能让可恢复任务失去应用层状态。
 */
export type TaskStatus =
  | "queued"
  | "preparing"
  | "running"
  | "waitingInput"
  | "paused"
  | "completed"
  | "completedWithWarnings"
  | "failed"
  | "cancelled";

export const taskStatuses: readonly TaskStatus[] = [
  "queued",
  "preparing",
  "running",
  "waitingInput",
  "paused",
  "completed",
  "completedWithWarnings",
  "failed",
  "cancelled",
];
