import { useEffect, useRef, useState } from "react";
import { Mascot } from "../../components/primitives/Mascot.tsx";
import { strings } from "../../i18n/index.ts";
import { INTRO_FADE_MS, introHoldMs } from "./production-intro-state.ts";
import "./production-intro.css";

/**
 * 模型生产模块首次进入覆盖层(假加载页)。
 *
 * 三个内容槽位(为最终交付预留,正式素材见 docs/design-requirements 需求清单):
 * - 图片槽位 __illustration:16:9 预留容器,正式模块插图未交付前渲染空态面板;
 * - 动画槽位 __animation:当前为像素吉祥物眨眼循环,正式逐帧/Lottie 动画替换点;
 * - 文字槽位 __title/__subtitle:模块名 + 初始化文案,真实任务接入后按阶段换文案。
 *
 * 退出:固定时长(见 production-intro-state.ts)→ 淡出 → onDone 卸载;
 * 点击覆盖层、按 Escape 或点"跳过"立即退出。reduced-motion 下缩短停留。
 * 覆盖范围:仅主内容区(顶栏/侧栏保持可用,用户可随时切走)。
 */
export function ProductionIntroOverlay({ onDone }: { onDone: () => void }) {
  const copy = strings.productionIntro;
  const [fading, setFading] = useState(false);
  const veilRef = useRef<HTMLDivElement>(null);

  // 挂载即聚焦,使 Escape 立即可用(焦点不落在页内控件上)
  useEffect(() => {
    veilRef.current?.focus();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = window.setTimeout(() => setFading(true), introHoldMs(reduced));
    return () => window.clearTimeout(hold);
  }, []);

  useEffect(() => {
    if (!fading) return;
    const exit = window.setTimeout(onDone, INTRO_FADE_MS);
    return () => window.clearTimeout(exit);
  }, [fading, onDone]);

  const skip = () => setFading(true);

  return (
    <div
      ref={veilRef}
      className="vua-production-intro"
      data-fading={fading || undefined}
      role="status"
      aria-label={`${copy.title}。${copy.subtitle}`}
      tabIndex={-1}
      onClick={skip}
      onKeyDown={(event) => {
        if (event.key === "Escape") skip();
      }}
    >
      <div className="vua-production-intro__card">
        {/* 图片槽位:正式插图交付前为预留空态;接入时替换为 <img>/插图组件 */}
        <div className="vua-production-intro__illustration" aria-hidden="true" />
        {/* 动画槽位 */}
        <div className="vua-production-intro__animation" aria-hidden="true">
          <Mascot animate size={72} />
          <span className="vua-production-intro__progress">
            <span className="vua-production-intro__progress-bar" />
          </span>
        </div>
        {/* 文字槽位 */}
        <h2 className="vua-production-intro__title">{copy.title}</h2>
        <p className="vua-production-intro__subtitle vua-text-secondary">{copy.subtitle}</p>
        <button
          type="button"
          className="vua-production-intro__skip vua-caption"
          onClick={(event) => {
            event.stopPropagation();
            skip();
          }}
        >
          {copy.skip}
        </button>
      </div>
    </div>
  );
}
