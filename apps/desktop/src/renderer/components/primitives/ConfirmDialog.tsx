import { useEffect, type ReactNode } from "react";
import { Button } from "./Button.tsx";
import "./confirm-dialog.css";

/**
 * 确认对话框(W15 重做形态,示意图 B):模态面板 + 取消/确认双按钮。
 * - danger=true:确认按钮为危险红实心(§8.1 高危确认形态);
 * - Esc 与遮罩点击 = 取消(破坏性操作默认退出,不默认确认);
 * - open=false 时不渲染;焦点管理交由浏览器默认(按钮 autofocus 由
 *   调用方经 children 控制),此处只保证键盘路径(Esc)存在。
 */
export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: ReactNode;
  readonly children: ReactNode;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly danger?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  cancelLabel,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="vua-confirm-dialog__overlay"
      onClick={onCancel}
      data-testid="confirm-dialog-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className="vua-confirm-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="vua-confirm-dialog__header">
          <span className="vua-confirm-dialog__title" data-danger={danger || undefined}>
            {title}
          </span>
          <button
            type="button"
            className="vua-confirm-dialog__close"
            aria-label={cancelLabel}
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className="vua-confirm-dialog__body">{children}</div>
        <div className="vua-confirm-dialog__actions">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
