import { emptyGateway } from "./empty-gateway.ts";
import { fixtureGateway } from "./fixture-gateway.ts";
import type { VuaGateway } from "./gateway.ts";
import { readStoredScenario, resolveScenarioName, type ScenarioName } from "../app/resolve-scenario.ts";
import type { StoredGoalsV1 } from "../app/onboarding-model.ts";

/**
 * Gateway 装配(原则①硬防线):
 * - 生产构建:import.meta.env.DEV 恒 false,无条件 emptyGateway(not-run)。
 *   Desktop Gateway v1(app.snapshot)尚未覆盖八领域端口,各端口呈现诚实
 *   not-run 状态;fixture-gateway 模块在此分支不可达,被 Rollup 剔除
 *   (check-leak 验证)。AMF 契约切片接入后,此处装配经 window.vua.gateway
 *   的 Electron live 实现,页面零重写;
 * - 开发构建:?scenario= 或 DevScenarioBar(sessionStorage)选择 fixture。
 */
export function createGatewayState(
  initialGoals: StoredGoalsV1 | null,
): { gateway: VuaGateway; name: ScenarioName } {
  if (!import.meta.env.DEV) {
    return { gateway: emptyGateway(initialGoals), name: "not-run" };
  }
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("scenario") ?? readStoredScenario();
  const name = resolveScenarioName(true, requested);
  return {
    gateway: name === "not-run" ? emptyGateway(initialGoals) : fixtureGateway(name, initialGoals),
    name,
  };
}
