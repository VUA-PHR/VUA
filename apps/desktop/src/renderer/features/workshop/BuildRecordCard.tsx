import { Badge } from "../../components/primitives/Badge.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { format, strings } from "../../i18n/index.ts";
import type { BuildRecord, BuildRecordStatus } from "../../gateway/index.ts";

const copy = strings.productionFlow.record;
const stageCopy = strings.workflowStage;

/** 结果徽标色调(§7.3):成功/回滚成功为辖区橙(完成),回滚失败为红(阻断) */
function statusTone(status: BuildRecordStatus): "brand" | "error" {
  return status === "rollback_failed" ? "error" : "brand";
}

/**
 * 最小 Build Record 卡(F3):结果、已执行阶段、四类证据
 * (快照/Bridge 作业/本地 VPM/验证,不透明载荷原样展示)。
 */
export function BuildRecordCard({ record }: { record: BuildRecord }) {
  const facts: ReadonlyArray<{ key: keyof typeof copy.factLabels; value: string }> = [
    { key: "snapshot", value: record.facts.snapshot },
    { key: "bridgeJob", value: record.facts.bridgeJob },
    { key: "localVpm", value: record.facts.localVpm },
    { key: "validation", value: record.facts.validation },
  ];
  return (
    <Card className="vua-flow__card">
      <div className="vua-flow__card-head">
        <h3 className="vua-title">{copy.title}</h3>
        <Badge tone={statusTone(record.status)}>{copy.status[record.status]}</Badge>
      </div>
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
          {facts.map((fact) => (
            <div key={fact.key} className="vua-flow__fact">
              <dt className="vua-caption vua-text-secondary">{copy.factLabels[fact.key]}</dt>
              <dd>{fact.value}</dd>
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
