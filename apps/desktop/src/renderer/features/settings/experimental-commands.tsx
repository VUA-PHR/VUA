import { useEffect, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import {
  useAcquireView,
  useGateway,
  type WarehouseCommandOutcome,
} from "../../gateway/index.ts";
import { strings } from "../../i18n/index.ts";
import {
  commandErrorText,
  experimentalActionGates,
  settingsEntryOptions,
  type ExperimentalGateReason,
} from "../warehouse/acquire-model.ts";

/**
 * W15 设置-实验性两级选项区(「生成 VPM 替代原始」在设置页内的发起位置):
 * - 条目选择器复用 warehouse.listEntries 只读面(AcquireView 快照推送);
 *   两个选项与仓储条目抽屉共享同一命令面(已冻结的 bdl-commands 条目级
 *   generateVpm / deleteOriginals),前置置灰是同一服务端守卫的镜像呈现,
 *   发出后守卫事实仍归服务端(协议稳定码原样映射);
 * - 诚实纪律:受理 = 引导任务中心,条目权威事实在仓储条目刷新,本区不建
 *   第二事实源;仓储未接入/空仓库渲染设计的空态,不猜测条目;
 * - 全局默认产物模式是 provider 运行时配置(不进 wire),只读行如实标注
 *   「由服务端配置,本地不读取当前值」,不虚构开关或数值。
 */

const copy = strings.settings.experimental;
const acquireCopy = strings.warehouse.acquire;

const GATE_REASON_TEXT: Record<ExperimentalGateReason, string> = {
  modeNotGenerateVpm: copy.gateModeNotGenerateVpm,
  noOriginal: copy.gateNoOriginal,
  alreadyGenerated: copy.gateAlreadyGenerated,
  noGeneratedCopy: copy.gateNoGeneratedCopy,
};

function gateReasonText(reason: ExperimentalGateReason): string {
  return GATE_REASON_TEXT[reason];
}

export function ExperimentalCommands() {
  const gateway = useGateway();
  const acquire = useAcquireView();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const entries = acquire.kind === "entries" ? acquire.entries : null;
  const options = entries === null ? [] : settingsEntryOptions(entries);
  const selected =
    selectedId === null
      ? null
      : (entries?.find((entry) => entry.warehouseItemId === selectedId) ?? null);
  const gates = selected === null ? null : experimentalActionGates(selected);

  // 选中项消失(如命令完成后他页删除)时回落到未选择,不猜测下一个
  useEffect(() => {
    if (
      selectedId !== null &&
      entries !== null &&
      !entries.some((entry) => entry.warehouseItemId === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [entries, selectedId]);

  function runCommand(run: () => Promise<WarehouseCommandOutcome>): void {
    setBusy(true);
    setFeedback(null);
    void run().then((outcome) => {
      setBusy(false);
      setFeedback(
        outcome.ok
          ? copy.acceptedNote
          : commandErrorText(outcome.error, acquireCopy.commandErrors as Record<string, string>),
      );
    });
  }

  if (entries === null) {
    return <EmptyState title={copy.entriesLabel} description={copy.warehouseNotConnected} />;
  }
  if (options.length === 0) {
    return <EmptyState title={copy.commandsTitle} description={copy.entriesEmpty} />;
  }

  return (
    <div className="vua-page__stack">
      <div className="vua-settings-row vua-settings-row--stacked">
        <label htmlFor="vua-exp-entries">{copy.entriesLabel}</label>
        <select
          id="vua-exp-entries"
          className="vua-settings-select"
          value={selectedId ?? ""}
          onChange={(event) => {
            setFeedback(null);
            setSelectedId(event.target.value === "" ? null : event.target.value);
          }}
        >
          <option value="">—</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {selected !== null ? (
          <span className="vua-caption vua-text-secondary" title={selected.folderName}>
            {selected.folderName}
          </span>
        ) : null}
      </div>

      {gates !== null ? (
        <>
          {/* 选项 1:生成 VPM 替代(前置不满足置灰 + 原因;守卫仍归服务端) */}
          <section>
            <h3 className="vua-warehouse-detail__section-title">
              {copy.generateTitle}{" "}
              <Badge tone="neutral">{copy.badge}</Badge>
            </h3>
            <p className="vua-caption vua-text-secondary">{copy.generateDesc}</p>
            {gates.generateVpm.available ? null : (
              <p className="vua-caption vua-text-secondary" role="note">
                {gateReasonText(gates.generateVpm.reason!)}
              </p>
            )}
            <Button
              variant="primary"
              disabled={busy || !gates.generateVpm.available}
              onClick={() => {
                runCommand(() => gateway.warehouseCommands.generateVpm(selected!.warehouseItemId));
              }}
            >
              {busy ? "…" : copy.generateTitle}
            </Button>
          </section>

          {/* 选项 2:生成后删除原始(审计性破坏操作:高危样式 + 延迟确认 +
              不可恢复明示,§8.1;前置不满足置灰 + 原因) */}
          <section>
            <h3 className="vua-warehouse-detail__section-title">
              {copy.deleteTitle} <Badge tone="neutral">{copy.badge}</Badge>
            </h3>
            <p className="vua-caption vua-text-secondary">{copy.deleteDesc}</p>
            <p className="vua-caption vua-text-secondary" role="note">
              {copy.deleteIrreversible}
            </p>
            {gates.deleteOriginals.available ? null : (
              <p className="vua-caption vua-text-secondary" role="note">
                {gateReasonText(gates.deleteOriginals.reason!)}
              </p>
            )}
            <DelayedButton
              variant="danger"
              delayMs={1500}
              disabled={busy || !gates.deleteOriginals.available}
              onClick={() => {
                runCommand(() =>
                  gateway.warehouseCommands.deleteOriginals(selected!.warehouseItemId),
                );
              }}
            >
              {copy.deleteTitle}
            </DelayedButton>
          </section>
        </>
      ) : null}

      {feedback !== null ? (
        <p className="vua-caption vua-text-secondary" role="status">
          {feedback}
        </p>
      ) : null}

      {/* 全局默认只读行:provider 运行时配置不进 wire,不虚构开关或当前值 */}
      <section>
        <h3 className="vua-warehouse-detail__section-title">{copy.globalDefaultTitle}</h3>
        <p className="vua-caption vua-text-secondary">{copy.globalDefaultReadonly}</p>
      </section>
    </div>
  );
}
