import { useEffect, useMemo, useRef, useState } from "react";
import { format, strings } from "../../i18n/index.ts";
import { bootProgress } from "../../app/boot-progress.ts";
import { loadUpdateCheckCache } from "../../app/update-check-store.ts";
import {
  BOOT_PROGRESS_CAP_MS,
  splashShouldExit,
} from "./boot-progress-model.ts";
import {
  SPLASH_FADE_MS,
  buildSplashGrid,
  splashVisibleMs,
} from "./boot-splash-model.ts";
import "./boot-splash.css";

/**
 * 启动开屏(对标 Comfy-Desktop 的仪式性首帧,按用户裁定自绘):
 * 方形柱格从窗口顶部到底部依次落满,中央 VUA 字母框体以紫→橙渐变描边画入。
 * 退出由真实启动链驱动(Phase A):动画预算播完且四里程碑(renderer/gateway/
 * provider/paint)全齐才淡出;未齐进入等待态(方柱呼吸＋如实字幕),硬上限
 * 8s 必退——主界面自身的诚实缺席呈现接管。Escape/点击跳过。
 * 左下角版本角标 = vite define 注入的构建期事实(version/commit/dirty)。
 * 全局动效压平(reduced-motion / 特效关)时全局 CSS 摊平动画,驻留缩短,
 * 不等里程碑。
 */
export function BootSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [flattened] = useState(
    () =>
      document.documentElement.dataset.effects === "off" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const grid = useMemo(
    () => buildSplashGrid(window.innerWidth, window.innerHeight),
    [],
  );

  // 新版本角标:读上次检测缓存(本次自检在启动后 2.5s 才发起,结果留给下次
  // 开屏与设置页);仅 newer-available 上屏,失败/最新不打扰
  const [updateBadge] = useState(() => {
    const cache = loadUpdateCheckCache();
    return cache?.state === "newer-available" && cache.latestVersion !== null
      ? cache.latestVersion
      : null;
  });

  // 预算计时:播完按里程碑裁决——齐则淡出,未齐转等待态
  useEffect(() => {
    const budgetMs = splashVisibleMs(flattened);
    const budgetTimer = window.setTimeout(() => {
      if (
        splashShouldExit({
          elapsedMs: budgetMs,
          budgetMs,
          flattened,
          allReached: bootProgress.allReached(),
        })
      ) {
        setLeaving(true);
      } else {
        setWaiting(true);
      }
    }, budgetMs);
    return () => window.clearTimeout(budgetTimer);
  }, [flattened]);

  // 硬上限兜底:无论里程碑与否必退出
  useEffect(() => {
    if (flattened) return;
    const capTimer = window.setTimeout(() => setLeaving(true), BOOT_PROGRESS_CAP_MS);
    return () => window.clearTimeout(capTimer);
  }, [flattened]);

  // 等待态:里程碑齐即淡出
  useEffect(() => {
    if (!waiting) return;
    if (bootProgress.allReached()) {
      setLeaving(true);
      return;
    }
    return bootProgress.subscribe(() => {
      if (bootProgress.allReached()) setLeaving(true);
    });
  }, [waiting]);

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

  const className = [
    "vua-boot-splash",
    leaving ? "vua-boot-splash--leaving" : "",
    waiting ? "vua-boot-splash--waiting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
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
        {updateBadge !== null ? (
          <span className="vua-boot-splash__update">
            {format(strings.bootSplash.updateAvailable, { version: updateBadge })}
          </span>
        ) : null}
        {waiting ? (
          <span className="vua-boot-splash__phase">{strings.bootSplash.waitingServices}</span>
        ) : null}
      </div>
      <span className="vua-boot-splash__version" aria-hidden="true">
        {`v${__VUA_BUILD_INFO__.version} · ${__VUA_BUILD_INFO__.commit}${__VUA_BUILD_INFO__.dirty ? "-dirty" : ""}`}
      </span>
    </div>
  );
}
