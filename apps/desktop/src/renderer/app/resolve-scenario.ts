/**
 * Scenario 解析规则(P1 硬防线,纯函数可测):
 * - 生产构建(envDev=false):无条件返回 "not-run",忽略一切外部输入;
 * - 开发构建:合法 fixture 名则用之,显式 "not-run" 可预览诚实空态,其余回退默认 fixture。
 */

import { storageKeys } from "./storage-keys.ts";

export const fixtureNames = [
  "demo-mixed",
  "demo-all-green",
  "demo-workshop",
  "demo-workshop-warning",
  "demo-workshop-blocked",
  "demo-workshop-recover",
  "demo-tasks",
  "demo-env-fresh",
  "demo-env-fail",
  "demo-acquire-scan",
  "demo-packages",
  "production-inspect",
  "production-plan",
  "production-running",
  "production-success",
  "production-cancelled",
  "production-drifted",
  "production-expired",
  "production-rollback",
] as const;

export type FixtureName = (typeof fixtureNames)[number];

export type ScenarioName = FixtureName | "not-run";

export function resolveScenarioName(envDev: boolean, requested: string | null): ScenarioName {
  if (!envDev) return "not-run";
  if (requested === "not-run") return "not-run";
  if (requested && (fixtureNames as readonly string[]).includes(requested)) {
    return requested as FixtureName;
  }
  return "demo-mixed";
}

/** DevScenarioBar 的会话内选择(sessionStorage;仅本次会话生效) */
export function readStoredScenario(): string | null {
  try {
    return sessionStorage.getItem(storageKeys.scenario);
  } catch {
    return null;
  }
}
