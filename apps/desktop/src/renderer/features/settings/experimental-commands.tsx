import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { ConfirmDialog } from "../../components/primitives/ConfirmDialog.tsx";
import { Toggle } from "../../components/primitives/Toggle.tsx";
import {
  useAcquireView,
  useGateway,
  type WarehouseArtifactMode,
  type WarehouseCommandOutcome,
} from "../../gateway/index.ts";
import { strings } from "../../i18n/index.ts";
import { useDeleteOriginalsAfterGenerate } from "../../app/delete-originals-flag.ts";
import { commandErrorText, inferGlobalDefaultMode, type GlobalDefaultInference } from "../warehouse/acquire-model.ts";

/**
 * 设置-实验性页(W15 重做形态,用户走查示意图 A/B):
 * - 卡片 = 标题「实验性功能」+ 副题 + 黄色警示条 + 两行开关;
 * - 行 1「生成 VPM 包替代」= 全局开关,写已冻结的 warehouse.setGlobalDefaultMode
 *   (bdl-commands v0.2 全局层);初值由条目读面推断(无覆盖条目的生效模式即
 *   composed 全局默认),推断不出时如实标注 unknown;写回执为服务端持久事实,
 *   直接更新开关态(推断仅是初值);
 * - 行 2「生成后删除原始素材文件」= 危险开关,主开关关闭时置灰;开启必经
 *   危险确认对话框(示意图 B)。**未接线如实标注**:全局自动删除超出已冻结
 *   的条目级 deleteOriginals,协议面随 proposal 008 裁决——本偏好仅记录
 *   意图,不触发任何服务端行为;DEV/fixture 面加注「本原型不会真正删除任何
 *   文件」(mock/fixture 不出 DEV 纪律);
 * - 走查不通过重做:原 per-entry 条目选择器整组移除;007 的「生成 VPM 模式
 *   入口」偏好开关被全局开关语义取代(变更随 proposal 008 复核)。
 */

const copy = strings.settings.experimental;
const acquireCopy = strings.warehouse.acquire;

function commandErrorsTable(): Record<string, string> {
  return acquireCopy.commandErrors as Record<string, string>;
}

export function ExperimentalCommands() {
  const gateway = useGateway();
  const acquire = useAcquireView();
  const [deleteFlag, setDeleteFlag] = useDeleteOriginalsAfterGenerate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  /** 写回执的持久事实(优先于条目推断);null = 尚未写入 */
  const [persisted, setPersisted] = useState<GlobalDefaultInference | null>(null);

  const entries = acquire.kind === "entries" ? acquire.entries : null;
  const effective: GlobalDefaultInference =
    persisted ?? (entries === null ? { kind: "unknown" } : inferGlobalDefaultMode(entries));
  const generateOn = effective.kind === "known" && effective.mode === "generate_vpm";

  // 未连接/空仓库的诚实空态由调用方(页面)分层;此处 entries===null 时仅渲染开关区,
  // 推断为 unknown 并标注——写面仍可尝试(服务可用而读面空是合法组合)
  useEffect(() => {
    setFeedback(null);
  }, [entries]);

  function writeGlobalMode(mode: WarehouseArtifactMode): void {
    setBusy(true);
    setFeedback(null);
    void gateway.warehouseCommands.setGlobalDefaultMode(mode).then((outcome: WarehouseCommandOutcome) => {
      setBusy(false);
      if (outcome.ok && "global" in outcome) {
        setPersisted({ kind: "known", mode: outcome.global.globalDefaultMode });
      } else if (!outcome.ok) {
        setFeedback(commandErrorText(outcome.error, commandErrorsTable()));
      }
    });
  }

  return (
    <div className="vua-page__stack vua-exp-card">
      <header className="vua-exp-card__header">
        <div>
          <h2 className="vua-title">{copy.title}</h2>
          <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>
        </div>
      </header>

      <div className="vua-exp-card__warning" role="note">
        ⚠ {copy.warning}
      </div>

      {/* 行 1:生成 VPM 包替代(全局默认模式写面;bdl-commands v0.2) */}
      <section className="vua-exp-card__row">
        <div className="vua-exp-card__text">
          <strong>{copy.generateTitle}</strong>
          <p className="vua-caption vua-text-secondary">{copy.generateDesc}</p>
          {effective.kind === "unknown" ? (
            <p className="vua-caption vua-text-secondary">{copy.globalReadUnknown}</p>
          ) : null}
          <p className="vua-caption vua-text-secondary">{copy.generateNotWired}</p>
          {feedback !== null ? (
            <p className="vua-caption vua-text-secondary" role="status">
              {feedback}
            </p>
          ) : null}
        </div>
        <Toggle
          on={generateOn}
          disabled={busy}
          label={copy.generateTitle}
          onToggle={() => writeGlobalMode(generateOn ? "use_original_unitypackage" : "generate_vpm")}
        />
      </section>

      {/* 行 2:生成后删除原始素材文件(危险;未接线偏好,proposal 008 未决) */}
      <section className="vua-exp-card__row">
        <div className="vua-exp-card__text">
          <p className="vua-exp-card__row-title">
            <strong>{copy.deleteTitle}</strong>{" "}
            <Badge tone="error">{copy.deleteBadge}</Badge>
          </p>
          <p className="vua-caption vua-text-secondary">{copy.deleteDesc}</p>
          <p className="vua-caption vua-text-secondary">{copy.notWired}</p>
        </div>
        <Toggle
          on={deleteFlag}
          disabled={busy || !generateOn}
          variant="danger"
          label={copy.deleteTitle}
          onToggle={() => {
            if (deleteFlag) {
              setDeleteFlag(false);
              return;
            }
            // 关闭无危险;开启必经危险确认对话框(示意图 B)
            setConfirmOpen(true);
          }}
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title={copy.dialogTitle}
        cancelLabel={copy.dialogCancel}
        confirmLabel={copy.dialogConfirm}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setDeleteFlag(true);
        }}
      >
        <p className="vua-confirm-dialog__lede">
          {copy.dialogBodyA}
          <strong>{copy.dialogBodyEmphasis}</strong>
          {copy.dialogBodyB}
        </p>
        <div className="vua-confirm-dialog__warning">
          <p>{copy.dialogWarning}</p>
          <p>{copy.notWired}</p>
          {import.meta.env.DEV ? <p>{copy.devPrototypeNote}</p> : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
