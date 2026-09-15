import type { EnvironmentPort } from "./environment-port.ts";
import type { ModelProductionPort } from "./model-production-port.ts";
import type { AcquirePort } from "./acquire-port.ts";
import type { PackagesPort } from "./packages-port.ts";
import type { SettingsPort } from "./settings-port.ts";
import type { TaskPort } from "./task-port.ts";
import type { ToolCatalogPort } from "./tool-catalog-port.ts";
import type { TutorialPort } from "./tutorial-port.ts";
import type { WarehouseCommandsPort } from "./warehouse-commands-port.ts";
import type { ProjectOpsPort } from "./project-ops-port.ts";
import type { ProductionChainPort } from "./production-chain-port.ts";
import type { InspectionPort } from "../features/inspection/inspection-port.ts";
import type { ReleaseHandoffPort } from "../features/release/release-handoff-port.ts";
import type { DataSource } from "./types.ts";

/**
 * VuaGateway(G3):九个领域窄端口的组合,表现层唯一的取数与意图入口。
 * 端口按领域划分(M0),不按 React 页面划分;实现可整体替换
 * (fixture / not-run / 未来 Tauri live),页面零重写。
 */
export interface VuaGateway {
  readonly environment: EnvironmentPort;
  readonly tutorial: TutorialPort;
  readonly modelProduction: ModelProductionPort;
  readonly toolCatalog: ToolCatalogPort;
  readonly task: TaskPort;
  readonly settings: SettingsPort;
  readonly acquire: AcquirePort;
  /** F4-9:warehouse 写命令面(bdl-commands v0.1;acquire 读取面保持只读) */
  readonly warehouseCommands: WarehouseCommandsPort;
  /** F6/014:项目操作写面(project.import-copy 副本导入确认链) */
  readonly projectOps: ProjectOpsPort;
  /** 019 批 C:生产链共享端口(解析/计划/任务/记录;两套 UI 共用) */
  readonly productionChain: ProductionChainPort;
  /** M7 检查切片消费批:检查读面端口(inspection.get/list;016 仲裁
   *  独立词表行) */
  readonly inspection: InspectionPort;
  /** M7 消费切片:release.openForHandoff 交接命令端口(023 词表行;
   *  实现域未接线=诚实缺席语义) */
  readonly releaseHandoff: ReleaseHandoffPort;
  readonly packages: PackagesPort;
  /** 数据来源标识:驱动"演示数据"徽标(原则①) */
  dataSource(): DataSource;
}
