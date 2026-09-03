import type { CSSProperties } from "react";
import "./skeleton.css";

/**
 * 骨架屏组件本体(ui-ux §2.8)。
 * 只用于"内容正在加载"且与最终布局一致;禁止用来掩盖等待用户输入、
 * 失败或未知状态,也不得以骨架屏填充尚未实现的能力(原则①)。
 * 本阶段只交付组件,不接占位页。
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Skeleton({ width = "100%", height = 14, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return (
    <span
      className={["vua-skeleton", className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}
