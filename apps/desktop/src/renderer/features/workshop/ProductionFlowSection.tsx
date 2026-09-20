import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { format, strings, termLabel } from "../../i18n/index.ts";
import type {
  MaterialRef,
  PlanRiskChoice,
  ProductionRejectReason,
  RecoverDecisionKind,
  SourceIntake,
} from "../../gateway/index.ts";
import type { ProductionFlowModel } from "./production-flow-model.ts";
import { MaterialEntryBar } from "./MaterialEntryBar.tsx";
import { InspectionCard } from "./InspectionCard.tsx";
import { PlanReviewCard } from "./PlanReviewCard.tsx";
import { RecoverCard } from "./RecoverCard.tsx";
import { BuildRecordCard } from "./BuildRecordCard.tsx";

const copy = strings.productionFlow;

export type FlowPending = "pick" | "start" | "plan" | "confirm" | "recover";

/**
 * F3 生产纵向流程段(寄宿车间页;production-use-case v0.1〔M3 冻结〕+
 * 设计规范 v0.6.1 §8.5:执行/等待/恢复是 Assembly 内的任务进展,不另设阶段页)。
 *
 * 诚实状态(原则①/§6.3):
 * - hidden:production capability 未就绪或未知,整段不出现(而非禁用);
 * - empty:能力就绪但尚无运行,素材入口 + 诚实空态;
 * - 加载:检查/计划内容未回时对应卡片 Skeleton;段级读取失败走
 *   EmptyState + 重试,重试不修改任何本地数据。
 * 交互意图一律经 ModelProductionPort 提交;live 接线后只换端口实现,本段不动。
 */
export function ProductionFlowSection({
  flow,
  failed,
  pending,
  rejection,
  material,
  onRetry,
  onPickMaterial,
  onStartInspection,
  onRequestPlan,
  onConfirmPlan,
  onRecover,
}: {
  flow: ProductionFlowModel;
  /** 段级读取失败(能力/意图请求异常):EmptyState + 重试 */
  failed: boolean;
  pending: FlowPending | null;
  rejection: ProductionRejectReason | "unavailable" | null;
  material: MaterialRef | null;
  onRetry: () => void;
  onPickMaterial: (intake: SourceIntake) => void;
  onStartInspection: () => void;
  onRequestPlan: () => void;
  /** v0.2:确认携带风险决策(计划审阅控件)+ 可选的会话内记忆 */
  onConfirmPlan: (riskChoice: PlanRiskChoice, rememberForSession: boolean) => void;
  onRecover: (decision: RecoverDecisionKind) => void;
}) {
  const sectionLabel = format(copy.sectionAria, { production: termLabel("production") });
  if (failed) {
    return (
      <section className="vua-flow" aria-label={sectionLabel}>
        <Card>
          <EmptyState
            title={copy.states.loadFailedTitle}
            description={copy.states.loadFailedDescription}
            action={
              <Button variant="primary" onClick={onRetry}>
                {copy.states.retry}
              </Button>
            }
          />
        </Card>
      </section>
    );
  }
  if (flow.kind === "hidden") return null;
  const primaryAction = flow.kind === "empty" ? ("start" as const) : flow.primaryAction;
  return (
    <section className="vua-flow" aria-label={sectionLabel}>
      <div className="vua-flow__head">
        <h2 className="vua-title">{format(copy.sectionTitle, { production: termLabel("production") })}</h2>
        {flow.kind === "run" ? (
          <p className="vua-flow__phase" data-tone={flow.tone}>
            {copy.phase[flow.phase]}
          </p>
        ) : null}
      </div>
      <MaterialEntryBar
        material={material}
        availability={
          flow.kind === "empty" ? { enabled: true } : flow.actions.startInspection
        }
        primary={primaryAction === "start"}
        busy={pending !== null}
        onPick={onPickMaterial}
        onStart={onStartInspection}
      />
      {rejection !== null ? (
        <p className="vua-flow__rejection vua-caption" role="alert">
          {/* 分流(W25 实测修正):unavailable=生产能力未连接;其余按
            ProductionRejectReason 各自专用文案——unknown_material_source
            (素材登记失效)有独立文案,绝不落入「未连接」误报 */}
          {rejection === "unavailable"
            ? copy.states.actionUnavailable
            : copy.rejected[rejection]}
        </p>
      ) : null}
      {flow.kind === "empty" ? (
        <Card>
          <EmptyState title={copy.states.emptyTitle} description={copy.states.emptyDescription} />
        </Card>
      ) : (
        <>
          {flow.cards.inspection ? (
            <InspectionCard
              inspection={flow.inspection}
              loading={flow.inspectionLoading}
              availability={flow.actions.requestPlan}
              primary={primaryAction === "requestPlan"}
              busy={pending !== null}
              onRequestPlan={onRequestPlan}
            />
          ) : null}
          {flow.cards.plan ? (
            <PlanReviewCard
              plan={flow.plan}
              loading={flow.planLoading}
              expired={flow.phase === "expired"}
              availability={flow.actions.confirmPlan}
              primary={primaryAction === "confirm"}
              busy={pending !== null}
              onConfirm={onConfirmPlan}
            />
          ) : null}
          {flow.cards.recover ? (
            <RecoverCard
              availability={flow.actions.recover}
              recovering={flow.phase === "recovering"}
              primary={primaryAction === "recover"}
              busy={pending !== null}
              onRecover={onRecover}
            />
          ) : null}
          {flow.cards.buildRecord && flow.buildRecord !== null ? (
            <BuildRecordCard record={flow.buildRecord} />
          ) : null}
        </>
      )}
    </section>
  );
}
