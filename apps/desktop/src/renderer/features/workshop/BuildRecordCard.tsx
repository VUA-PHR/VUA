import { Badge } from "../../components/primitives/Badge.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { format, strings } from "../../i18n/index.ts";
import {
  projectBuildRecordDisplayStatus,
  type BuildRecordDisplayStatus,
} from "../../gateway/index.ts";
import type { BuildRecord } from "../../gateway/index.ts";

const copy = strings.productionFlow.record;
const stageCopy = strings.workflowStage;

/** 结果徽标色调(§7.3):中止/成功/回滚成功为辖区橙,回滚失败为红(阻断) */
function statusTone(status: BuildRecordDisplayStatus): "brand" | "error" {
  return status === "rollback_failed" ? "error" : "brand";
}

/**
 * Build Record 卡(v0.2 evidenceSummary 投影):快照 attempted/succeeded、
 * Bridge jobsRun/allSucceeded/lastOperation 小字、本地 VPM attempted/published、
 * 验证 status。未尝试的节以 null 锚如实呈现;packageId 保留字段不做链接
 * (Release 详情链接属后续切片)。
 */
export function BuildRecordCard({ record }: { record: BuildRecord }) {
  const displayStatus = projectBuildRecordDisplayStatus(
    record.status,
    record.restoreAttempted,
    record.restoreSucceeded,
  );
  const evidence = record.evidenceSummary;
  const outcome = (value: boolean | null): string =>
    value === true ? copy.evidence.success : value === false ? copy.evidence.failed : copy.evidence.outcomeUnknown;

  const snapshotLine = evidence.snapshot.attempted
    ? `${copy.evidence.attempted} · ${outcome(evidence.snapshot.succeeded)}`
    : copy.evidence.notAttempted;
  const bridgeLine = `${format(copy.evidence.jobsLine, { count: evidence.bridge.jobsRun })} · ${
    evidence.bridge.allSucceeded === true
      ? copy.evidence.allSucceeded
      : evidence.bridge.allSucceeded === false
        ? copy.evidence.notAllSucceeded
        : copy.evidence.outcomeUnknown
  }`;
  const localVpmLine = evidence.localVpm.attempted
    ? evidence.localVpm.published === true
      ? copy.evidence.published
      : evidence.localVpm.published === false
        ? copy.evidence.notPublished
        : copy.evidence.outcomeUnknown
    : copy.evidence.notAttempted;
  const rows: ReadonlyArray<{ key: string; label: string; line: string; note: string | null }> = [
    { key: "snapshot", label: copy.evidence.snapshot, line: snapshotLine, note: null },
    {
      key: "bridge",
      label: copy.evidence.bridge,
      line: bridgeLine,
      note: evidence.bridge.lastOperation,
    },
    {
      key: "localVpm",
      label: copy.evidence.localVpm,
      line: localVpmLine,
      note:
        evidence.localVpm.attempted && evidence.localVpm.packageId !== null
          ? format(copy.evidence.packageId, { packageId: evidence.localVpm.packageId })
          : null,
    },
    {
      key: "validation",
      label: copy.evidence.validation,
      line: copy.evidence.validationStatus[evidence.validation.status],
      note: null,
    },
  ];
  return (
    <Card className="vua-flow__card">
      <div className="vua-flow__card-head">
        <h3 className="vua-title">{copy.title}</h3>
        <Badge tone={statusTone(displayStatus)}>
          {copy.status[displayStatus]}
        </Badge>
        {/* W24 recovered 呈现语义:B 权威态 recovered(恢复突变成功后重新
            完成)在显示投影中折叠为 completed(裁定投影),此处叠加语义
            标注让用户能区分恢复后运行与普通完成——语义标注不改变投影 */}
        {record.status === "recovered" ? (
          <Badge tone="neutral">{copy.recovered_badge}</Badge>
        ) : null}
      </div>
      {record.status === "recovered" ? (
        <p className="vua-caption vua-text-secondary" role="note">
          {copy.recovered_note}
        </p>
      ) : null}
      <section>
        <h4 className="vua-caption vua-text-secondary">{copy.stagesTitle}</h4>
        <ol className="vua-flow__stages">
          {record.stages.map((stage, index) => (
            <li key={index}>
              <span className="vua-flow__stage-name">{stageCopy[stage]}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h4 className="vua-caption vua-text-secondary">{copy.factsTitle}</h4>
        <dl className="vua-flow__facts">
          {rows.map((row) => (
            <div key={row.key} className="vua-flow__fact">
              <dt className="vua-caption vua-text-secondary">{row.label}</dt>
              <dd>
                {row.line}
                {row.note !== null ? (
                  <span className="vua-caption vua-text-secondary"> — {row.note}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="vua-caption vua-text-secondary">
        {format(copy.finishedAt, { time: record.finishedAt })}
      </p>
    </Card>
  );
}
