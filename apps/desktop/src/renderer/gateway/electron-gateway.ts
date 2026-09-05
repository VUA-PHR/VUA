import type { ApplicationEventV01, TaskEventV01 } from "@vua/contracts";
import { neverChecked } from "../features/deployer/deployer-model.ts";
import type { StoredGoalsV1 } from "../app/onboarding-model.ts";
import { projectEnvironmentSnapshot, projectTaskItem } from "./contract-projection.ts";
import { emptyGateway } from "./empty-gateway.ts";
import { createGatewayClient, type DesktopGatewayHost, type GatewayClient } from "./gateway-client.ts";
import type { EnvironmentPort, EnvironmentView, FixPlanResult } from "./environment-port.ts";
import type { VuaGateway } from "./gateway.ts";
import { createLiveModelProduction } from "./live-production-port.ts";
import type { TaskCenterView, TaskPort } from "./task-port.ts";
import type { CapabilityReport, DataSource } from "./types.ts";

/**
 * Electron live Gateway(F2/F-3):任务中心、环境快照与生产纵向七方法经
 * Kernel 直达应用层;其余领域仍为 not-run 诚实空态,随所属纵向切片逐个
 * 接入(页面零重写)。
 * 断连语义:首帧取数失败向上抛出(GatewayProvider 呈现诚实失败 + 重试);
 * 订阅期间取数失败保留上一视图,恢复由下一次事件或用户重试驱动。
 */

function isTaskEvent(event: ApplicationEventV01): event is TaskEventV01 {
  return event.kind !== "capability.changed";
}

function createLiveTaskPort(client: GatewayClient): TaskPort {
  const fetchView = async (): Promise<TaskCenterView> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "task.list",
      params: {},
    });
    if (!result.ok || !("tasks" in result.value)) throw new Error("task_list_unavailable");
    return { schemaVersion: 1, tasks: result.value.tasks.map(projectTaskItem) };
  };
  const refreshBestEffort = async (): Promise<TaskCenterView> => {
    try {
      return await fetchView();
    } catch {
      return { schemaVersion: 1, tasks: [] };
    }
  };
  return {
    snapshot: fetchView,
    subscribe(callback) {
      // 事件只是事实通知;权威状态一律经 task.list 重取(契约"revision 与事件")
      return client.subscribe((event) => {
        if (!isTaskEvent(event)) return;
        void fetchView().then(callback, () => {
          /* 断连期间保留上一视图 */
        });
      });
    },
    async cancel(taskId) {
      const result = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "task.requestCancellation",
        params: { taskId, commandId: crypto.randomUUID() },
      });
      if (result.ok) return { kind: "ok", view: await refreshBestEffort() };
      if (result.error.kind === "application") {
        return {
          kind: "rejected",
          reason: result.error.error.code === "vua.task.not_found" ? "unknown_task" : "not_cancellable",
          view: await refreshBestEffort(),
        };
      }
      return { kind: "rejected", reason: "unavailable", view: await refreshBestEffort() };
    },
    async retry(taskId) {
      const result = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "download.retry",
        params: { taskId, commandId: crypto.randomUUID() },
      });
      if (result.ok && "decision" in result.value) {
        return {
          kind: "ok",
          decision: result.value.decision as "resume" | "retry",
        };
      }
      if (!result.ok && result.error.kind === "application") {
        const code = result.error.error.code;
        return {
          kind: "rejected",
          reason: code === "vua.task.not_found"
            ? "unknown_task"
            : code === "vua.download.not_retryable" ? "not_retryable" : "unavailable",
        };
      }
      return { kind: "rejected", reason: "unavailable" };
    },
    async capability() {
      const result = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "app.snapshot",
        params: {},
      });
      if (!result.ok || !("capabilities" in result.value) || !("tasks" in result.value.capabilities)) {
        return { state: "unavailable", detailKey: "taskEngineMissing" };
      }
      return result.value.capabilities.tasks
        ? { state: "ready" }
        : { state: "unavailable", detailKey: "taskEngineMissing" };
    },
  };
}

function createLiveEnvironmentPort(client: GatewayClient): EnvironmentPort {
  const fetchView = async (): Promise<EnvironmentView> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "environment.getSnapshot",
      params: {},
    });
    if (!result.ok || !("items" in result.value)) throw new Error("environment_snapshot_unavailable");
    return projectEnvironmentSnapshot(result.value);
  };
  return {
    snapshot: fetchView,
    subscribe(callback) {
      // 契约 v0.1 尚无环境事件;capability.changed 时重取快照保持新鲜
      return client.subscribe((event) => {
        if (event.kind !== "capability.changed") return;
        void fetchView().then(callback, () => {
          /* 断连期间保留上一视图 */
        });
      });
    },
    // 检测执行命令属 F6/B6;能力不可用时入口不出现,此处只返回当前快照
    runCheck: () =>
      fetchView().catch(() => ({
        schemaVersion: 1,
        deployer: neverChecked(),
        versions: { play: [], create: [] },
      })),
    async planFix(): Promise<FixPlanResult> {
      return { kind: "unavailable" };
    },
    async capability(): Promise<CapabilityReport> {
      const result = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "environment.getSnapshot",
        params: {},
      });
      return result.ok
        ? { state: "ready" }
        : { state: "unavailable", detailKey: "detectorsMissing" };
    },
  };
}

/** Kernel 宿主完整面:gateway/events 供 client,dialog 供素材来源选取 */
export interface DesktopKernelHost extends DesktopGatewayHost {
  dialog?: {
    pickMaterialSource(
      intake: "direct_unity_package" | "local_reusable_vpm",
    ): Promise<{ refId: string; displayName: string } | null>;
  };
}

export function createElectronGateway(
  host: DesktopKernelHost | undefined,
  initialGoals: StoredGoalsV1 | null,
): VuaGateway {
  const client = createGatewayClient(host);
  const notRun = emptyGateway(initialGoals);
  // F3(F-3):生产纵向七方法经 live 端口走 Kernel 路由(运行视图由任务
  // 生命周期推导,文档按引用查询);图谱/分享码/卡片墙仍走 notRun 退路,
  // 随所属切片接入(只换实现,视图与端口形状不动)
  const liveModelProduction = createLiveModelProduction(client, host, notRun.modelProduction);
  return {
    environment: createLiveEnvironmentPort(client),
    task: createLiveTaskPort(client),
    tutorial: notRun.tutorial,
    modelProduction: liveModelProduction,
    toolCatalog: notRun.toolCatalog,
    settings: notRun.settings,
    acquire: notRun.acquire,
    packages: notRun.packages,
    dataSource: (): DataSource => "live",
  };
}
