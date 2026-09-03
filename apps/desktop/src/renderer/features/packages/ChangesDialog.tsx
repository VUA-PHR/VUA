import { Button } from "../../components/primitives/Button.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { Icon } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type { PackageChangePreview } from "../../gateway/index.ts";
import {
  DESTRUCTIVE_CONFIRM_DELAY_MS,
  conflictMessageKey,
  groupPreviewItems,
} from "./packages-model.ts";

const copy = strings.packages;

/**
 * 变更预览对话框(S-XVI,两阶段变更的确认步):
 * - 分类清单(固定顺序;大版本升级/降级带警告条)+ 冲突红名单 + legacy 移除清单;
 * - destructive 预览的确认钮走 DelayedButton(延迟 1s,强制先读清单);
 * - 取消 = 点击遮罩 / Esc / 取消按钮,均无副作用;
 * - 默认焦点落在取消钮上:破坏性确认不抢焦点。
 */
export function ChangesDialog({
  preview,
  applying,
  resolveName,
  onCancel,
  onConfirm,
}: {
  preview: PackageChangePreview;
  applying: boolean;
  /** 包 ID → 显示名(冲突清单用);词表外 ID 回落原值,不猜测 */
  resolveName: (packageId: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const groups = groupPreviewItems(preview.items);
  const hasMajorUpgrade = groups.some((group) => group.kind === "majorUpgrade");
  const hasDowngrade = groups.some((group) => group.kind === "downgrade");
  return (
    <div
      className="vua-packages-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={copy.changes.title}
      onClick={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div className="vua-packages-dialog__panel" onClick={(event) => event.stopPropagation()}>
        <h2 className="vua-packages-dialog__title">{copy.changes.title}</h2>

        {hasMajorUpgrade ? (
          <div className="vua-packages__warning-strip">
            <Icon name="warning" size={16} />
            <p className="vua-caption">{copy.changes.majorUpgradeWarning}</p>
          </div>
        ) : null}
        {hasDowngrade ? (
          <div className="vua-packages__warning-strip">
            <Icon name="warning" size={16} />
            <p className="vua-caption">{copy.changes.downgradeWarning}</p>
          </div>
        ) : null}

        {groups.map((group) => (
          <section key={group.kind}>
            <h3 className="vua-packages__change-group-title">
              {copy.changes.kinds[group.kind]}
            </h3>
            <ul className="vua-packages__change-group">
              {group.items.map((item) => (
                <li key={item.packageId} className="vua-packages__change-item">
                  <span>{item.displayName}</span>
                  <span className="vua-caption vua-text-secondary">
                    {item.fromVersion !== undefined && item.toVersion !== undefined
                      ? format(copy.changes.versionLine, {
                          from: item.fromVersion,
                          to: item.toVersion,
                        })
                      : (item.toVersion ?? item.fromVersion ?? "")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {preview.conflicts.length > 0 ? (
          <section>
            <h3 className="vua-packages__change-group-title">{copy.changes.conflictsTitle}</h3>
            <ul className="vua-packages__conflicts">
              {preview.conflicts.map((conflict, index) => (
                <li key={index}>
                  <Icon name="warning" size={16} />
                  <span className="vua-caption">
                    {format(copy.changes.conflicts[conflictMessageKey(conflict.messageKey)], {
                      package: resolveName(conflict.packageIds[0] ?? ""),
                      dependent: conflict.packageIds.slice(1).map(resolveName).join(", "),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {preview.legacyRemovals.length > 0 ? (
          <section>
            <h3 className="vua-packages__change-group-title">{copy.changes.legacyTitle}</h3>
            <ul className="vua-packages__legacy-list">
              {preview.legacyRemovals.map((dir) => (
                <li key={dir}>{dir}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="vua-packages-dialog__footer">
          {preview.destructive ? (
            <p className="vua-caption vua-text-secondary vua-packages-dialog__hint">
              {copy.changes.delayedHint}
            </p>
          ) : null}
          <Button variant="subtle" autoFocus disabled={applying} onClick={onCancel}>
            {copy.changes.cancel}
          </Button>
          {preview.destructive ? (
            <DelayedButton
              variant="primary"
              delayMs={DESTRUCTIVE_CONFIRM_DELAY_MS}
              disabled={applying}
              onClick={onConfirm}
            >
              {copy.changes.confirm}
            </DelayedButton>
          ) : (
            <Button variant="primary" disabled={applying} onClick={onConfirm}>
              {copy.changes.confirm}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
