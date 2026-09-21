import type { TaskStatus } from "../../app/task-status.ts";

/**
 * 车间执行状态面呈现模型(proposal 029 A6,切片二;设计标准 0.7.16 §8.5):
 * 纯函数,组件不内联业务决策。状态面只呈现事实——链身份来自共享容器层
 * store(029 A4 选择事实源动作),计划/记录来自 Gateway 查询,任务进展以
 * 任务中心权威快照为准;与发起面(配方页选中态)同一事实源,零发起动作。
 */

/**
 * 任务是否处于「需要用户处理」的状态(九态子集):
 * waitingInput/paused/failed 时,恢复/取消/重试决策在任务中心进行,
 * 状态面只呈现指路词面,不自建第二决策面(A6 核对点④:恢复决策呈现＝
 * 语义选择面,用户决定 ID 由 Kernel 受理时生成绑定,既有 v0.1 recover
 * 纪律同构——本页不发明恢复动作)。
 */
export function taskNeedsDecision(status: TaskStatus): boolean {
  return status === "waitingInput" || status === "paused" || status === "failed";
}
