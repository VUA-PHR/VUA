import { useState } from "react";
import { Card } from "../../components/primitives/Card.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { strings } from "../../i18n/index.ts";
import { recoverDecisionKinds, type RecoverDecisionKind } from "../../gateway/index.ts";
import type { ActionAvailability } from "./production-flow-model.ts";

const copy = strings.productionFlow.recover;

/**
 * 恢复卡(F3,草案恢复纪律):continue / rollback 选择(说明对象、范围、后果)
 * + DelayedButton;恢复是任务不是瞬间动作——执行中(recovering)如实呈现
 * 进行中说明,动作禁用。回滚为高影响操作,延迟确认强制先读说明。
 */
export function RecoverCard({
  availability,
  recovering,
  primary,
  busy,
  onRecover,
}: {
  availability: ActionAvailability;
  /** phase === "recovering":恢复任务进行中 */
  recovering: boolean;
  primary: boolean;
  busy: boolean;
  onRecover: (decision: RecoverDecisionKind) => void;
}) {
  const [decision, setDecision] = useState<RecoverDecisionKind>("continue");
  const notes: Record<RecoverDecisionKind, string> = {
    continue: copy.continueNote,
    rollback: copy.rollbackNote,
  };
  return (
    <Card className="vua-flow__card">
      <div className="vua-flow__card-head">
        <h3 className="vua-title">{copy.title}</h3>
      </div>
      <p className="vua-caption vua-text-secondary">{copy.body}</p>
      <div className="vua-flow__choices" role="group" aria-label={copy.decisionAria}>
        {recoverDecisionKinds.map((kind) => (
          <button
            key={kind}
            type="button"
            className="vua-flow__choice"
            aria-pressed={decision === kind}
            disabled={recovering || busy}
            onClick={() => setDecision(kind)}
          >
            <span className="vua-flow__choice-label">{copy.decision[kind]}</span>
            <span className="vua-caption vua-text-secondary">{notes[kind]}</span>
          </button>
        ))}
      </div>
      {recovering ? (
        <p className="vua-caption vua-text-secondary">{copy.runningNote}</p>
      ) : (
        <div className="vua-flow__actions">
          <DelayedButton
            variant={primary ? "primary" : "default"}
            disabled={busy || !availability.enabled}
            onClick={() => onRecover(decision)}
          >
            {copy.confirm}
          </DelayedButton>
          {!availability.enabled ? (
            <p className="vua-caption vua-text-secondary">
              {strings.productionFlow.disabledReasons[availability.reason]}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
