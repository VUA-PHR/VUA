import type { HTMLAttributes, ReactNode } from "react";
import "./badge.css";

/**
 * 语义色芯片徽标(§5.2:状态用芯片而非裸文字)。
 * 本切片用于"演示数据"标识;后续仓库(Warehouse)复用于已购买/已下载/已导入/未获取。
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "brand" | "success" | "warning" | "error";
  children: ReactNode;
}

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={["vua-badge", className].filter(Boolean).join(" ")}
      data-tone={tone}
      {...rest}
    />
  );
}
