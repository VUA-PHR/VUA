import { Button } from "../../components/primitives/Button.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { Icon } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type {
  PackagesInstallPlanV02,
  PackagesInstallReceiptV02,
  PackagesOpsRejectedV02,
} from "../../gateway/index.ts";
import { DESTRUCTIVE_CONFIRM_DELAY_MS, removeGuardKey } from "./packages-model.ts";

const copy = strings.packages;

/**
 * A2 安装/升级确认对话框(026 packages-ops v0.2 冻结词面消费批;确认链
 * 第二步前的确认面,与 A1 RemoveConfirmDialog 分立——installReceipt 与
 * removeReceipt 键集互斥〔requestedPackages/appliedItems 对
 * requestedPackageIds/removedItems〕,两 live 词面链的收据呈现互不污染;
 * 与 demo 泛型 ChangesDialog 亦分立,fixture 演示面不进 live):
 * - plan 投影:变更行(kind 词表二值 install/remove 分组——安装预览可含
 *   remove 行,冲突触发的移除是端口事实 ORC-WF-002 如实呈现;version/
 *   reason 可空 null 不渲染不猜测)+ conflicts 自由文本警示条(协议本:
 *   确认 UI 必须警示)+ legacy 文件/目录清单;destructive=true 确认钮走
 *   DelayedButton 延迟解锁(ADR-0006;权威判定在服务端——桌面只做 UX
 *   提示,服务端复算漂移即拒);
 * - receipt 终态内联呈现(installReceipt 审计三半面:确认指纹回显 + 请求
 *   行 verbatim 携版本选择语义〔null = 解析器选,如实呈现〕+ 实际应用行,
 *   014 导入收据先例同构);
 * - rejected 终态内联呈现(guard 人话文案——三值闭集复用 A1 零新增 +
 *   detail 服务端原词次要呈现;preview_drift 系 recoverable 冲突——引导
 *   关闭后重新预览重新确认,绝不静默覆盖,诚实纪律 3);
 * - 取消 = 遮罩/Esc/取消钮,无副作用;终态呈现期间取消钮即关闭钮。
 */
export function InstallConfirmDialog({
  plan,
  requestedPackages,
  phase,
  receipt,
  rejection,
  onCancel,
  onConfirm,
}: {
  plan: PackagesInstallPlanV02;
  /** 用户确认的请求行(确认时透传,收据呈现审计关联) */
  requestedPackages: readonly { packageId: string; version: string | null }[];
  phase: "confirm" | "applying" | "receipt" | "rejected";
  receipt: PackagesInstallReceiptV02 | null;
  rejection: PackagesOpsRejectedV02 | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const removeItems = plan.items.filter((item) => item.kind === "remove");
  const installItems = plan.items.filter((item) => item.kind === "install");
  const busy = phase === "applying";
  const terminal = phase === "receipt" || phase === "rejected";
  return (
    <div
      className="vua-packages-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={copy.install.title}
      onClick={busy || terminal ? undefined : onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy && !terminal) onCancel();
      }}
    >
      <div className="vua-packages-dialog__panel" onClick={(event) => event.stopPropagation()}>
        {phase === "receipt" && receipt !== null ? (
          <>
            <h2 className="vua-packages-dialog__title">{copy.install.receiptTitle}</h2>
            <p className="vua-caption">
              {format(copy.install.receiptSummary, { count: receipt.appliedItems.length })}
            </p>
            <section>
              <h3 className="vua-packages__change-group-title">{copy.install.receiptAppliedTitle}</h3>
              <ul className="vua-packages__change-group">
                {receipt.appliedItems.map((item) => (
                  <li key={`${item.kind}-${item.packageId}`} className="vua-packages__change-item">
                    <span title={item.packageId}>{item.packageId}</span>
                    <span className="vua-caption vua-text-secondary">
                      {item.version ?? item.reason ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <p className="vua-caption vua-text-secondary vua-packages-dialog__hint">
              {format(copy.install.receiptDigest, { digest: receipt.confirmedDigest })}
            </p>
            <div className="vua-packages-dialog__footer">
              <Button variant="primary" autoFocus onClick={onCancel}>
                {copy.install.close}
              </Button>
            </div>
          </>
        ) : phase === "rejected" && rejection !== null ? (
          <>
            <h2 className="vua-packages-dialog__title">{copy.install.rejectedTitle}</h2>
            <div className="vua-packages__warning-strip">
              <Icon name="warning" size={16} />
              <p className="vua-caption">{copy.install.guards[removeGuardKey(rejection.guard)]}</p>
            </div>
            <p className="vua-caption vua-text-secondary vua-packages-dialog__hint">
              {format(copy.install.rejectedDetail, { detail: rejection.detail })}
            </p>
            {rejection.guard === "preview_drift" ? (
              <p className="vua-caption">{copy.install.driftHint}</p>
            ) : null}
            <div className="vua-packages-dialog__footer">
              <Button variant="primary" autoFocus onClick={onCancel}>
                {copy.install.close}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="vua-packages-dialog__title">{copy.install.title}</h2>
            {plan.conflicts.length > 0 ? (
              <div className="vua-packages__warning-strip">
                <Icon name="warning" size={16} />
                <div>
                  {plan.conflicts.map((conflict, index) => (
                    <p key={index} className="vua-caption">
                      {conflict}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <section>
              <h3 className="vua-packages__change-group-title">{copy.install.installedTitle}</h3>
              <ul className="vua-packages__change-group">
                {installItems.map((item) => (
                  <li key={`${item.kind}-${item.packageId}`} className="vua-packages__change-item">
                    <span title={item.packageId}>{item.packageId}</span>
                    <span className="vua-caption vua-text-secondary">
                      {item.version ?? item.reason ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            {removeItems.length > 0 ? (
              <section>
                <h3 className="vua-packages__change-group-title">{copy.install.removedTitle}</h3>
                <ul className="vua-packages__change-group">
                  {removeItems.map((item) => (
                    <li key={`${item.kind}-${item.packageId}`} className="vua-packages__change-item">
                      <span title={item.packageId}>{item.packageId}</span>
                      <span className="vua-caption vua-text-secondary">
                        {item.version ?? item.reason ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {plan.removeLegacyFiles.length > 0 || plan.removeLegacyFolders.length > 0 ? (
              <section>
                <h3 className="vua-packages__change-group-title">{copy.install.legacyTitle}</h3>
                <ul className="vua-packages__legacy-list">
                  {plan.removeLegacyFolders.map((dir) => (
                    <li key={`folder-${dir}`}>{dir}</li>
                  ))}
                  {plan.removeLegacyFiles.map((file) => (
                    <li key={`file-${file}`}>{file}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="vua-packages-dialog__footer">
              {plan.destructive ? (
                <p className="vua-caption vua-text-secondary vua-packages-dialog__hint">
                  {copy.install.destructiveHint}
                </p>
              ) : null}
              <Button variant="subtle" autoFocus disabled={busy} onClick={onCancel}>
                {copy.changes.cancel}
              </Button>
              {plan.destructive ? (
                <DelayedButton
                  variant="primary"
                  delayMs={DESTRUCTIVE_CONFIRM_DELAY_MS}
                  disabled={busy}
                  onClick={onConfirm}
                >
                  {format(copy.install.confirm, { count: requestedPackages.length })}
                </DelayedButton>
              ) : (
                <Button variant="primary" disabled={busy} onClick={onConfirm}>
                  {format(copy.install.confirm, { count: requestedPackages.length })}
                </Button>
              )}
            </div>
          </>
        )}
        {busy ? (
          <p className="vua-caption vua-text-secondary" role="status">
            {copy.install.applying}
          </p>
        ) : null}
      </div>
    </div>
  );
}
