import type { WarehouseArtifactMode } from "./acquire-port.ts";
import type {
  AcquireFixtureStore,
} from "./fixture-acquire.ts";
import type {
  WarehouseCommandOutcome,
  WarehouseCommandsPort,
} from "./warehouse-commands-port.ts";
import type { ProductionTaskLink } from "./fixture-production.ts";
import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";

/**
 * Warehouse 写命令 fixture(F4-9 走查载体,仅 DEV 可达):在演示条目数据上
 * 演示 bdl-commands v0.1 的守卫语义与任务化受理——
 * - setArtifactMode:设置/清除覆盖并回读生效模式(演示为「覆盖 ?? fixture
 *   全局默认」,真实全局默认由 provider 运行时配置注入,不进 wire);
 * - generateVpm / deleteOriginals:按协议守卫同步裁决(invalid_state /
 *   no_original_material / already_generated / generated_artifact_missing /
 *   entry_not_found),受理后在任务中心出现九态任务并联动条目数据变更
 *   (fixture 即时完成演示;真实进度/回执经任务面,完成载荷由核心接线);
 * - 错误形态与 live 同构:协议稳定码原样透传,不在端口层吞掉或翻译。
 */

/** fixture 演示全局默认(真实值由 provider 运行时配置注入,不进 wire) */
const FIXTURE_GLOBAL_DEFAULT: WarehouseArtifactMode = "use_original_unitypackage";

const SETTLE_MS = 900;

function applicationError(code: string, messageKey: string): WarehouseCommandOutcome {
  return {
    ok: false,
    error: { kind: "application", code, messageKey, recoverable: true, retryable: false },
  };
}

export interface FixtureWarehouseCommandsOptions {
  /** 任务中心联动(演示任务九态呈现);未注入时只做数据变更不建任务 */
  readonly taskLink?: ProductionTaskLink;
}

export function createFixtureWarehouseCommands(
  store: AcquireFixtureStore,
  options: FixtureWarehouseCommandsOptions = {},
): WarehouseCommandsPort {
  const { taskLink } = options;
  const taskTitles = fixtureStrings.tasks;

  const linkTask = (taskId: string, title: string): void => {
    taskLink?.upsertTask({
      id: taskId,
      title,
      status: "running",
      originPage: "warehouse",
      cancellable: false,
    });
  };
  const completeTask = (taskId: string): void => {
    taskLink?.patchTask(taskId, { status: "completed", cancellable: false });
  };

  return {
    setArtifactMode: (warehouseItemId, mode) => {
      const entry = store.entry(warehouseItemId);
      if (entry === null) {
        return Promise.resolve(applicationError(
          "vua.warehouse.entry_not_found",
          "errors.warehouse.entryNotFound",
        ));
      }
      // 演示语义:生效模式 = 覆盖 ?? fixture 全局默认(真实解析在服务端读回)
      const effective = mode ?? FIXTURE_GLOBAL_DEFAULT;
      store.setMode(warehouseItemId, mode);
      return Promise.resolve({
        ok: true,
        result: { warehouseItemId, effectiveMode: effective },
      });
    },

    generateVpm: (warehouseItemId) => {
      const entry = store.entry(warehouseItemId);
      if (entry === null) {
        return Promise.resolve(applicationError(
          "vua.warehouse.entry_not_found",
          "errors.warehouse.entryNotFound",
        ));
      }
      if (entry.effectiveArtifactMode !== "generate_vpm") {
        return Promise.resolve(applicationError(
          "vua.warehouse.invalid_state",
          "errors.warehouse.invalidState",
        ));
      }
      if (!entry.artifacts.some((artifact) => artifact.role === "original")) {
        return Promise.resolve(applicationError(
          "vua.warehouse.no_original_material",
          "errors.warehouse.noOriginalMaterial",
        ));
      }
      if (entry.artifacts.some((artifact) => artifact.role === "generated_vpm")) {
        return Promise.resolve(applicationError(
          "vua.warehouse.already_generated",
          "errors.warehouse.alreadyGenerated",
        ));
      }
      const taskId = `task-wh-gen-${warehouseItemId}`;
      const correlationId = `corr-${taskId}`;
      linkTask(taskId, taskTitles.generateVpm.title);
      setTimeout(() => {
        store.addGeneratedVpm(warehouseItemId);
        completeTask(taskId);
      }, SETTLE_MS);
      return Promise.resolve({ ok: true, accepted: { taskId, correlationId } });
    },

    deleteOriginals: (warehouseItemId) => {
      const entry = store.entry(warehouseItemId);
      if (entry === null) {
        return Promise.resolve(applicationError(
          "vua.warehouse.entry_not_found",
          "errors.warehouse.entryNotFound",
        ));
      }
      if (entry.effectiveArtifactMode !== "generate_vpm") {
        return Promise.resolve(applicationError(
          "vua.warehouse.invalid_state",
          "errors.warehouse.invalidState",
        ));
      }
      if (!entry.artifacts.some((artifact) => artifact.role === "generated_vpm")) {
        return Promise.resolve(applicationError(
          "vua.warehouse.generated_artifact_missing",
          "errors.warehouse.generatedArtifactMissing",
        ));
      }
      const taskId = `task-wh-del-${warehouseItemId}`;
      const correlationId = `corr-${taskId}`;
      linkTask(taskId, taskTitles.deleteOriginals.title);
      setTimeout(() => {
        store.removeOriginals(warehouseItemId);
        completeTask(taskId);
      }, SETTLE_MS);
      return Promise.resolve({ ok: true, accepted: { taskId, correlationId } });
    },

    capability: () => Promise.resolve({ state: "ready" }),
  };
}
