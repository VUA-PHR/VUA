/**
 * 游戏引导内容模型(G6):五页 ↔ 内容包教程的映射,以及页内插图的资产解析。
 * 页文案在 i18n strings(guide.pages.*);本模块只持有结构性事实——
 * 每页对应哪个教程、媒体 id 解析到哪张自制 SVG。
 * 本模块不 import 内容包 JSON(node --test 无法裸 import JSON);
 * 与内容包的一致性由 validateGuideContent 在测试中以注入方式校验。
 */
import type { TutorialContentPackV1 } from "../../app/tutorial-content-pack.ts";
import { strings } from "../../i18n/index.ts";

export type GuidePageId =
  | "guide-start"
  | "guide-basics"
  | "guide-safety"
  | "guide-devices"
  | "guide-tutorials";

export const GUIDE_PAGE_IDS: readonly GuidePageId[] = [
  "guide-start",
  "guide-basics",
  "guide-safety",
  "guide-devices",
  "guide-tutorials",
];

/** 页 → 内容包教程 id(每页 CTA 启动对应教程;教程 id 与页 id 同名是约定) */
export const GUIDE_PAGE_TUTORIAL: Record<GuidePageId, string> = {
  "guide-start": "guide-start",
  "guide-basics": "guide-basics",
  "guide-safety": "guide-safety",
  "guide-devices": "guide-devices",
  "guide-tutorials": "guide-tutorials",
};

export type GuideMediaId = "pc-keys" | "vr-controller";

/** 媒体 id → 资产与替代文本;strings 中引用的媒体 id 必须在此登记。
 * SVG 置 public/(Vite 原样拷贝进 dist):node --test 无法 import .svg,
 * URL 引用同时保证本模型可测、双主题可读 */
export const GUIDE_MEDIA: Record<GuideMediaId, { src: string; alt: string }> = {
  "pc-keys": { src: "/guide/pc-keys.svg", alt: strings.guide.mediaAlt.pcKeys },
  "vr-controller": { src: "/guide/vr-controller.svg", alt: strings.guide.mediaAlt.vrController },
};

/** 未登记的媒体 id 解析为 null——诚实缺省(不渲染破图),由测试保证不发生 */
export function resolveGuideMedia(mediaId: string): { src: string; alt: string } | null {
  return mediaId in GUIDE_MEDIA ? GUIDE_MEDIA[mediaId as GuideMediaId] : null;
}

/**
 * 结构一致性校验(测试注入内容包):
 * - 每个引导页的教程必须存在于内容包;
 * - strings 中引用的每个媒体 id 必须已登记资产。
 * 校验失败抛 Error——两者都是构建期内容损坏,不是运行时分支。
 */
export function validateGuideContent(pack: TutorialContentPackV1): void {
  const tutorialIds = new Set(pack.tutorials.map((t) => t.id));
  for (const page of GUIDE_PAGE_IDS) {
    const tutorialId = GUIDE_PAGE_TUTORIAL[page];
    if (!tutorialIds.has(tutorialId)) {
      throw new Error(`guide_content_missing_tutorial:${tutorialId}`);
    }
  }
  for (const pageCopy of Object.values(strings.guide.pages)) {
    for (const section of pageCopy.sections) {
      if ("media" in section && section.media !== undefined && !(section.media in GUIDE_MEDIA)) {
        throw new Error(`guide_content_unknown_media:${section.media}`);
      }
    }
  }
}
