/**
 * 指挥台首页(S-VFX-2):默认落地页,整页宽(无侧栏)。
 * 全息核心(Three.js)+ 渐变字标 + 命令入口 + 模块速达卡 + 环境状态带。
 * 数据纪律:状态带只展示环境检测已有证据,无证据 = unknown 诚实态(原则①)。
 */
import { lazy, Suspense } from "react";
import {
  resolveTabLanding,
  type BusinessModuleId,
  type PageId,
} from "../../app/nav-model.ts";
import {
  StatusLight,
  type StatusLevel,
} from "../../components/primitives/StatusLight.tsx";
import { useEnvironmentView } from "../../gateway/index.ts";
import { strings } from "../../i18n/index.ts";
import {
  summarizeHealth,
  type CheckZone,
  type ZonePhase,
} from "../deployer/deployer-model.ts";
import "./home.css";

/* 全息核心:three.js 体量大,懒加载;加载完成前容器自带 CSS 辉光兜底 */
const HoloCoreCanvas = lazy(() => import("../../components/three/HoloCoreCanvas.tsx"));

export interface HomePageProps {
  onOpenPalette: () => void;
  onNavigate: (page: PageId) => void;
}

const QUICK_CARDS: readonly BusinessModuleId[] = ["env", "guide", "production", "tools"];

/** 辖区检测证据 → 状态灯级别;无证据/进行中 = unknown(诚实态) */
function zoneLevel(phase: ZonePhase): StatusLevel {
  if (phase.kind === "results") return summarizeHealth(phase.items).overall;
  if (phase.kind === "failed") return "error";
  return "unknown";
}

export function HomePage({ onOpenPalette, onNavigate }: HomePageProps) {
  const copy = strings.home;
  const environmentView = useEnvironmentView();
  const zones: readonly CheckZone[] = ["play", "create"];
  const zoneLabels: Record<CheckZone, string> = {
    play: strings.nav.pages.envPlay,
    create: strings.nav.pages.envCreate,
  };

  return (
    <div className="vua-home">
      <section className="vua-home__hero">
        <span className="vua-home__wordmark">VUA</span>
        <p className="vua-home__tagline vua-text-secondary">{copy.tagline}</p>
      </section>

      <div className="vua-home__holo">
        <Suspense fallback={null}>
          <HoloCoreCanvas />
        </Suspense>
      </div>

      <button type="button" className="vua-home__command" onClick={onOpenPalette}>
        <span>{copy.commandCta}</span>
        <kbd className="vua-home__command-hint">{strings.commandPalette.ctaHint}</kbd>
      </button>

      <section className="vua-home__quick" aria-label={copy.quickHeading}>
        <h2 className="vua-caption vua-text-secondary">{copy.quickHeading}</h2>
        <div className="vua-home__cards">
          {QUICK_CARDS.map((module) => (
            <button
              key={module}
              type="button"
              className="vua-home__card"
              onClick={() => onNavigate(resolveTabLanding(module))}
            >
              <span className="vua-home__card-title">{strings.nav.tabs[module]}</span>
              <span className="vua-home__card-desc">{copy.cardDesc[module]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="vua-home__status" aria-label={copy.statusHeading}>
        <h2 className="vua-caption vua-text-secondary">{copy.statusHeading}</h2>
        <div className="vua-home__status-items">
          {zones.map((zone) => (
            <span key={zone} className="vua-home__status-item">
              <StatusLight level={zoneLevel(environmentView.deployer.zones[zone])} />
              <span>{zoneLabels[zone]}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
