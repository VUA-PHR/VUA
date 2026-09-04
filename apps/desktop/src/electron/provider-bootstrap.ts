import type { CapabilityOperationV01 } from "@vua/contracts";
import {
  MockOrchestratorProviderV01,
  type OrchestratorProviderV01,
} from "@vua/orchestrator-provider";

/**
 * 受控 Mock Provider 的能力表(操作级,契约 v0.1):
 * - task.list / environment.getSnapshot / demo.task:F2 已路由,F2 期间 demo
 *   保持可用以贯通任务体验,F3 真实用例命令落地后从生产能力表移除;
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

export function createDesktopOrchestratorProvider(): OrchestratorProviderV01 {
  return new MockOrchestratorProviderV01({
    providerBuildId: "desktop-m1-controlled-mock",
    providerInstanceId: "desktop-main",
    capabilities: DESKTOP_CAPABILITIES,
  });
}
