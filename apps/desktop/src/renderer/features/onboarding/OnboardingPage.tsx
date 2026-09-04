import { useState } from "react";
import type { EnvGoalId, GoalId } from "../../app/onboarding-model.ts";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Icon } from "@vua/design-system";
import { format, strings, termLabel } from "../../i18n/index.ts";
import "./onboarding.css";

const copy = strings.onboarding;

/** 目标展示顺序 = 顶部 Tab 从左到右顺序(v0.3.3 §2.1/§2.2) */
const goalOrder: readonly GoalId[] = ["env", "guide", "production", "tools"];

/** 新玩家推荐目标(§4.3:推荐项紫色描边 + 说明推荐原因) */
const recommendedGoals: readonly GoalId[] = ["env", "guide"];

const envOrder: readonly EnvGoalId[] = ["play", "create"];

export interface OnboardingResult {
  status: "completed" | "skipped";
  goals: GoalId[];
  environments: EnvGoalId[];
}

function goalTitle(goal: GoalId): string {
  return copy.goals[goal].title;
}

function goalDescription(goal: GoalId): string {
  // 术语不进入翻译流程:文案中的 {recipe} 由术语表展开(i18n 预备规则④)
  return format(copy.goals[goal].description, { recipe: termLabel("recipe") });
}

/**
 * 首次目标引导(美术方案 v0.3.3 §2.2,三步):
 * ① 四类目标复选(可暂时跳过)→ ② 仅勾选环境部署时细化游玩/生产环境
 * → ③ 确认已选目标、将进行的检测与不会进行的操作。
 * 视觉:宽松低密度;推荐项紫色描边;底部固定"返回 / 继续"(§4.3)。
 * 本组件只做选择,不做检测;确认后由 App 壳持久化并进入第一个已选目标。
 */
export function OnboardingPage({
  onComplete,
  initialGoals = [],
  initialEnvs = [],
}: {
  onComplete: (result: OnboardingResult) => void;
  /** 目标重选时带入当前选择(设置·目标重选:确认后才生效) */
  initialGoals?: readonly GoalId[];
  initialEnvs?: readonly EnvGoalId[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goals, setGoals] = useState<readonly GoalId[]>(initialGoals);
  const [envs, setEnvs] = useState<readonly EnvGoalId[]>(initialEnvs);

  const envSelected = goals.includes("env");

  function toggleGoal(goal: GoalId) {
    const next = goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal];
    setGoals(next);
    // 取消环境部署时同时清空环境子目标,旧选择不得继续生效
    if (!next.includes("env")) setEnvs([]);
  }

  function toggleEnv(env: EnvGoalId) {
    setEnvs(envs.includes(env) ? envs.filter((e) => e !== env) : [...envs, env]);
  }

  function goForward() {
    if (step === 1) {
      setStep(envSelected ? 2 : 3);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    onComplete({ status: "completed", goals: [...goals], environments: [...envs] });
  }

  function goBack() {
    if (step === 3) {
      setStep(envSelected ? 2 : 1);
      return;
    }
    if (step === 2) setStep(1);
  }

  const canContinue = step === 1 ? goals.length > 0 : step === 2 ? envs.length > 0 : true;
  const blockerHint = step === 1 ? copy.goalRequired : step === 2 ? copy.envRequired : null;

  /* 步骤指示(v0.3.3 §2.5):环境细化仅在勾选环境部署时出现(§2.2),
   * 未勾选时序列收缩为两步,计数同步 */
  type StepId = keyof typeof copy.steps & ("goals" | "environments" | "confirm");
  const stepIds: readonly StepId[] = envSelected
    ? ["goals", "environments", "confirm"]
    : ["goals", "confirm"];
  const currentStepId: StepId = step === 1 ? "goals" : step === 2 ? "environments" : "confirm";
  const currentStepIndex = stepIds.indexOf(currentStepId);

  return (
    <div className="vua-onboarding">
      <div className="vua-onboarding__panel">
        <nav className="vua-onboarding__steps" aria-label={copy.steps.aria}>
          <ol className="vua-onboarding__steps-list">
            {stepIds.map((id, index) => {
              const state =
                index < currentStepIndex
                  ? "done"
                  : index === currentStepIndex
                    ? "current"
                    : "pending";
              return (
                <li
                  key={id}
                  className="vua-onboarding__step"
                  data-state={state}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span className="vua-onboarding__step-marker" aria-hidden="true">
                    {state === "done" ? <Icon name="check" size={16} /> : index + 1}
                  </span>
                  <span className="vua-onboarding__step-label">{copy.steps[id]}</span>
                </li>
              );
            })}
          </ol>
          <span className="vua-caption vua-text-secondary">
            {format(copy.steps.counter, {
              current: currentStepIndex + 1,
              total: stepIds.length,
            })}
          </span>
        </nav>
        <header className="vua-onboarding__header">
          <h1 className="vua-display">
            {step === 1 ? copy.step1Title : step === 2 ? copy.step2Title : copy.step3Title}
          </h1>
          {step === 1 ? (
            <p className="vua-text-secondary">{copy.step1Description}</p>
          ) : step === 2 ? (
            <p className="vua-text-secondary">{copy.step2Description}</p>
          ) : null}
        </header>

        {step === 1 ? (
          <div className="vua-onboarding__grid" role="group" aria-label={copy.step1Title}>
            {goalOrder.map((goal) => {
              const selected = goals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  className="vua-onboarding__option"
                  data-selected={selected || undefined}
                  data-recommended={recommendedGoals.includes(goal) || undefined}
                  aria-pressed={selected}
                  onClick={() => toggleGoal(goal)}
                >
                  <span className="vua-onboarding__option-head">
                    <span className="vua-title">{goalTitle(goal)}</span>
                    {recommendedGoals.includes(goal) ? (
                      <Badge tone="brand">{copy.recommended}</Badge>
                    ) : null}
                    <span className="vua-onboarding__check" aria-hidden="true">
                      {selected ? <Icon name="check" size={16} /> : null}
                    </span>
                  </span>
                  <span className="vua-onboarding__option-desc">{goalDescription(goal)}</span>
                  <span className="vua-caption vua-text-secondary">{copy.goals[goal].impact}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="vua-onboarding__grid" role="group" aria-label={copy.step2Title}>
            {envOrder.map((env) => {
              const selected = envs.includes(env);
              return (
                <button
                  key={env}
                  type="button"
                  className="vua-onboarding__option"
                  data-selected={selected || undefined}
                  aria-pressed={selected}
                  onClick={() => toggleEnv(env)}
                >
                  <span className="vua-onboarding__option-head">
                    <span className="vua-title">{copy.environments[env].title}</span>
                    <span className="vua-onboarding__check" aria-hidden="true">
                      {selected ? <Icon name="check" size={16} /> : null}
                    </span>
                  </span>
                  <span className="vua-onboarding__option-desc">
                    {copy.environments[env].description}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="vua-onboarding__summary">
            <section className="vua-onboarding__summary-section">
              <h2 className="vua-title">{copy.selectedGoals}</h2>
              <ul className="vua-onboarding__summary-list">
                {goalOrder.filter((goal) => goals.includes(goal)).map((goal) => (
                  <li key={goal}>
                    {goalTitle(goal)}
                    {goal === "env" && envs.length > 0 ? (
                      <span className="vua-text-secondary">
                        {" "}
                        · {envOrder.filter((e) => envs.includes(e)).map((e) => copy.environments[e].title).join(" · ")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
            <section className="vua-onboarding__summary-section">
              <h2 className="vua-title">{copy.willCheck}</h2>
              <p className="vua-text-secondary">{copy.willCheckItems}</p>
            </section>
            <section className="vua-onboarding__summary-section">
              <h2 className="vua-title">{copy.wontDo}</h2>
              <p className="vua-text-secondary">{copy.wontDoItems}</p>
            </section>
          </div>
        ) : null}

        <footer className="vua-onboarding__footer">
          {step === 1 ? (
            <Button variant="subtle" onClick={() => onComplete({ status: "skipped", goals: [], environments: [] })}>
              {copy.skip}
            </Button>
          ) : (
            <Button variant="subtle" onClick={goBack}>
              {copy.back}
            </Button>
          )}
          <span className="vua-onboarding__footer-right">
            {!canContinue && blockerHint ? (
              <span className="vua-caption vua-text-secondary">{blockerHint}</span>
            ) : null}
            <Button variant="primary" disabled={!canContinue} onClick={goForward}>
              {step === 3 ? copy.confirm : copy.continue}
            </Button>
          </span>
        </footer>
      </div>
    </div>
  );
}
