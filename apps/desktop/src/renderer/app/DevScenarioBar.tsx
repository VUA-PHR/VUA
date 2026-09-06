import { useState } from "react";
import { strings } from "../i18n/index.ts";
import type { ScenarioName } from "./resolve-scenario.ts";
import { storageKeys } from "./storage-keys.ts";
import "./dev-scenario-bar.css";

const copy = strings.dev;

const options: { name: ScenarioName; label: string }[] = [
  { name: "demo-mixed", label: copy.demoMixed },
  { name: "demo-all-green", label: copy.demoAllGreen },
  { name: "demo-workshop", label: copy.demoWorkshop },
  { name: "demo-workshop-warning", label: copy.demoWorkshopWarning },
  { name: "demo-workshop-blocked", label: copy.demoWorkshopBlocked },
  { name: "demo-workshop-recover", label: copy.demoWorkshopRecover },
  { name: "demo-tasks", label: copy.demoTasks },
  { name: "demo-env-fresh", label: copy.demoEnvFresh },
  { name: "demo-env-fail", label: copy.demoEnvFail },
  { name: "demo-acquire-empty", label: copy.demoAcquireEmpty },
  { name: "demo-packages", label: copy.demoPackages },
  { name: "production-inspect", label: copy.productionInspect },
  { name: "production-plan", label: copy.productionPlan },
  { name: "production-running", label: copy.productionRunning },
  { name: "production-success", label: copy.productionSuccess },
  { name: "production-cancelled", label: copy.productionCancelled },
  { name: "production-drifted", label: copy.productionDrifted },
  { name: "production-expired", label: copy.productionExpired },
  { name: "production-rollback", label: copy.productionRollback },
  { name: "not-run", label: copy.notRun },
];

const storageKey = storageKeys.scenario;

/**
 * 开发期场景切换条:仅 DEV 构建渲染(App.tsx 中以 import.meta.env.DEV 守卫,
 * 生产构建会被 Tree-shaking 剔除)。切换即整页重载,由 gateway/create.ts
 * 的 DEV 分支按新选择装配 fixture Gateway。
 */
export function DevScenarioBar({ active }: { active: ScenarioName }) {
  const [last, setLast] = useState(active);
  // 走查#1:默认收起为 DEV 小标签,展开后才显示场景列表——避免遮挡底部任务中心
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="vua-dev-bar" role="group" aria-label={copy.aria} data-expanded={expanded || undefined}>
      <button
        type="button"
        className="vua-dev-bar__toggle"
        aria-expanded={expanded}
        aria-label={expanded ? copy.collapseAria : copy.expandAria}
        title={active}
        onClick={() => setExpanded((value) => !value)}
      >
        {copy.tag}
      </button>
      {expanded
        ? options.map((option) => (
            <button
              key={option.name}
              type="button"
              className="vua-dev-bar__option"
              aria-pressed={last === option.name}
              onClick={() => {
                setLast(option.name);
                try {
                  sessionStorage.setItem(storageKey, option.name);
                } catch {
                  /* sessionStorage 不可用时仅本次生效 */
                }
                window.location.reload();
              }}
            >
              {option.label}
            </button>
          ))
        : null}
    </div>
  );
}
