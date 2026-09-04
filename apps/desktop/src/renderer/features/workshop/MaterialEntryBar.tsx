import { useState } from "react";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { Badge } from "../../components/primitives/Badge.tsx";
import { format, strings } from "../../i18n/index.ts";
import { sourceIntakes, type MaterialRef, type SourceIntake } from "../../gateway/index.ts";
import type { ActionAvailability } from "./production-flow-model.ts";

const copy = strings.productionFlow.material;

/**
 * 素材入口条(F3):双素材入口选择(direct_unity_package / local_reusable_vpm)+
 * 选择文件按钮 + 开始检查。文件选择在 fixture 下模拟返回合成 MaterialRef;
 * 生产 capability 非 ready 时整条不渲染(由 Section 的 hidden 态保证,§2.6)。
 * 开始检查的关键动作禁用时给出可发现原因(§5)。
 */
export function MaterialEntryBar({
  material,
  availability,
  primary,
  busy,
  onPick,
  onStart,
}: {
  /** 已选素材;null = 尚未选择 */
  material: MaterialRef | null;
  availability: ActionAvailability;
  primary: boolean;
  busy: boolean;
  onPick: (intake: SourceIntake) => void;
  onStart: () => void;
}) {
  const [intake, setIntake] = useState<SourceIntake>("direct_unity_package");
  const startReason = !availability.enabled
    ? strings.productionFlow.disabledReasons[availability.reason]
    : material === null
      ? copy.pickFirst
      : null;
  return (
    <Card className="vua-flow__card">
      <div className="vua-flow__card-head">
        <h3 className="vua-title">{copy.title}</h3>
        {material !== null ? (
          <Badge tone="brand">{copy.intake[material.intake]}</Badge>
        ) : null}
      </div>
      <div className="vua-flow__choices" role="group" aria-label={copy.intakeAria}>
        {sourceIntakes.map((value) => (
          <button
            key={value}
            type="button"
            className="vua-flow__choice"
            aria-pressed={intake === value}
            onClick={() => setIntake(value)}
          >
            <span className="vua-flow__choice-label">{copy.intake[value]}</span>
            <span className="vua-caption vua-text-secondary">{copy.intakeNote[value]}</span>
          </button>
        ))}
      </div>
      {material !== null ? (
        <p className="vua-caption vua-text-secondary">
          {format(copy.pickedLine, { name: material.displayName })}
        </p>
      ) : null}
      <div className="vua-flow__actions">
        <Button variant="default" disabled={busy} onClick={() => onPick(intake)}>
          {copy.pick}
        </Button>
        <Button
          variant={primary ? "primary" : "default"}
          disabled={busy || startReason !== null}
          onClick={onStart}
        >
          {copy.start}
        </Button>
      </div>
      <p className="vua-caption vua-text-secondary">{copy.startHint}</p>
      {startReason !== null ? (
        <p className="vua-caption vua-text-secondary">{startReason}</p>
      ) : null}
    </Card>
  );
}
