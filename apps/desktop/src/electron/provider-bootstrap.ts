import { spawn } from "node:child_process";
import path from "node:path";
import type { CapabilityOperationV01 } from "@vua/contracts";
import {
  providerEnvironment,
  SupervisedProcessProviderV01,
  type OrchestratorProviderV01,
  type ProviderProcessFactoryV01,
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
  /** Provider 数据根(VUA_PROVIDER_DATA,BDL/记录/身份/temp 落此之下,绝对路径) */
  readonly providerDataRoot: string;
  /** 仓储根(VUA_WAREHOUSE_ROOT,导入素材包条目落此,绝对路径) */
  readonly warehouseRoot: string;
  /** 生产用例作业目标项目根(VUA_PROJECT_ROOT,与壳内四元组同源,绝对路径) */
  readonly projectRoot: string;
}

/**
 * 桌面壳侧 Provider 运行时环境注入(用户实测缺口修复 2026-09-12):
 * 基座包的环境清洗(providerEnvironment)只放行系统变量——这是正确的安全
 * 默认,但 Provider 进程的仓储/下载/生产用例服务面按 bin 约定从环境读取
 * 自己的运行时配置(VUA_PROVIDER_DATA/VUA_WAREHOUSE_ROOT/VUA_PROJECT_ROOT,
 * proposal 005「provider 运行时配置不进 wire」)。壳作为组合根在清洗后的
 * 基础上显式补齐这三项确定性路径;除此之外不透传任何宿主变量——凭据类
 * 变量(VUA_TOKEN 等)仍被清洗层剥离,此处也不引入。路径是壳管辖的用户
 * 数据目录布局,不是机密。
 */
export function desktopProviderProcessFactory(
  endpoint: Pick<DesktopProviderEndpoint, "providerDataRoot" | "warehouseRoot" | "projectRoot">,
): ProviderProcessFactoryV01 {
  return (executablePath, databasePath) =>
    spawn(executablePath, ["--database", databasePath], {
      cwd: path.dirname(executablePath),
      env: {
        ...providerEnvironment(process.env),
        VUA_PROVIDER_DATA: endpoint.providerDataRoot,
        VUA_WAREHOUSE_ROOT: endpoint.warehouseRoot,
        VUA_PROJECT_ROOT: endpoint.projectRoot,
      },
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
}

/**
 * M2 整合:Electron 不再进程内 Mock,而是按已接受的托管 ADR 启动受监督
 * Provider 进程(frame 协议 v0.1,SQLite 权威任务状态,进程树遏制)。
 * 进程崩溃/退出经 Supervisor 呈现为不可用,由表现层呈现诚实断连态。
 */
export function createDesktopOrchestratorProvider(
  endpoint: DesktopProviderEndpoint,
): OrchestratorProviderV01 {
  return new SupervisedProcessProviderV01(
    {
      executablePath: endpoint.executablePath,
      databasePath: endpoint.databasePath,
      handshakeTimeoutMs: 15_000,
    },
    desktopProviderProcessFactory(endpoint),
  );
}
