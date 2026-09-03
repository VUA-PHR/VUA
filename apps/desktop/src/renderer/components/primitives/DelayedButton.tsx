import { useEffect, useState, type CSSProperties } from "react";
import { Button, type ButtonProps } from "./Button.tsx";
import "./delayed-button.css";

/**
 * 延迟确认按钮(S-XVI,ui-ux §8.1 危险操作):
 * 破坏性动作(移除/大版本升级/降级等)的确认钮,挂载后延迟 delayMs 才可点,
 * 给"先读完变更清单"留出强制停顿;等待期间以进度填充动画表达剩余时间。
 *
 * 纪律:
 * - 只负责"延迟可点",不携带业务文案;提示语由调用方以文字并列给出;
 * - 延迟是挂载级语义:对话框每次打开重挂载本组件,延迟随之重置;
 * - reduced-motion / effects-off 下填充动画由全局规则压平,JS 延迟不受影响。
 */
export interface DelayedButtonProps extends ButtonProps {
  /** 延迟毫秒数,默认 1000 */
  delayMs?: number;
}

export function DelayedButton({
  delayMs = 1000,
  disabled,
  className,
  style,
  ...rest
}: DelayedButtonProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);
  return (
    <Button
      className={["vua-delayed-button", className].filter(Boolean).join(" ")}
      data-waiting={!ready || undefined}
      disabled={disabled || !ready}
      style={{ ...style, "--vua-delay": `${delayMs}ms` } as CSSProperties}
      {...rest}
    />
  );
}
