import { useEffect, useState, type ComponentType } from "react";
import { useComposeDraft } from "./compose-draft-store.ts";
import { Button } from "../components/primitives/Button.tsx";
import { Card } from "../components/primitives/Card.tsx";
import { EmptyState } from "../components/primitives/EmptyState.tsx";
import { Badge } from "../components/primitives/Badge.tsx";
import { format, strings } from "../i18n/index.ts";
import { uiSwitchSummary } from "./ui-switch-summary.ts";
import {
  resolveForestVariant,
  forestVariantEntries,
  type ForestUiRootProps,
  type ForestVariantDiscovery,
} from "./ui-variant-discovery.ts";

/**
 * 森林绿变体根接线(019 批 D D-2,UI-05/UI-08/AC-12):
 * - absent(干净检出/变体未就绪):诚实不可用呈现——字段保留＋共享草稿
 *   只读摘要＋返回现有界面入口(迁移退路);数据全部来自共享容器草稿
 *   store,不发明内容。
 * - present:加载构建期发现的入口模块;成功渲染变体根,失败如实呈现
 *   失败态(不静默回退、不把失败当不可用、不重试非幂等加载以外的猜测)。
 * 共享容器(GatewayProvider/事件/状态)在本组件之外存活——仅 UI 树替换,
 * 切换不重建 Gateway、不触碰端口订阅(UI-01)。
 */

/** 森林绿不可用根(批 D 前置形态,D-2 起作为 absent 分支保留):
 * 019 UI-05/AC-09——目标 UI 不可用时以只读摘要呈现共享草稿并提供
 * 返回入口,不静默丢字段、不清空草稿。 */
function ForestUnavailableRoot({ onBackToCurrent }: { onBackToCurrent: () => void }) {
  const summary = uiSwitchSummary(useComposeDraft());
  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{strings.dev.uiForestLabel}</h1>
      </section>
      <Card>
        <EmptyState
          title={strings.dev.uiForestUnavailable}
          description={strings.dev.uiForestUnavailableDesc}
          action={
            <Button variant="primary" onClick={onBackToCurrent}>
              {strings.dev.uiBackToCurrentCta}
            </Button>
          }
        />
      </Card>
      {summary.hasDraft ? (
        <Card>
          <div className="vua-page__stack">
            <h3 className="vua-warehouse-detail__section-title">
              {strings.dev.uiSwitchSummaryTitle}
            </h3>
            <p className="vua-caption vua-text-secondary">{strings.dev.uiSwitchSummaryNote}</p>
            <ul className="vua-project-compat__specs">
              {summary.items.map((item) => (
                <li key={item.warehouseItemId}>
                  <strong>{item.title}</strong>
                  {item.nameHint !== null ? (
                    <span className="vua-caption vua-text-secondary">
                      {" "}
                      {format(strings.dev.uiSwitchSummaryHintLine, { hint: item.nameHint })}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {summary.dirty ? (
              <p className="vua-caption vua-text-secondary" role="status">
                {strings.dev.uiSwitchSummaryDirty}
              </p>
            ) : null}
            {summary.saved !== null ? (
              <p className="vua-caption vua-text-secondary" role="status">
                {format(strings.dev.uiSwitchSummarySaved, {
                  revision: String(summary.saved.revision),
                })}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

type VariantLoadPhase =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "ready"; Root: ComponentType<ForestUiRootProps> };

/** present 分支的加载状态机:mount 即加载;成功落 ready,失败落 failed。
 * 卸载后不再写状态(取消标志),不因竞态回写。 */
function useVariantLoad(discovery: Extract<ForestVariantDiscovery, { status: "present" }>) {
  const [phase, setPhase] = useState<VariantLoadPhase>({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: "loading" });
    discovery
      .load()
      .then((mod) => {
        if (!cancelled) setPhase({ kind: "ready", Root: mod.ForestUiRoot });
      })
      .catch((error: unknown) => {
        // 失败如实呈现:细节进控制台诊断,界面呈现受控失败态(UI-06/UI-08)
        console.error("[forest-variant] entry module failed to load", error);
        if (!cancelled) setPhase({ kind: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [discovery]);
  return phase;
}

export function ForestVariantRoot({
  discovery = resolveForestVariant(forestVariantEntries),
  onBackToCurrent,
}: {
  /** 发现结果注入点:默认取构建期 glob;测试/走查可注入 */
  discovery?: ForestVariantDiscovery;
  onBackToCurrent: () => void;
}) {
  if (discovery.status === "absent") {
    return <ForestUnavailableRoot onBackToCurrent={onBackToCurrent} />;
  }
  return <PresentRoot discovery={discovery} onBackToCurrent={onBackToCurrent} />;
}

function PresentRoot({
  discovery,
  onBackToCurrent,
}: {
  discovery: Extract<ForestVariantDiscovery, { status: "present" }>;
  onBackToCurrent: () => void;
}) {
  const phase = useVariantLoad(discovery);
  if (phase.kind === "loading") {
    return (
      <div className="vua-page">
        <section className="vua-page__hero">
          <h1 className="vua-title">{strings.dev.uiForestLabel}</h1>
        </section>
        <Card>
          <EmptyState
            title={strings.dev.uiForestLabel}
            description={strings.dev.uiForestLoading}
          />
        </Card>
      </div>
    );
  }
  if (phase.kind === "failed") {
    return (
      <div className="vua-page">
        <section className="vua-page__hero">
          <h1 className="vua-title">{strings.dev.uiForestLabel}</h1>
        </section>
        <Card>
          <EmptyState
            title={strings.dev.uiForestLoadFailed}
            description={strings.dev.uiForestLoadFailedDesc}
            action={
              <Button variant="primary" onClick={onBackToCurrent}>
                {strings.dev.uiBackToCurrentCta}
              </Button>
            }
          />
        </Card>
      </div>
    );
  }
  const Root = phase.Root;
  return <Root onBackToCurrent={onBackToCurrent} />;
}

/** 开发设置页的可用性徽标事实:发现为 absent 时如实标注(AC-12)。 */
export function ForestAvailabilityBadge({ available }: { available: boolean }) {
  if (available) return null;
  return <Badge tone="neutral">{strings.dev.uiForestUnavailable}</Badge>;
}
