import type { HTMLAttributes, ReactNode } from "react";
import "./card.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** elevated 仅在浮层语义下使用,带一层柔和投影(§3.4) */
  elevated?: boolean;
  children: ReactNode;
}

export function Card({ elevated = false, className, ...rest }: CardProps) {
  return (
    <section
      className={["vua-card", elevated ? "vua-card--elevated" : "", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
