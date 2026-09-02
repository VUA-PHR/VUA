import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "default",
  className,
  type,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "default" | "subtle" }) {
  return (
    <button
      type={type ?? "button"}
      className={["vua-button", `vua-button--${variant}`, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function Card({
  elevated = false,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { elevated?: boolean }) {
  return (
    <section
      className={["vua-card", elevated && "vua-card--elevated", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "success" | "warning" | "error" }) {
  return <span className={["vua-badge", `vua-badge--${tone}`, className].filter(Boolean).join(" ")} {...props} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="vua-empty-state">
      <Mascot animate={false} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function StatusLight({ level, label }: { level: "ok" | "warning" | "error" | "unknown"; label: string }) {
  return (
    <span className={`vua-status-light vua-status-light--${level}`}>
      <span aria-hidden="true" className="vua-status-light__dot" />
      {label}
    </span>
  );
}

export function Mascot({ animate = true, size = 64 }: { animate?: boolean; size?: number }) {
  return (
    <svg
      className={animate ? "vua-mascot vua-mascot--animate" : "vua-mascot"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      role="img"
      aria-label="VUA 像素装配工"
    >
      <g className="vua-mascot__body">
        <rect x="11" y="2" width="2" height="1" />
        <rect className="vua-mascot__accent" x="11" y="0" width="2" height="2" />
        <rect x="5" y="3" width="14" height="9" />
        <rect className="vua-mascot__face" x="7" y="5" width="10" height="5" />
        <rect x="4" y="14" width="2" height="4" />
        <rect x="18" y="14" width="2" height="4" />
        <rect x="7" y="13" width="10" height="7" />
        <rect className="vua-mascot__accent" x="11" y="15" width="2" height="2" />
        <rect x="7" y="20" width="3" height="2" />
        <rect x="14" y="20" width="3" height="2" />
      </g>
      <g className="vua-mascot__eyes vua-mascot__accent">
        <rect x="9" y="6" width="2" height="3" />
        <rect x="13" y="6" width="2" height="3" />
      </g>
    </svg>
  );
}
