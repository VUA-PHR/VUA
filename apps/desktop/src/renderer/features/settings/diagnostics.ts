import { appMeta } from "../../app/app-meta.ts";
import type { StoredGoalsV1 } from "../../app/onboarding-model.ts";
import type { CheckZone, DeployerView, ZonePhase } from "../deployer/deployer-model.ts";
import type { DataSource } from "../../gateway/index.ts";

/**
 * 诊断导出(C-SETTINGS):版本化诊断包构建与下载。
 *
 * 脱敏契约(导出即承诺):
 * - 只含应用版本、数据来源、环境辖区相位/检测项 id 与状态、检测时间戳、
 *   用户目标选择;
 * - 绝不含:文件路径、检测项描述文本、素材/配方/项目内容、localStorage
 *   原文、账户与设备标识;
 * - 演进时新增 schemaVersion 并在解析侧迁移;接收方按本契约审阅。
 */

/** 单辖区诊断:相位名 + 证据时间戳 + 检测项 id/status(无描述文本) */
export interface ZoneDiagnostics {
  readonly phase: ZonePhase["kind"];
  readonly checkedAt?: string;
  readonly items?: ReadonlyArray<{ readonly id: string; readonly status: string }>;
}

export interface DiagnosticsBundleV1 {
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly app: { readonly name: string; readonly version: string };
  readonly dataSource: DataSource;
  readonly goals: StoredGoalsV1 | null;
  readonly environment: Record<CheckZone, ZoneDiagnostics>;
}

/** 相位 → 诊断:只投影 id/status/checkedAt,描述文本不进入诊断包 */
function zoneDiagnostics(phase: ZonePhase): ZoneDiagnostics {
  const evidence = phase.kind === "results" ? phase : phase.kind === "not-run" ? null : phase.last;
  return {
    phase: phase.kind,
    ...(evidence
      ? {
          checkedAt: evidence.checkedAt,
          items: evidence.items.map((item) => ({ id: item.id, status: item.status })),
        }
      : {}),
  };
}

export function buildDiagnostics(input: {
  dataSource: DataSource;
  goals: StoredGoalsV1 | null;
  deployer: DeployerView;
  now?: Date;
}): DiagnosticsBundleV1 {
  return {
    schemaVersion: 1,
    exportedAt: (input.now ?? new Date()).toISOString(),
    app: { name: appMeta.name, version: appMeta.version },
    dataSource: input.dataSource,
    goals: input.goals,
    environment: {
      play: zoneDiagnostics(input.deployer.zones.play),
      create: zoneDiagnostics(input.deployer.zones.create),
    },
  };
}

/**
 * 浏览器下载诊断包(JSON);Webview/浏览器拒绝时返回 false,由调用方诚实呈现。
 */
export function downloadDiagnostics(bundle: DiagnosticsBundleV1): boolean {
  try {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vua-diagnostics-${bundle.exportedAt.replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
