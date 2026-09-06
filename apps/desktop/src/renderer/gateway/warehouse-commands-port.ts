import type { WarehouseArtifactMode } from "./acquire-port.ts";
import type { CapabilityReport } from "./types.ts";

/**
 * Warehouse 写命令窄端口(F4-9;bdl-commands v0.1 冻结业务词表的渲染层面)。
 *
 * 定位(proposal 005 两端登记后的表现层切口):
 * - acquire-port 保持只读(C-ACQUIRE 纪律);本端口只承载三条写命令,
 *   语义与守卫事实归 AMF(服务端事实永不是客户端断言);
 * - setArtifactMode 同步受理即结果:effectiveMode 是服务端读回的查询期
 *   事实(override ?? 全局默认),端口不本地推导、不回显请求值;
 * - generateVpm / deleteOriginals 任务化:受理 = 九态任务出现在任务中心,
 *   进度/回执走全局任务面;完成载荷经任务面投递(通道由核心 provider-host
 *   接线),本端口只呈现受理事实;
 * - 全局默认产物模式是 provider 运行时配置(VUA_WAREHOUSE_DEFAULT_MODE),
 *   不进 wire:渲染层不提供全局默认的写入口,"跟随全局"是只读语义;
 * - 错误词表 = 协议稳定错误码(vua.warehouse.*,docs/protocols/
 *   bdl-commands-v0.1_ZH)原样透传,本地化与重试判定引用 code 与
 *   recoverable/retryable 原值,不在端口层翻译或吞掉。
 */

export interface WarehouseModeSetResult {
  readonly warehouseItemId: string;
  readonly effectiveMode: WarehouseArtifactMode;
}

export interface WarehouseMaintenanceAcceptance {
  readonly taskId: string;
  readonly correlationId: string;
}

export type WarehouseCommandOutcome =
  | { readonly ok: true; readonly result: WarehouseModeSetResult }
  | { readonly ok: true; readonly accepted: WarehouseMaintenanceAcceptance }
  | {
      readonly ok: false;
      /** 协议稳定码(vua.warehouse.*)或传输面三态,原样透传 */
      readonly error:
        | { readonly kind: "unavailable" }
        | { readonly kind: "request_rejected" }
        | {
            readonly kind: "application";
            readonly code: string;
            readonly messageKey: string;
            readonly recoverable: boolean;
            readonly retryable: boolean;
          };
    };

export interface WarehouseCommandsPort {
  /**
   * 设置或清除条目级产物模式覆盖(mode = null 清除,回落「覆盖 ?? 全局
   * 默认」动态解析);同步受理,effectiveMode 为服务端读回事实。
   */
  setArtifactMode(
    warehouseItemId: string,
    mode: WarehouseArtifactMode | null,
  ): Promise<WarehouseCommandOutcome>;
  /** 为条目从 original 角色副本生成本地 VPM 包(任务化受理) */
  generateVpm(warehouseItemId: string): Promise<WarehouseCommandOutcome>;
  /**
   * 受守卫删除条目的原始素材(审计性破坏操作;生效模式必须是
   * generate_vpm 且生成副本在场,守卫在服务端)
   */
  deleteOriginals(warehouseItemId: string): Promise<WarehouseCommandOutcome>;
  capability(): Promise<CapabilityReport>;
}
