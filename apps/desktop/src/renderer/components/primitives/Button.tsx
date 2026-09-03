import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary:每屏至多一个主操作,当前模块品牌色底 + 按主题达标的文字色(§3.2);
   * default:常规操作;subtle:收敛入口(次要修复、详情)。
   */
  variant?: "primary" | "default" | "subtle";
  children: ReactNode;
}

export function Button({ variant = "default", className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={["vua-button", `vua-button--${variant}`, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
