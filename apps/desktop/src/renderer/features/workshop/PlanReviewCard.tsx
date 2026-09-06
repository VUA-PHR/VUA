import { useEffect, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { Icon } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type { PlanRiskChoice, ProductionPlan } from "../../gateway/index.ts";
import type { ActionAvailability } from "./production-flow-model.ts";

const copy = strings.productionFlow.plan;
const stageCopy = strings.workflowStage;

/** 需要用户决策时呈现的三个动作项;not_required 由应用层在无决策需求时使用 */
const ACTIONABLE_RISK_CHOICES: readonly PlanRiskChoice[] = [
  "snapshot_and_continue",
  "continue",
  "cancel",
];

/**
 * 计划审阅卡(F3;amf-production v0.2 文档面):
 * - 阶段列表(工作流阶段词表)、风险(带 recoverable/retryable 标注)/预估、
 *   计划 vs 检查的结构化差异;
 * - 风险决策控件(v0.2 新 UI 义务):riskDecisionRequired 时以三动作项
 *   呈现(默认先快照再继续;cancel 即不执行),rememberForSession 可选勾选;
 *   未要求时如实说明并以 not_required 提交(应用层拒绝该项决策);
 * - 确认绑定 revision:DelayedButton 强制停顿,确认后计划变化即过期;
 * - 过期态如实呈现(expired notice),不自动重新确认,恢复走 RecoverCard。
 */
export function PlanReviewCard({
  plan,
  loading,
  expired,
  availability,
  primary,
  busy,
  onConfirm,
}: {
  plan: ProductionPlan | null;
  loading: boolean;
  /** phase === "expired":确认已失效,显示提示而非确认钮 */
  expired: boolean;
  availability: ActionAvailability;
  primary: boolean;
  busy: boolean;
  onConfirm: (riskChoice: PlanRiskChoice, rememberForSession: boolean) => void;
}) {
  const [riskChoice, setRiskChoice] = useState<PlanRiskChoice>("snapshot_and_continue");
  const [remember, setRemember] = useState(false);

  // 计划变化(重新生成/修订递增)即重置决策,旧选择不得静默带入新计划
  useEffect(() => {
    setRiskChoice("snapshot_and_continue");
    setRemember(false);
  }, [plan?.planId, plan?.revision]);

  return (
    <Card className="vua-flow__card">
      <div className="vua-flow__card-head">
        <h3 className="vua-title">{copy.title}</h3>
        {plan !== null ? (
          <Badge tone="neutral">{format(copy.revisionLine, { revision: plan.revision })}</Badge>
        ) : null}
      </div>
      {loading || plan === null ? (
        <div className="vua-flow__skeleton" aria-busy="true">
          <Skeleton height={16} />
          <Skeleton height={16} width="76%" />
          <Skeleton height={16} width="60%" />
          <p className="vua-caption vua-text-secondary">{copy.loadingBody}</p>
        </div>
      ) : (
        <>
          <section>
            <h4 className="vua-caption vua-text-secondary">{copy.stagesTitle}</h4>
            <ol className="vua-flow__stages">
              {plan.stages.map((stage) => (
                <li key={stage}>
                  <span className="vua-flow__stage-name">{stageCopy[stage]}</span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h4 className="vua-caption vua-text-secondary">{copy.risksTitle}</h4>
            {plan.risks.length === 0 ? (
              <p className="vua-caption vua-text-secondary">{copy.noRisks}</p>
            ) : (
              <ul className="vua-flow__findings">
                {plan.risks.map((risk, index) => (
                  <li key={index} className="vua-flow__finding">
                    <span className="vua-flow__finding-text">{risk.summary}</span>
                    {risk.recoverable ? (
                      <Badge tone="neutral">{strings.productionFlow.inspection.recoverable}</Badge>
                    ) : null}
                    {risk.retryable ? (
                      <Badge tone="neutral">{strings.productionFlow.inspection.retryable}</Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="vua-caption vua-text-secondary">
              {plan.estimatedDurationMs === null
                ? copy.estimateUnknown
                : format(copy.estimate, { minutes: Math.round(plan.estimatedDurationMs / 60000) })}
            </p>
          </section>
          {plan.diffs.length > 0 ? (
            <section>
              <h4 className="vua-caption vua-text-secondary">{copy.diffsTitle}</h4>
              <ul className="vua-flow__findings">
                {plan.diffs.map((diff) => (
                  <li key={diff.id} className="vua-flow__finding">
                    <Badge tone={diff.kind === "resolved" ? "brand" : "neutral"}>
                      {copy.diffKind[diff.kind]}
                    </Badge>
                    <span className="vua-flow__finding-text">{diff.summary}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {plan.riskDecisionRequired ? (
            <section>
              <h4 className="vua-caption vua-text-secondary">{copy.riskDecisionTitle}</h4>
              <div
                className="vua-flow__choices"
                role="group"
                aria-label={copy.riskDecisionAria}
              >
                {ACTIONABLE_RISK_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className="vua-flow__choice"
                    aria-pressed={riskChoice === choice}
                    disabled={busy}
                    onClick={() => setRiskChoice(choice)}
                  >
                    <span className="vua-flow__choice-label">{copy.riskChoice[choice]}</span>
                    <span className="vua-caption vua-text-secondary">
                      {copy.riskChoiceNote[choice]}
                    </span>
                  </button>
                ))}
              </div>
              <label className="vua-settings-check">
                <input
                  type="checkbox"
                  checked={remember}
                  aria-label={copy.rememberForSessionAria}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>{copy.rememberForSession}</span>
              </label>
            </section>
          ) : (
            <p className="vua-caption vua-text-secondary">{copy.noRiskDecisionNotice}</p>
          )}
          {expired ? (
            <div className="vua-flow__notice" role="note">
              <Icon name="warning" size={16} />
              <div>
                <p className="vua-flow__notice-title">{copy.expiredTitle}</p>
                <p className="vua-caption vua-text-secondary">{copy.expiredBody}</p>
              </div>
            </div>
          ) : (
            <div className="vua-flow__actions">
              <DelayedButton
                variant={primary ? "primary" : "default"}
                disabled={busy || !availability.enabled}
                onClick={() => {
                  // 未要求风险决策的计划以 not_required 提交(应用层词表)
                  onConfirm(
                    plan.riskDecisionRequired ? riskChoice : "not_required",
                    remember,
                  );
                }}
              >
                {copy.confirm}
              </DelayedButton>
              <p className="vua-caption vua-text-secondary">
                {format(copy.confirmHint, { revision: plan.revision })}
              </p>
              {!availability.enabled ? (
                <p className="vua-caption vua-text-secondary">
                  {strings.productionFlow.disabledReasons[availability.reason]}
                </p>
              ) : null}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
