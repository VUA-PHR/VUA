import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { strings } from "../../i18n/index.ts";
import type { InspectionReport, Plannability } from "../../gateway/index.ts";
import type { ActionAvailability } from "./production-flow-model.ts";

const copy = strings.productionFlow.inspection;

/** 可计划性结论徽标色调:not_plannable 才用红(阻断),其余橙/琥珀(§7.3) */
function plannabilityTone(value: Plannability): "brand" | "warning" | "error" {
  if (value === "plannable") return "brand";
  if (value === "needs_attention") return "warning";
  return "error";
}

/**
 * 检查结果卡(F3):证据列表(发现类型徽标 + recoverable/retryable 标注)+
 * 可计划性结论 + "生成计划"动作。检查任务进行中而结果未回时渲染 Skeleton
 * (内容布局加载,§6.3),不用骨架屏掩盖失败或等待。
 */
export function InspectionCard({
  inspection,
  loading,
  availability,
  primary,
  busy,
  onRequestPlan,
}: {
  inspection: InspectionReport | null;
  loading: boolean;
  availability: ActionAvailability;
  primary: boolean;
  busy: boolean;
  onRequestPlan: () => void;
}) {
  return (
    <Card className="vua-flow__card">
      <div className="vua-flow__card-head">
        <h3 className="vua-title">{copy.title}</h3>
        {inspection !== null ? (
          <Badge tone={plannabilityTone(inspection.plannability)}>
            {copy.plannabilityTitle}:{copy.plannability[inspection.plannability]}
          </Badge>
        ) : null}
      </div>
      {loading || inspection === null ? (
        <div className="vua-flow__skeleton" aria-busy="true">
          <Skeleton height={16} />
          <Skeleton height={16} width="82%" />
          <Skeleton height={16} width="68%" />
          <p className="vua-caption vua-text-secondary">{copy.loadingBody}</p>
        </div>
      ) : (
        <>
          <section>
            <h4 className="vua-caption vua-text-secondary">{copy.findingsTitle}</h4>
            {inspection.findings.length === 0 ? (
              <p className="vua-caption vua-text-secondary">{copy.emptyFindings}</p>
            ) : (
              <ul className="vua-flow__findings">
                {inspection.findings.map((finding) => (
                  <li key={finding.id} className="vua-flow__finding">
                    <Badge tone={finding.kind === "compat" ? "brand" : "warning"}>
                      {copy.findingKind[finding.kind]}
                    </Badge>
                    <span className="vua-flow__finding-text">{finding.summary}</span>
                    <span className="vua-flow__finding-flags">
                      {finding.recoverable ? (
                        <Badge tone="neutral">{copy.recoverable}</Badge>
                      ) : null}
                      {finding.retryable ? <Badge tone="neutral">{copy.retryable}</Badge> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="vua-flow__actions">
            <Button
              variant={primary ? "primary" : "default"}
              disabled={busy || !availability.enabled}
              onClick={onRequestPlan}
            >
              {copy.requestPlan}
            </Button>
            {!availability.enabled ? (
              <p className="vua-caption vua-text-secondary">
                {strings.productionFlow.disabledReasons[availability.reason]}
              </p>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
}
