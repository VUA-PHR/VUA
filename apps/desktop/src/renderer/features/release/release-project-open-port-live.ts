import type { GatewayClient } from "../../gateway/index.ts";
import {
  isReleaseInspectionFactV02,
  RELEASE_OPEN_FOR_INSPECTION_OPERATION,
} from "@vua/contracts";
import type {
  ProjectOpenTaskView,
  ReleaseProjectOpenIntent,
  ReleaseProjectOpenPort,
} from "./release-project-open-port.ts";

/**
 * release.openForInspection live 端口(U19 独立检视入口;核心 v0.2 冻结
 * 形状入库后由第 154 批结构缺席臂换装——第 156 批桌面对齐批):经 Desktop
 * Gateway 消费 release-handoff v0.2 词表行检视方法。消费纪律:
 * - 受理回执收窄:schemaVersion==="0.2"＋operation==="release.openForInspection"
 *   ＋taskId/correlationId 非空串四键组合才可信(联合中唯一属于检视面);
 *   形状不符如实 failed(响应不可解释≠缺席,不折叠);
 * - 诚实缺席:vua.release_handoff.unavailable(实现域未接线,路由恒答)与
 *   宿主不可达(gateway unavailable)同呈 absent——缺席语义,绝无受理假象;
 * - 其余应用错误码原样透传(检视路由闭集四码:invalid_params/build_unknown/
 *   editor_unresolved 及未来闭集演化),不猜测映射;AppErrorV01 params
 *   防御性收窄透传;request_rejected 无应用码,code=null;
 * - 任务快照经 task.get 重取权威状态(轮询由调用方驱动),投影为
 *   ProjectOpenTaskView:succeeded 携六键检视事实(经 contracts 守卫,
 *   operation 词面/无上传字段形状钉)——完成事实永不宣称交接;读取失败
 *   返回 null,调用方保持上一视图。
 */

/** AppErrorV01 params 防御性收窄:仅保留 string/number/boolean 值,
 *  形状不符照缺席处理(空表)——与交棒 live 端口同律 */
function narrowErrorParams(
  value: unknown,
): Readonly<Record<string, string | number | boolean>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
      out[key] = entry;
    }
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** task.get 回执值 → 任务快照形状收窄({ contractVersion, task } 包装或裸
 *  快照,先例同 projectHandoffTask 的 taskSnapshotFrom);形状不符 = null */
function taskSnapshotFrom(value: unknown): Record<string, unknown> | null {
  if (!isPlainObject(value)) return null;
  if (isPlainObject(value.task)) return value.task;
  if (isNonEmptyString(value.taskId) && isNonEmptyString(value.state)) return value;
  return null;
}

export function createLiveReleaseProjectOpenPort(client: GatewayClient): ReleaseProjectOpenPort {
  const openForInspection = async (buildId: string): Promise<ReleaseProjectOpenIntent> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "release.openForInspection",
      params: { buildId },
    });
    if (!result.ok) {
      if (result.error.kind === "application") {
        const error = result.error.error;
        const { code } = error;
        if (code === "vua.release_handoff.unavailable") return { kind: "absent" };
        // params 防御性透传(检视路由闭集无 state 携参码,形状防御同律保留)
        return { kind: "failed", code, params: narrowErrorParams(error.params) };
      }
      // unavailable=宿主/Provider 不可达(缺席语义);request_rejected=信封级
      // 拒绝(无应用码)——两者都无受理发生,如实呈现
      return result.error.kind === "unavailable"
        ? { kind: "absent" }
        : { kind: "failed", code: null, params: {} };
    }
    const value = result.value;
    // 字段存在性逐键核验(in/typeof):运行时形状可能不符(类型面由 Kernel
    // 路由保证,此处防御性核验照端口收窄纪律,不可省略)
    if (
      typeof value !== "object" ||
      value === null ||
      !("operation" in value) ||
      value.operation !== RELEASE_OPEN_FOR_INSPECTION_OPERATION ||
      !("schemaVersion" in value) ||
      // v0.2 冻结回执形状(族版本单源推进,wire 只说 0.2)
      value.schemaVersion !== "0.2" ||
      !("taskId" in value) ||
      typeof value.taskId !== "string" ||
      value.taskId.length === 0 ||
      !("correlationId" in value) ||
      typeof value.correlationId !== "string" ||
      value.correlationId.length === 0
    ) {
      return { kind: "failed", code: null, params: {} };
    }
    return {
      kind: "accepted",
      taskId: value.taskId,
      correlationId: value.correlationId,
    };
  };

  const taskSnapshot = async (taskId: string): Promise<ProjectOpenTaskView | null> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "task.get",
      params: { taskId },
    });
    if (!result.ok) return null;
    const task = taskSnapshotFrom(result.value);
    if (task === null) return null;
    const state = task.state;
    if (!isNonEmptyString(state)) return null;
    if (state === "succeeded" || state === "succeeded_with_warnings") {
      // 六键闭集守卫(contracts isReleaseInspectionFactV02):operation 词面
      // 钉死检视操作,携交接词面/上传状态字段的事实=构造即非法→不可解释
      const fact: unknown = task.result;
      if (isPlainObject(fact) && fact.operation === RELEASE_OPEN_FOR_INSPECTION_OPERATION) {
        if (isReleaseInspectionFactV02(fact)) {
          return { kind: "succeeded", fact };
        }
      }
      return { kind: "fact-unexplainable" };
    }
    if (state === "failed") {
      const error = task.error;
      const errorCode =
        isPlainObject(error) && isNonEmptyString(error.code) ? error.code : null;
      const messageKey =
        isPlainObject(error) && isNonEmptyString(error.messageKey) ? error.messageKey : null;
      return { kind: "failed", state, errorCode, messageKey };
    }
    if (state === "cancelled") return { kind: "cancelled" };
    // 非终态(含九态外原词):原样透传,不猜测
    return { kind: "running", state };
  };

  return { openForInspection, taskSnapshot };
}
