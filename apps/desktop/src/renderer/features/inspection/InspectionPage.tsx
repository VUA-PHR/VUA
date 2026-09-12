import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { format, strings } from "../../i18n/index.ts";
import { useGateway } from "../../gateway/index.ts";
import type {
  InspectionDetailView,
  InspectionListView,
} from "./inspection-port.ts";
import {
  detailViewKind,
  evidenceDetailModel,
  listEntryModel,
  listViewKind,
  type EvidenceDetailModel,
  type InspectionStatusTone,
  type ListEntryView,
} from "./inspection-model.ts";
import "./inspection.css";

/**
 * 检查页(BG-15 骨架＋M7 检查切片消费批;设计标准 §8.6「Inspection 以报告、
 * 证据和下一步为主,明确区分本地估算与官方结论」):
 * - 信息架构三区:报告(选中证据束的聚合结论＋五维投影)、证据(检查证据链,
 *   inspection.list 摘要行,最新在前)、下一步(行动引导);
 * - 数据源 = gateway.inspection 读面端口(inspection.get/list verbatim 透传);
 *   三态诚实:未接线(not-connected)/空(尚无证据)/有内容——空态即终态,
 *   不以演示替代(UI-08);读取失败如实呈现可重试,不折叠为空态;
 * - 本地估算与官方结论之分:basis 呈现逐维标注(bridge_local_estimate=
 *   本地估算非官方等级);official_sdk_rating 是保留值,交接切片落地前
 *   不渲染为官方结论(016 §3),若出现按保留值标注呈现;
 * - 运行入口缺席如实说明:检查运行需要 Unity 场景内 Avatar 对象身份
 *   (avatarGlobalObjectId),桌面无该事实源——不渲染死按钮(UI-08),
 *   入口随对象选择面接入后开放。
 */
const copy = strings.inspection;

/** 模型基调 → Badge tone(muted=缺席灰阶,以 neutral 呈现,§6.1 异常才红) */
function badgeTone(tone: InspectionStatusTone): "neutral" | "warning" | "error" {
  switch (tone) {
    case "error":
      return "error";
    case "amber":
      return "warning";
    case "neutral":
    case "muted":
      return "neutral";
  }
}

function DetailReport({ detail }: { detail: EvidenceDetailModel }) {
  return (
    <div className="vua-page__stack">
      <div className="vua-inspection__statusline" role="status">
        <span className="vua-caption vua-text-secondary">{copy.overallLabel}</span>
        <Badge tone={badgeTone(detail.overallTone)}>
          {copy.overall[detail.overallStatusRaw as keyof typeof copy.overall]
            ?? detail.overallStatusRaw}
        </Badge>
        <span className="vua-caption vua-text-secondary">
          {format(copy.bridgeLine, { version: detail.editorVersion, count: String(detail.operationCount) })}
        </span>
      </div>
      <section>
        <h4 className="vua-caption vua-text-secondary">{copy.dimensionsLabel}</h4>
        {detail.dimensions.length === 0 ? (
          <p className="vua-caption vua-text-secondary">{copy.emptyDimensionsNote}</p>
        ) : (
          <ul className="vua-inspection__dimensions">
            {detail.dimensions.map((dimension) => (
              <li key={`${dimension.kindRaw}`} className="vua-inspection__dimension">
                <span>{copy.dimensions[dimension.kindRaw as keyof typeof copy.dimensions]
                  ?? dimension.kindRaw}</span>
                <Badge tone={badgeTone(dimension.tone)}>
                  {copy.dimensionStatus[dimension.statusRaw as keyof typeof copy.dimensionStatus]
                    ?? dimension.statusRaw}
                </Badge>
                <span className="vua-caption vua-text-secondary">
                  {copy.basis[dimension.basisRaw as keyof typeof copy.basis] ?? dimension.basisRaw}
                </span>
                {dimension.checks.length > 0 && (
                  <ul className="vua-inspection__checks">
                    {dimension.checks.map((check) => (
                      <li key={`${check.code}`} className="vua-inspection__check">
                        <Badge tone={badgeTone(check.severity === "error"
                          ? "error"
                          : check.severity === "warning" ? "amber" : "neutral")}>
                          {copy.checkSeverity[check.severity as keyof typeof copy.checkSeverity]
                            ?? check.severity}
                        </Badge>
                        <span>{check.message}</span>
                        <code className="vua-caption vua-text-secondary">{check.code}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {detail.notes !== null && (
        <p className="vua-caption vua-text-secondary">{detail.notes}</p>
      )}
    </div>
  );
}

export function InspectionPage() {
  const gateway = useGateway();
  const [listView, setListView] = useState<InspectionListView | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<InspectionDetailView | null>(null);
  const [detailFailed, setDetailFailed] = useState(false);

  const loadList = useCallback(async () => {
    setListFailed(false);
    try {
      setListView(await gateway.inspection.list());
    } catch {
      // 读取失败如实呈现(非空态):保留可重试入口,不折叠为缺席
      setListFailed(true);
    }
  }, [gateway]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId === null) {
      setDetailView(null);
      return;
    }
    let cancelled = false;
    setDetailFailed(false);
    gateway.inspection.get(selectedId)
      .then((view) => {
        if (!cancelled) setDetailView(view);
      })
      .catch(() => {
        if (!cancelled) setDetailFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [gateway, selectedId]);

  const entries: readonly ListEntryView[] = listView?.kind === "available"
    ? listView.entries.map(listEntryModel)
    : [];
  const listKind = listView === null ? "loading" : listViewKind(listView);
  const detailKind = detailView === null ? "loading" : detailViewKind(detailView);
  // 选中项仍在列表中时保持选中;否则回落首条(数据变化后的确定性呈现)
  const effectiveSelectedId = selectedId !== null
    && entries.some((entry) => entry.inspectionId === selectedId)
    ? selectedId
    : entries[0]?.inspectionId ?? null;
  const detail = detailView?.kind === "available" ? evidenceDetailModel(detailView.document) : null;

  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{strings.nav.pages.inspectionPage}</h1>
        <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>
      </section>

      <div className="vua-inspection__columns">
        <Card>
          <div className="vua-page__stack">
            <section>
              <h3 className="vua-warehouse-detail__section-title">{copy.reportTitle}</h3>
              {detailFailed && <p className="vua-caption vua-text-secondary">{copy.loadFailedNote}</p>}
              {detailKind === "loading" && effectiveSelectedId !== null && (
                <Skeleton width="70%" />
              )}
              {detailKind === "not-connected" && (
                <EmptyState title={copy.emptyTitle} description={copy.emptyDesc} />
              )}
              {detailKind === "missing" && (
                <p className="vua-caption vua-text-secondary">{copy.detailMissingNote}</p>
              )}
              {detail !== null && <DetailReport detail={detail} />}
            </section>
          </div>
        </Card>

        <Card>
          <div className="vua-page__stack">
            <section>
              <h3 className="vua-warehouse-detail__section-title">{copy.evidenceTitle}</h3>
              {listFailed && <p className="vua-caption vua-text-secondary">{copy.loadFailedNote}</p>}
              {listKind === "loading" && <Skeleton width="60%" />}
              {listKind === "not-connected" && (
                <p className="vua-caption vua-text-secondary">{copy.evidenceEmptyNote}</p>
              )}
              {listKind === "empty" && (
                <EmptyState title={copy.listEmptyTitle} description={copy.listEmptyDesc} />
              )}
              {listKind === "ready" && (
                <ul className="vua-inspection__entries">
                  {entries.map((entry) => (
                    <li key={entry.inspectionId}>
                      <button
                        type="button"
                        className="vua-inspection__entry"
                        data-selected={entry.inspectionId === effectiveSelectedId}
                        onClick={() => setSelectedId(entry.inspectionId)}
                      >
                        <span>{entry.avatarLabel}</span>
                        <Badge tone={badgeTone(entry.overallTone)}>
                          {copy.overall[entry.overallStatusRaw as keyof typeof copy.overall]
                            ?? entry.overallStatusRaw}
                        </Badge>
                        <span className="vua-caption vua-text-secondary">{entry.performedAt}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="vua-warehouse-detail__section-title">{copy.nextTitle}</h3>
              <p className="vua-caption vua-text-secondary">{copy.localVsOfficialNote}</p>
              <p className="vua-caption vua-text-secondary">{copy.runUnavailableNote}</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
