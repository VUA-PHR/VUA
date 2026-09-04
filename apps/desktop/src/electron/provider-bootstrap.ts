import type { CapabilityOperationV01 } from "@vua/contracts";
import {
  SupervisedProcessProviderV01,
  type OrchestratorProviderV01,
} from "@vua/orchestrator-provider";

/**
 * 受监督真实 Provider 的能力表(操作级,契约 v0.1):
 * - task.list / environment.getSnapshot / demo.task:F2 已路由;demo 保持可用
 *   以贯通任务体验,F3 真实用例命令落地后从生产能力表移除;
 * - desktop.remoteBrowser:F4(WebContentsView + 隔离 Session)前显式不可用。
 */
const DESKTOP_CAPABILITIES: readonly CapabilityOperationV01[] = [
  { operationId: "task.list", availability: "available" },
  { operationId: "environment.getSnapshot", availability: "available" },
  { operationId: "demo.task", availability: "available" },
  {
    operationId: "desktop.remoteBrowser",
    availability: "unavailable",
    reason: {
      contractVersion: "0.1",
      code: "vua.desktop.remote_browser_unavailable",
      category: "unavailable",
      messageKey: "errors.desktop.remoteBrowserUnavailable",
      recoverable: true,
      retryable: false,
      correlationId: "kernel-capability",
    },
  },
];

export interface DesktopProviderEndpoint {
  /** 受监督 Provider 进程可执行文件(仓库构建产物,绝对路径) */
  readonly executablePath: string;
  /** SQLite 权威任务库(用户数据目录,绝对路径) */
  readonly databasePath: string;
}

/**
 * M2 整合:Electron 不再进程内 Mock,而是按已接受的托管 ADR 启动受监督
 * Provider 进程(frame 协议 v0.1,SQLite 权威任务状态,进程树遏制)。
 * 进程崩溃/退出经 Supervisor 呈现为不可用,由表现层呈现诚实断连态。
 */
export function createDesktopOrchestratorProvider(
  endpoint: DesktopProviderEndpoint,
): OrchestratorProviderV01 {
  return new SupervisedProcessProviderV01({
    executablePath: endpoint.executablePath,
    databasePath: endpoint.databasePath,
    handshakeTimeoutMs: 15_000,
  });
}
