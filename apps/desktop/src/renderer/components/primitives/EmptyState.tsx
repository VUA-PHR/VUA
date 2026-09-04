import type { ReactNode } from "react";
import { Mascot } from "./Mascot.tsx";
import "./empty-state.css";

/**
 * 空状态(ui-ux 验收 #7:空/加载/错误三态不允许裸文字居中)。
 * 用于"尚未检测""尚未接入""无数据"等诚实占位。
 * 视觉为吉祥物静态帧(缺省形象),不再使用灰圈图标。
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="vua-empty-state">
      <Mascot animate={false} size={64} />
      <p className="vua-empty-state__title">{title}</p>
      {description ? <p className="vua-caption vua-text-secondary">{description}</p> : null}
      {action}
    </div>
  );
}
