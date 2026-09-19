import { useEffect, useMemo, useRef, useState } from "react";
import { strings } from "../../i18n/index.ts";
import {
  SPLASH_FADE_MS,
  buildSplashGrid,
  splashVisibleMs,
} from "./boot-splash-model.ts";
import "./boot-splash.css";

/**
 * 启动开屏(对标 Comfy-Desktop 的仪式性首帧,按用户裁定改为自绘):
 * 方形柱格从窗口顶部到底部依次落满,中央 VUA 字母框体以紫→橙渐变描边画入。
 * 节奏全部由 boot-splash-model 计算;Escape 或点击跳过。
 * 全局动效压平(reduced-motion / 特效关)时由全局 CSS 规则摊平动画,
 * 本组件只把驻留缩短,不空等动画窗。
 */
export function BootSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const grid = useMemo(
    () => buildSplashGrid(window.innerWidth, window.innerHeight),
    [],
  );

  useEffect(() => {
    const flattened =
      document.documentElement.dataset.effects === "off" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdTimer = window.setTimeout(
      () => setLeaving(true),
      splashVisibleMs(flattened),
    );
    return () => window.clearTimeout(holdTimer);
  }, []);

  // Escape / 点击跳过:直接进入淡出,不等待剩余节奏
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLeaving(true);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  // 淡出收尾的唯一出口:无论自然播完还是跳过,leaving 后固定淡出窗再卸载
  useEffect(() => {
    if (!leaving) return;
    const fadeTimer = window.setTimeout(() => onDoneRef.current(), SPLASH_FADE_MS);
    return () => window.clearTimeout(fadeTimer);
  }, [leaving]);

  return (
    <div
      className={`vua-boot-splash${leaving ? " vua-boot-splash--leaving" : ""}`}
      role="status"
      aria-label={strings.bootSplash.starting}
      onClick={() => setLeaving(true)}
    >
      <div
        className="vua-boot-splash__grid"
        aria-hidden="true"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
          gap: `${grid.pitch - grid.cell}px`,
        }}
      >
        {grid.cells.map((cell) => (
          <span
            key={`${cell.col}:${cell.row}`}
            className="vua-boot-splash__cell"
            data-tone={cell.tone}
            style={{ animationDelay: `${cell.delayMs}ms` }}
          />
        ))}
      </div>
      <div className="vua-boot-splash__mark">
        <svg
          className="vua-boot-splash__letters"
          viewBox="0 0 264 120"
          role="img"
          aria-label="VUA"
        >
          <defs>
            <linearGradient id="vuaBootGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--vua-purple)" />
              <stop offset="100%" stopColor="var(--vua-orange)" />
            </linearGradient>
          </defs>
          {/* 字母框体:描边画入(pathLength 归一),紫→橙渐变 */}
          <g
            fill="none"
            stroke="url(#vuaBootGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path className="vua-boot-splash__letter" style={{ animationDelay: "120ms" }} pathLength={1} d="M18 16 L54 100 L90 16" />
            <path className="vua-boot-splash__letter" style={{ animationDelay: "330ms" }} pathLength={1} d="M112 16 V70 Q112 100 142 100 Q172 100 172 70 V16" />
            <path className="vua-boot-splash__letter" style={{ animationDelay: "540ms" }} pathLength={1} d="M192 100 L220 16 L248 100 M204 66 H236" />
          </g>
        </svg>
        <span className="vua-boot-splash__subtitle">VRC Ultra Assistant</span>
      </div>
    </div>
  );
}
