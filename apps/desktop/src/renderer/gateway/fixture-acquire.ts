import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type { AcquireView } from "./acquire-port.ts";

/**
 * 本地素材图册 fixture 适配(C-ACQUIRE,仅 DEV 可达;ADR-0004 后 BLM 适配移除):
 * - 默认场景:扫描范围 + 四个到达素材,覆盖 pending / clean / quarantined
 *   三种检查结论,以及"预览已提取(多图)/未提取(空数组)"两种图册形态;
 * - demo-acquire-scan:空图册走查(扫描范围已指定,尚无素材到达)。
 * 文件名等展示负载集中在 strings.fixtures.zh-CN.ts;预览图为合成渐变占位
 * (不携带真实商品图 URL),仅演示"预览已提取"形态;时间无关,走查可复现。
 */

/**
 * 合成演示预览图(本仓安全纪律:仓库与 CI 测试只用结构性合成数据,
 * 不携带真实商品图 URL)。内联 SVG 渐变占位,仅演示"预览已提取"形态;
 * data: URI 无网络请求,CSP img-src data: 已放行。
 */
function syntheticPreview(from: string, to: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="620" height="620">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    "</linearGradient></defs>" +
    '<rect width="620" height="620" fill="url(#g)"/></svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 演示预览图(合成渐变占位,与真实素材无任何关联) */
const DEMO_PREVIEWS = {
  summerPack: [
    syntheticPreview("#7c5cff", "#241f3d"),
    syntheticPreview("#4c6ef5", "#1a1b3a"),
    syntheticPreview("#12b886", "#0b2924"),
  ],
  mikoDress: [
    syntheticPreview("#ff7a45", "#3d2317"),
    syntheticPreview("#e64980", "#331423"),
  ],
} as const;

export function fixtureAcquireGallery(): AcquireView {
  const copy = fixtureStrings.acquire.artifacts;
  return {
    schemaVersion: 1,
    kind: "gallery",
    scanDirs: fixtureStrings.acquire.scanDirs,
    artifacts: [
      {
        artifactId: "artifact-summer-pack",
        fileName: copy.summerPack.fileName,
        sizeBytes: 48_332_800,
        inspection: { verdict: "clean", executables: [] },
        previewImageUrls: [...DEMO_PREVIEWS.summerPack],
      },
      {
        artifactId: "artifact-miko-dress",
        fileName: copy.mikoDress.fileName,
        sizeBytes: 21_184_512,
        inspection: { verdict: "clean", executables: [] },
        previewImageUrls: [...DEMO_PREVIEWS.mikoDress],
      },
      {
        // 待检查:预览提取排在检查之后,图册渲染诚实空槽
        artifactId: "artifact-stage-set",
        fileName: copy.stageSet.fileName,
        sizeBytes: null,
        inspection: { verdict: "pending", executables: [] },
        previewImageUrls: [],
      },
      {
        // 隔离件:不提供预览(不诱导翻看),只给检查结论与检出清单
        artifactId: "artifact-suspicious",
        fileName: copy.suspicious.fileName,
        sizeBytes: 5_242_880,
        inspection: { verdict: "quarantined", executables: copy.suspicious.executables },
        previewImageUrls: [],
      },
    ],
  };
}

/** demo-acquire-scan:扫描范围已指定、尚无素材到达的空图册(诚实空态走查) */
export function fixtureAcquireEmpty(): AcquireView {
  return {
    schemaVersion: 1,
    kind: "gallery",
    scanDirs: fixtureStrings.acquire.scanDirs,
    artifacts: [],
  };
}
