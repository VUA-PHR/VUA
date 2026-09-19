import { useState } from "react";
import { Button } from "../../components/primitives/Button.tsx";
import { format, strings } from "../../i18n/index.ts";
import {
  allFixtureSelection,
  allLiveSelection,
  devPortIds,
  devTargetButtonDisabled,
  readDevPortSelection,
  writeDevPortSelection,
  type DevPortId,
  fixtureTierOptions,
  type DevPortSelection,
  type DevPortSelectionState,
  type DevPortTarget,
} from "../../app/dev-port-selection.ts";

/**
 * 开发模式区(018 批 1,裁决 13 备稿授权):per-port 连接目标选择——
 * 仅 DEV 构建渲染(生产构建零存在,leak 指纹扩展覆盖);变更即整页重载
 * (照 DevScenarioBar 切换先例,装配点在 createGatewayState)。任一端口
 * fixture=「演示数据」徽标恒显(原则①聚合语义);开发模式是连接目标
 * 选择器,不是「让一切变绿」的开关。
 * W25 走查 D-B 修复(2026-09-20):切换按钮禁用判定经
 * devTargetButtonDisabled(按钮只在目标态已达成时禁用)——此前两按钮
 * 共用 target === "live" 禁用表达式,live 基线下双双不可点,per-port
 * 演示切换被锁死;fixture 档位-only 变更亦因空 targets 整键移除而
 * 不落盘(恒回 demo-mixed),两根因分别在 dev-port-selection 与此修复。
 */
const copy = strings.dev;

const portLabels: Record<DevPortId, string> = {
  environment: copy.portEnvironment,
  tutorial: copy.portTutorial,
  modelProduction: copy.portModelProduction,
  toolCatalog: copy.portToolCatalog,
  task: copy.portTask,
  settings: copy.portSettings,
  acquire: copy.portAcquire,
  warehouseCommands: copy.portWarehouseCommands,
  projectOps: copy.portProjectOps,
  packages: copy.portPackages,
};

export function DevModeSection() {
  const [state, setState] = useState<DevPortSelectionState>(() => readDevPortSelection());
  const selection = state.targets;
  const setFixtureTier = (tier: DevPortSelectionState["fixtureTier"]) => {
    const next: DevPortSelectionState = { ...state, fixtureTier: tier };
    setState(next);
    writeDevPortSelection(next);
    // 装配点在 Gateway 装配(createGatewayState):整页重载生效
    window.location.reload();
  };

  const setTarget = (port: DevPortId, target: DevPortTarget) => {
    const next: DevPortSelectionState = {
      targets: { ...state.targets },
      fixtureTier: state.fixtureTier,
    };
    if (target === "live") delete next.targets[port];
    else next.targets[port] = target;
    setState(next);
    writeDevPortSelection(next);
    // 装配点在 Gateway 装配(createGatewayState):整页重载生效
    window.location.reload();
  };

  const applyPreset = (preset: DevPortSelection) => {
    const next: DevPortSelectionState = {
      targets: { ...preset },
      fixtureTier: state.fixtureTier,
    };
    setState(next);
    writeDevPortSelection(next);
    // 装配点在 Gateway 装配(createGatewayState):整页重载生效
    window.location.reload();
  };

  return (
    <div className="vua-page__stack">
      <p className="vua-caption vua-text-secondary">{copy.devModeDesc}</p>
      <div className="vua-project-compat__row" role="group" aria-label={copy.presetsLabel}>
        <Button variant="subtle" onClick={() => applyPreset(allLiveSelection())}>
          {copy.presetAllLive}
        </Button>
        <Button variant="subtle" onClick={() => applyPreset(allFixtureSelection())}>
          {copy.presetAllFixture}
        </Button>
      </div>
      <div className="vua-project-compat__row">
        <label>
          <span className="vua-caption vua-text-secondary">{copy.fixtureTierLabel}</span>{" "}
          <select
            value={state.fixtureTier}
            aria-label={copy.fixtureTierLabel}
            onChange={(event) => setFixtureTier(event.target.value as DevPortSelectionState["fixtureTier"])}
          >
            {fixtureTierOptions.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul className="vua-project-compat__specs">
        {devPortIds.map((port) => {
          const target: DevPortTarget = state.targets[port] === "fixture" ? "fixture" : "live";
          return (
            <li key={port}>
              <strong>{portLabels[port]}</strong>{" "}
              <Button
                variant={target === "fixture" ? "subtle" : "default"}
                disabled={devTargetButtonDisabled(target, "fixture")}
                onClick={() => setTarget(port, "fixture")}
              >
                {copy.targetFixture}
              </Button>{" "}
              <Button
                variant={target === "live" ? "subtle" : "default"}
                disabled={devTargetButtonDisabled(target, "live")}
                onClick={() => setTarget(port, "live")}
              >
                {copy.targetLiveReset}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="vua-caption vua-text-secondary">
        {format(copy.devModeReloadNote, { count: String(Object.keys(state.targets).length) })}
      </p>
    </div>
  );
}
