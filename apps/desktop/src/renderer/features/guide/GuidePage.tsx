import { useEffect, useState } from "react";
import {
  openTutorialWindow,
  tutorialPort,
  tutorialWindowAvailable,
} from "../../app/tutorial-port-instance.ts";
import { resetVrTutorialOverlay, startVrTutorial } from "../../app/tutorial-overlay-dev.ts";
import type { TutorialSnapshot, TutorialSurfacePort } from "../../app/tutorial-port.ts";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { MediaSlot } from "../../components/primitives/MediaSlot.tsx";
import { format, strings } from "../../i18n/index.ts";
import {
  GUIDE_PAGE_TUTORIAL,
  resolveGuideMedia,
  type GuidePageId,
} from "./guide-content.ts";

const copy = strings.guide;

const pageCopyKey = {
  "guide-start": "start",
  "guide-basics": "basics",
  "guide-safety": "safety",
  "guide-devices": "devices",
  "guide-tutorials": "tutorials",
} as const satisfies Record<GuidePageId, keyof typeof copy.pages>;

type StepId = keyof typeof strings.tutorial.steps;

function stepTitle(id: string | null): string | null {
  return id !== null && id in strings.tutorial.steps
    ? strings.tutorial.steps[id as StepId].title
    : null;
}

/**
 * 游戏引导模块(v0.3.3 §5 / G6):五页各自接入内容包教程——CTA 经
 * openTutorialWindow(tutorialId) 启动本页教程,桌面教程窗口与 VR 覆盖层
 * 共用同一份会话(G4)。顶部"学习目标与进度"槽位(§5.1)接真实教程端口;
 * 页内容为早期占位草稿(draftNotice 明示,M5 正式内容)。
 * 不用骨架屏假装加载(骨架屏只表示内容正在加载,ui-ux §2.8)。
 */
export function GuidePage({
  page,
  port = tutorialPort,
}: {
  page: GuidePageId;
  port?: TutorialSurfacePort;
}) {
  const pageCopy = copy.pages[pageCopyKey[page]];
  const tutorialId = GUIDE_PAGE_TUTORIAL[page];
  const [tutorial, setTutorial] = useState<TutorialSnapshot | null>(null);
  // 进度快照读取失败:显式失败文案 + 重试,不与"加载中/无教程"混淆(诚实状态)
  const [progressFailed, setProgressFailed] = useState(false);
  const [progressNonce, setProgressNonce] = useState(0);
  // 启动教程窗口失败:invoke 拒绝时给出反馈,不做静默按钮
  const [startFailed, setStartFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setProgressFailed(false);
    void port
      .snapshot()
      .then((s) => {
        if (alive) setTutorial(s);
      })
      .catch(() => {
        if (alive) setProgressFailed(true);
      });
    const unsubscribe = port.subscribe(setTutorial);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [port, progressNonce]);

  const activeTitle =
    tutorial?.status === "active" ? stepTitle(tutorial.currentStepId) : null;

  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{pageCopy.title}</h1>
        <p className="vua-text-secondary">{pageCopy.intro}</p>
      </section>

      <Card>
        <div className="vua-page__stack">
          <h2 className="vua-caption vua-text-secondary">{copy.progressSlotTitle}</h2>
          {progressFailed ? (
            <div className="vua-page__actions">
              <p className="vua-text-secondary">{copy.progressSlotFailed}</p>
              <Button variant="subtle" onClick={() => setProgressNonce((nonce) => nonce + 1)}>
                {copy.progressSlotRetry}
              </Button>
            </div>
          ) : tutorial === null ? null : tutorial.status === "active" && activeTitle !== null ? (
            <p className="vua-text-secondary">
              {format(copy.progressSlotActive, {
                index: tutorial.stepIndex,
                total: tutorial.stepTotal,
                title: activeTitle,
              })}
            </p>
          ) : tutorial.status === "completed" ? (
            <p className="vua-text-secondary">{copy.progressSlotCompleted}</p>
          ) : (
            <p className="vua-text-secondary">{copy.progressSlotEmpty}</p>
          )}
          {tutorialWindowAvailable ? (
            <div className="vua-page__actions">
              <Button
                variant="default"
                onClick={() => {
                  setStartFailed(false);
                  void openTutorialWindow(tutorialId).catch(() => setStartFailed(true));
                }}
              >
                {copy.startTutorialCta}
              </Button>
              {startFailed ? (
                <p className="vua-caption vua-text-secondary">{copy.startTutorialFailed}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      {pageCopy.sections.map((section) => {
        const media =
          "media" in section && typeof section.media === "string"
            ? resolveGuideMedia(section.media)
            : null;
        return (
          <Card key={section.id}>
            <div className="vua-page__stack">
              <h2 className="vua-caption">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="vua-text-secondary">
                  {paragraph}
                </p>
              ))}
              {media !== null ? (
                <MediaSlot src={media.src} alt={media.alt} aspectRatio="16 / 9" />
              ) : null}
            </div>
          </Card>
        );
      })}

      {/* G4 P3 DEV 入口(第二层隔离门):生产构建 import.meta.env.DEV 为 false,
          分支与 dev 模块整体被 tree-shaking 剔除;第一层是 Rust 侧
          #[cfg(debug_assertions)] 不注册 command。入口只放在教程说明页。 */}
      {import.meta.env.DEV && page === "guide-tutorials" && tutorialWindowAvailable ? (
        <Card>
          <div className="vua-page__stack">
            <h2 className="vua-caption vua-text-secondary">{strings.dev.tag}</h2>
            <div className="vua-page__actions">
              <Button
                variant="default"
                onClick={() => void startVrTutorial().catch((e) => console.error(e))}
              >
                {strings.tutorial.vrDevEntry}
              </Button>
              {/* helper 挂死诊断复位(B-2):终止并清状态,不触发桌面回退 */}
              <Button
                variant="subtle"
                onClick={() => void resetVrTutorialOverlay().catch((e) => console.error(e))}
              >
                {strings.tutorial.vrDevReset}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <p className="vua-caption vua-text-secondary">{copy.draftNotice}</p>
    </div>
  );
}
