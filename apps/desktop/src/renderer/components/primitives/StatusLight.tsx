import { Icon } from "@vua/design-system";
import { strings } from "../../i18n/index.ts";
import "./status-light.css";

/**
 * 红绿灯状态灯(§4 部署器辖区,红绿灯语义仅此处使用)。
 * 状态必须同时带图标,不单独依赖颜色(§3.2 / WCAG 1.4.1)。
 */
export type StatusLevel = "ok" | "warning" | "error" | "unknown" | "info";

const glyphs: Record<StatusLevel, "check" | "warning" | "close" | "question" | "dash"> = {
  ok: "check",
  warning: "warning",
  error: "close",
  unknown: "question",
  info: "dash",
};

const labels: Record<StatusLevel, string> = strings.statusLight;

export interface StatusLightProps {
  level: StatusLevel;
  /** lg 用于部署器英雄区(§4.1) */
  size?: "md" | "lg";
  /** 默认附带文字状态标签,确保不依赖颜色表达 */
  withLabel?: boolean;
}

export function StatusLight({ level, size = "md", withLabel = false }: StatusLightProps) {
  return (
    <span className={`vua-status-light vua-status-light--${size}`} data-level={level}>
      <span className="vua-status-light__dot" role="img" aria-label={labels[level]}>
        <Icon name={glyphs[level]} size={size === "lg" ? 24 : 16} />
      </span>
      {withLabel ? <span className="vua-status-light__label">{labels[level]}</span> : null}
    </span>
  );
}
