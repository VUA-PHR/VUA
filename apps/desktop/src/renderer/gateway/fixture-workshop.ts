import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type { WorkshopTape, WorkshopView } from "../features/workshop/track-model.ts";
import type { FixtureName } from "../app/resolve-scenario.ts";

/**
 * 车间回放带 fixture(C-WORKSHOP,仅 DEV 可达):
 * 录制事件流驱动轨道的四盘演示带——成功 / 警告(检查点确认)/ 阻断 / 恢复;
 * 空态由 idle 场景承载,加载态由场景切换时的 Gateway 首帧骨架承载,
 * 合共覆盖六态。日志与操作数文案集中在 strings.fixtures.zh-CN.ts。
 */

function buildTapes(): Record<"success" | "warning" | "blocked" | "recover", WorkshopTape> {
  const copy = fixtureStrings.workshop.tapes;
  return {
    success: {
      schemaVersion: 1,
      durationMs: 16000,
      events: [
        { at: 0, kind: "stage", stage: "warehouse", state: "completed" },
        { at: 0, kind: "stage", stage: "recipe", state: "completed" },
        { at: 0, kind: "stage", stage: "assembly", state: "current" },
        { at: 1000, kind: "log", text: copy.success.snapshot },
        { at: 2500, kind: "stat", operations: 12 },
        { at: 2500, kind: "log", text: copy.success.imported },
        { at: 4500, kind: "stage", stage: "assembly", state: "completed" },
        { at: 4500, kind: "stage", stage: "production", state: "current" },
        { at: 7000, kind: "stat", operations: 42 },
        { at: 7000, kind: "log", text: copy.success.rigged },
        { at: 9000, kind: "log", text: copy.success.menu },
        { at: 11000, kind: "stage", stage: "production", state: "completed" },
        { at: 11000, kind: "stage", stage: "inspection", state: "current" },
        { at: 13500, kind: "log", text: copy.success.inspected },
        { at: 15000, kind: "stage", stage: "inspection", state: "completed" },
      ],
    },
    warning: {
      schemaVersion: 1,
      durationMs: 10000,
      events: [
        { at: 0, kind: "stage", stage: "warehouse", state: "completed" },
        { at: 0, kind: "stage", stage: "recipe", state: "completed" },
        { at: 0, kind: "stage", stage: "assembly", state: "current" },
        { at: 1500, kind: "log", text: copy.warning.imported },
        { at: 3500, kind: "stage", stage: "assembly", state: "completed" },
        { at: 3500, kind: "stage", stage: "production", state: "current" },
        { at: 5500, kind: "stat", operations: 18 },
        { at: 5500, kind: "log", text: copy.warning.rigged },
        { at: 7500, kind: "log", text: copy.warning.checkpoint },
        { at: 7500, kind: "stage", stage: "production", state: "needsConfirmation" },
      ],
    },
    blocked: {
      schemaVersion: 1,
      durationMs: 8000,
      events: [
        { at: 0, kind: "stage", stage: "warehouse", state: "completed" },
        { at: 0, kind: "stage", stage: "recipe", state: "completed" },
        { at: 0, kind: "stage", stage: "assembly", state: "current" },
        { at: 1500, kind: "log", text: copy.blocked.imported },
        { at: 3000, kind: "stat", operations: 5 },
        { at: 3500, kind: "stage", stage: "assembly", state: "completed" },
        { at: 3500, kind: "stage", stage: "production", state: "current" },
        { at: 5500, kind: "log", text: copy.blocked.missing },
        { at: 5500, kind: "stage", stage: "production", state: "blocked" },
      ],
    },
    recover: {
      schemaVersion: 1,
      durationMs: 16000,
      events: [
        { at: 0, kind: "stage", stage: "warehouse", state: "completed" },
        { at: 0, kind: "stage", stage: "recipe", state: "completed" },
        { at: 0, kind: "stage", stage: "assembly", state: "current" },
        { at: 1500, kind: "stage", stage: "assembly", state: "completed" },
        { at: 1500, kind: "stage", stage: "production", state: "current" },
        { at: 3500, kind: "log", text: copy.recover.failed },
        { at: 3500, kind: "stage", stage: "production", state: "blocked" },
        { at: 5500, kind: "log", text: copy.recover.restored },
        { at: 5500, kind: "stage", stage: "production", state: "pending" },
        { at: 7500, kind: "stage", stage: "production", state: "current" },
        { at: 9500, kind: "stat", operations: 42 },
        { at: 9500, kind: "log", text: copy.recover.retried },
        { at: 11500, kind: "stage", stage: "production", state: "completed" },
        { at: 11500, kind: "stage", stage: "inspection", state: "current" },
        { at: 13500, kind: "log", text: copy.recover.inspected },
        { at: 15000, kind: "stage", stage: "inspection", state: "completed" },
      ],
    },
  };
}

const tapes = buildTapes();

/** 回放带的车间视图;非车间场景返回 null,由调用方回落 */
export function fixtureWorkshopReplay(
  name: FixtureName,
): Extract<WorkshopView, { kind: "replay" }> | null {
  const copy = fixtureStrings.workshop.tapes;
  if (name === "demo-workshop") return { kind: "replay", headline: copy.success.headline, tape: tapes.success };
  if (name === "demo-workshop-warning") {
    return { kind: "replay", headline: copy.warning.headline, tape: tapes.warning };
  }
  if (name === "demo-workshop-blocked") {
    return { kind: "replay", headline: copy.blocked.headline, tape: tapes.blocked };
  }
  if (name === "demo-workshop-recover") {
    return { kind: "replay", headline: copy.recover.headline, tape: tapes.recover };
  }
  return null;
}
