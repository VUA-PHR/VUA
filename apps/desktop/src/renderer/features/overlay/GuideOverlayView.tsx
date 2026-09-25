/**
 * 覆盖层引导视图(2026-09-26 用户裁决:游戏引导 Tab 退役,引导内容迁入
 * 置顶覆盖层窗口;窄窗口 460px 形态)。
 * 结构:横排主题 chips(六主题,顺序即 guide-content 的 GUIDE_TOPIC_IDS)
 * + 所选主题的标题/导语/分节(段落 + 自制 SVG 插图,经 GUIDE_MEDIA 解析)。
 * 内容全部来自 i18n strings.guide.pages——覆盖层与(已退役的)原页面
 * 消费同一份文案,不另立第二套内容。
 * 刻意不含:「学习目标与进度」卡(教程端口为未接入占位,常驻空槽不诚实)
 * 与 DEV-only 教程入口(随 GuidePage 一并退役)。
 */
import { useState } from "react";
import { MediaSlot } from "../../components/primitives/MediaSlot.tsx";
import { strings } from "../../i18n/index.ts";
import {
  GUIDE_TOPIC_COPY_KEY,
  GUIDE_TOPIC_IDS,
  resolveGuideMedia,
  type GuideTopicId,
} from "../guide/guide-content.ts";

export function GuideOverlayView() {
  const copy = strings.guide;
  const [topic, setTopic] = useState<GuideTopicId>("guide-start");
  const topicCopy = copy.pages[GUIDE_TOPIC_COPY_KEY[topic]];

  return (
    <div className="vua-overlay-guide">
      <div
        className="vua-overlay-guide__topics"
        role="tablist"
        aria-label={copy.topicsAria}
      >
        {GUIDE_TOPIC_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={topic === id}
            className="vua-overlay-guide__topic"
            data-active={topic === id || undefined}
            onClick={() => setTopic(id)}
          >
            {copy.pages[GUIDE_TOPIC_COPY_KEY[id]].title}
          </button>
        ))}
      </div>
      <div className="vua-overlay-guide__content" role="tabpanel">
        <h1 className="vua-overlay-guide__title">{topicCopy.title}</h1>
        <p className="vua-overlay-guide__intro">{topicCopy.intro}</p>
        {topicCopy.sections.map((section) => {
          const media =
            "media" in section && typeof section.media === "string"
              ? resolveGuideMedia(section.media)
              : null;
          return (
            <section key={section.id} className="vua-overlay-guide__section">
              <h2 className="vua-overlay-guide__section-title">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="vua-overlay-guide__paragraph">
                  {paragraph}
                </p>
              ))}
              {media !== null ? (
                <MediaSlot src={media.src} alt={media.alt} aspectRatio="16 / 9" />
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
