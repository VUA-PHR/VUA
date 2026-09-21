import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import type { PlanListEntryV02, RecordListEntryV02 } from "@vua/contracts";
import { useGateway, useTaskCenter } from "../../gateway/index.ts";
import {
  productionChainRecordSeenAction,
  useProductionChain,
} from "../../app/production-chain-store.ts";
import { chainRecordsForPlan, planRowsForDisplay } from "../compose/production-chain-model.ts";
import { ChainTaskLine } from "../compose/ProductionChainSection.tsx";
import { format, formatDateTime, strings } from "../../i18n/index.ts";
import type { PageId } from "../../app/nav-model.ts";
import { taskNeedsDecision } from "./production-chain-status-model.ts";

const copy = strings.workshop.chain;
/** 词面复用纪律:解析/计划/装配/记录卡与任务行同义词条与发起面(生产链段)
 *  单一来源,状态面不自造第二套词(029 A6;#44×U16 词面纪律)。 */
const chainWords = strings.compose.chain;

/**
 * 车间执行状态面(proposal 029 A6,切片二;设计标准 0.7.16 §8.5):
 * 车间只作状态显示——呈现当前执行链的 解析 → 计划 → 装配 → 记录 各卡,
 * 与发起面(配方页选中态生产链段)消费同一容器层 store 与 Gateway 端口、
 * 同一任务中心权威快照;本面零发起动作(计划批准与组装发起在配方页完成),
 * 只保留读取类刷新。链身份来自 029 A4 选择/保存事实源动作;本会话无链身份
 * 时呈现诚实空态——「前往配方页」系纯导航(023 投影纪律:零记录身份跨页,
 * 车间页自取权威事实)。恢复决策不在本面:任务需要处理时指路任务中心
 * (A6 核对点④;taskNeedsDecision 派生)。
 */
export function ProductionChainStatusSection({
  onNavigate,
}: {
  /** 纯导航回调(空链 CTA 去配方页);不携带任何记录身份(023) */
  onNavigate?: ((target: PageId) => void) | undefined;
}) {
  const chain = useProductionChain();
  const gateway = useGateway();
  const taskCenter = useTaskCenter();

  // 计划/记录是查询结果缓存(UI-02:缓存只是已取得事实的副本),按需拉取
  const [plans, setPlans] = useState<readonly PlanListEntryV02[] | null>(null);
  const [plansFailed, setPlansFailed] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [records, setRecords] = useState<readonly RecordListEntryV02[] | null>(null);
  const [recordsFailed, setRecordsFailed] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const refreshPlans = useCallback(() => {
    const recipeId = chain.recipe?.recipeId;
    if (recipeId === undefined) return;
    setPlansLoading(true);
    setPlansFailed(false);
    void gateway.productionChain
      .listPlans({ recipeId })
      .then((result) => {
        // null = 提供方响应不可解释/不可用:如实失败态,不折叠为空列表
        setPlans(result === null ? [] : planRowsForDisplay(result.entries));
        setPlansFailed(result === null);
      })
      .catch(() => setPlansFailed(true))
      .finally(() => setPlansLoading(false));
  }, [gateway, chain.recipe?.recipeId]);

  const refreshRecords = useCallback(() => {
    const recipeId = chain.recipe?.recipeId;
    const executed = chain.execute;
    if (recipeId === undefined || executed.kind !== "accepted") return;
    setRecordsLoading(true);
    setRecordsFailed(false);
    void gateway.productionChain
      .listRecords({ recipeId })
      .then((result) => {
        if (result === null) {
          // 失败≠空:如实失败态(UI-08 不得把失败当作空列表)
          setRecords([]);
          setRecordsFailed(true);
          return;
        }
        // AC-13:记录按本链执行计划身份匹配呈现
        const mine = chainRecordsForPlan(result.entries, executed.planId);
        setRecords(mine);
        // 本链发现的记录身份登记(幂等;与发起面同一事实登记,供跨 UI 消费)
        if (mine[0] !== undefined) productionChainRecordSeenAction(mine[0].buildId);
      })
      .catch(() => setRecordsFailed(true))
      .finally(() => setRecordsLoading(false));
  }, [gateway, chain.recipe?.recipeId, chain.execute]);

  // 链身份在场即按需查询一次计划(此后手动刷新;不轮询不猜测)
  useEffect(() => {
    if (chain.recipe !== null) refreshPlans();
  }, [chain.recipe, refreshPlans]);

  // 装配已受理后自动查询一次记录(AC-13;此后手动刷新)
  useEffect(() => {
    if (chain.execute.kind === "accepted") refreshRecords();
  }, [chain.execute.kind, refreshRecords]);

  if (chain.recipe === null) {
    return (
      <Card>
        <EmptyState title={copy.noChainTitle} description={copy.noChainDesc} />
        <div className="vua-page__actions">
          <Button variant="primary" onClick={() => onNavigate?.("recipe")}>
            {copy.noChainCta}
          </Button>
        </div>
      </Card>
    );
  }

  const executed = chain.execute.kind === "accepted" ? chain.execute : null;
  const executedTask =
    executed !== null
      ? taskCenter.tasks.find((item) => item.id === executed.taskId)
      : undefined;

  return (
    <Card>
      <div className="vua-page__stack">
        <section>
          <h3 className="vua-warehouse-detail__section-title">{copy.title}</h3>
          <p className="vua-caption vua-text-secondary" role="status">
            {format(chainWords.recipeLine, {
              recipeId: chain.recipe.recipeId,
              revision: String(chain.recipe.revision),
            })}
          </p>
          <p className="vua-caption vua-text-secondary">
            {chain.resolve.kind === "idle"
              ? copy.resolveIdleNote
              : chain.resolve.kind === "requesting"
                ? chainWords.resolveRequesting
                : chain.resolve.kind === "failed"
                  ? chainWords.resolveFailedNote
                  : null}
          </p>
          {chain.resolve.kind === "accepted" ? (
            <ChainTaskLine
              taskId={chain.resolve.taskId}
              missingNote={chainWords.taskMissingNote}
            />
          ) : null}
        </section>

        <section>
          <h3 className="vua-warehouse-detail__section-title">{chainWords.planTitle}</h3>
          <div className="vua-project-compat__row">
            <Button variant="default" disabled={plansLoading} onClick={refreshPlans}>
              {plansLoading ? chainWords.planLoading : chainWords.planRefreshCta}
            </Button>
          </div>
          <p className="vua-caption vua-text-secondary">{copy.planApprovalNote}</p>
          {plansFailed ? (
            <p className="vua-caption vua-text-secondary" role="alert">
              {chainWords.planFailedNote}
            </p>
          ) : null}
          {plans !== null && plans.length === 0 ? (
            <EmptyState title={chainWords.planEmptyTitle} description={chainWords.planEmptyDesc} />
          ) : null}
          {plans !== null && plans.length > 0 ? (
            <ul className="vua-project-compat__specs">
              {plans.map((plan) => (
                <li key={plan.planId}>
                  <span title={plan.planId}>
                    {format(chainWords.planLine, { planId: plan.planId })}
                  </span>{" "}
                  <Badge tone={plan.status === "approved" ? "success" : "neutral"}>
                    {chainWords.planStatus[plan.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <h3 className="vua-warehouse-detail__section-title">{chainWords.executeTitle}</h3>
          {chain.execute.kind === "idle" ? (
            <p className="vua-caption vua-text-secondary">{copy.executeIdleNote}</p>
          ) : null}
          {chain.execute.kind === "requesting" ? (
            <p className="vua-caption vua-text-secondary" role="status">
              {chainWords.executeRequesting}
            </p>
          ) : null}
          {executed !== null ? (
            <>
              <ChainTaskLine
                taskId={executed.taskId}
                missingNote={chainWords.taskMissingNote}
              />
              {executedTask !== undefined && taskNeedsDecision(executedTask.status) ? (
                <p className="vua-caption vua-text-secondary" role="alert">
                  {copy.taskDecisionNote}
                </p>
              ) : null}
            </>
          ) : null}
          {chain.execute.kind === "failed" ? (
            <p className="vua-caption vua-text-secondary" role="alert">
              {chainWords.executeFailedNote}
            </p>
          ) : null}
        </section>

        <section>
          <h3 className="vua-warehouse-detail__section-title">{chainWords.recordTitle}</h3>
          <div className="vua-project-compat__row">
            <Button
              variant="default"
              disabled={executed === null || recordsLoading}
              onClick={refreshRecords}
            >
              {recordsLoading ? chainWords.recordLoading : chainWords.recordCta}
            </Button>
          </div>
          {executed === null ? (
            <p className="vua-caption vua-text-secondary">{chainWords.recordPendingNote}</p>
          ) : null}
          {recordsFailed ? (
            <p className="vua-caption vua-text-secondary" role="alert">
              {chainWords.recordFailedNote}
            </p>
          ) : null}
          {records !== null && records.length === 0 ? (
            <EmptyState
              title={chainWords.recordEmptyTitle}
              description={chainWords.recordEmptyDesc}
            />
          ) : null}
          {records !== null && records.length > 0 ? (
            <ul className="vua-project-compat__specs">
              {records.map((record) => (
                <li key={record.buildId}>
                  <span title={record.buildId}>
                    {format(chainWords.recordLine, {
                      buildId: record.buildId,
                      status: record.status,
                      at: formatDateTime(record.finishedAt),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </Card>
  );
}
