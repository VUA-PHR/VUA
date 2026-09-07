import "./toggle.css";

/**
 * 开关(W15 重做形态):role="switch" 的紧凑轨道开关。
 * - on:当前态;onToggle:点击回调(不持有状态,受控组件);
 * - variant="danger":危险开关,开启态为危险红(语义色纪律 §6.1);
 * - disabled 时轨道置灰;label 经 aria-label 提供(轨道内无文字)。
 */
export interface ToggleProps {
  readonly on: boolean;
  readonly disabled?: boolean;
  readonly variant?: "default" | "danger";
  readonly label: string;
  readonly onToggle: () => void;
}

export function Toggle({ on, disabled = false, variant = "default", label, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="vua-toggle"
      data-on={on || undefined}
      data-variant={variant}
      disabled={disabled}
      onClick={onToggle}
    />
  );
}
