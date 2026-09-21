import type { GatewayClient } from "../../gateway/index.ts";
import type {
  HandoffTaskView,
  ReleaseHandoffIntent,
  ReleaseHandoffPort,
} from "./release-handoff-port.ts";
import { projectHandoffTask } from "./release-handoff-model.ts";

/**
 * release.openForHandoff live 端口(023 消费切片;TS 面随族升 0.2——核心
 * U19 批单源推进,受理回执 schemaVersion 现为 "0.2"):经 Desktop Gateway
 * 消费 release-handoff 词表行。消费纪律:
 * - 受理回执收窄:schemaVersion==="0.2"＋operation==="release.openForHandoff"
 *   ＋taskId/correlationId 非空串四键组合才可信(联合中唯一属于本族面);
 *   形状不符如实 failed(响应不可解释≠缺席,不折叠);
 * - 诚实缺席:vua.release_handoff.unavailable(实现域未接线,路由恒答)与
 *   宿主不可达(gateway unavailable)同呈 absent——缺席语义,绝无受理假象;
 * - 其余应用错误码原样透传(v0.2 六码闭集:invalid_params/build_unknown/
 *   record_state_blocked/record_state_unknown/editor_unresolved 及未来闭集
 *   演化),不猜测映射;AppErrorV01 params 防御性收窄透传(准入闸 state 原词
 *   的词面插值消费面);request_rejected 无应用码,code=null;
 * - 任务快照经 task.get 重取权威状态(轮询由调用方驱动),投影见
 *   projectHandoffTask;读取失败返回 null,调用方保持上一视图。
 */
/** AppErrorV01 params 防御性收窄:仅保留 string/number/boolean 值,
 *  形状不符照缺席处理(空表)——词面插值消费侧再按需取键 */
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

export function createLiveReleaseHandoffPort(client: GatewayClient): ReleaseHandoffPort {
  const openForHandoff = async (buildId: string): Promise<ReleaseHandoffIntent> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "release.openForHandoff",
      params: { buildId },
    });
    if (!result.ok) {
      if (result.error.kind === "application") {
        const error = result.error.error;
        const { code } = error;
        if (code === "vua.release_handoff.unavailable") return { kind: "absent" };
        // params 防御性透传(U19 准入闸 record_state_blocked 的 state 原词随此到达)
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
      value.operation !== "release.openForHandoff" ||
      !("schemaVersion" in value) ||
      // v0.2 族版本单源推进(核心 U19 批,wire 只说 0.2)
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

  const taskSnapshot = async (taskId: string): Promise<HandoffTaskView | null> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "task.get",
      params: { taskId },
    });
    if (!result.ok) return null;
    return projectHandoffTask(result.value);
  };

  return { openForHandoff, taskSnapshot };
}
