import { Badge } from "../../components/primitives/Badge.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { Icon } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type { ProductionPlan } from "../../gateway/index.ts";
import type { ActionAvailability } from "./production-flow-model.ts";

const copy = strings.productionFlow.plan;
const stageCopy = strings.workflowStage;

/**
 * 计划审阅卡(F3,草案确认纪律):
 * - 阶段列表(引用工作流阶段词表文案)、风险/预估、计划 vs 检查的结构化差异;
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
  onConfirm: () => void;
}) {
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
                <li key={stage.id}>
                  <span className="vua-flow__stage-name">{stageCopy[stage.stage]}</span>
                  <span className="vua-caption vua-text-secondary">{stage.summary}</span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h4 className="vua-caption vua-text-secondary">{copy.risksTitle}</h4>
            {plan.risks.length === 0 ? (
              <p className="vua-caption vua-text-secondary">{copy.noRisks}</p>
            ) : (
              <ul className="vua-flow__plain-list">
                {plan.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
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
                onClick={onConfirm}
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
