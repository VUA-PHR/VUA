import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * 本地素材图册只读窄端口(C-ACQUIRE;双轨之二,ui-ux §2.10,ADR-0004)。
 *
 * 定位:
 * - 登录、购买、下载交还系统浏览器与 BOOTH 官方工具;VUA 不内嵌 WebView,
 *   不读取、不记录 Cookie、下载票据或任何凭据。
 * - BLM 只读适配已搁置(ADR-0004:实测产品力不足);本端口只做用户指定
 *   扫描范围内到达素材(LocalArtifact)的图册视图:预览图、检查结论。
 * - 诚实纪律:能力未接入时不编造扫描结果;LocalArtifact 先检查再使用,
 *   压缩包内可执行内容绝不自动运行,表现层不提供任何"运行"入口;
 *   预览图尚未提取时 previewImageUrls 为空,UI 渲染诚实空槽,不伪造缩略图。
 * - 预览图 URL 由实现侧经 vuaimg 缓存协议承载(与目录浏览同一媒体通道);
 *   本地预览提取(压缩包/unitypackage 内图片)是中台能力,未接入前为空数组。
 */

/**
 * 检查结论:
 * - pending:已到达、尚未完成检查(先检查再使用,出结论前不可被 Recipe 引用);
 * - clean:压缩包内未见可执行内容;
 * - quarantined:检出可执行内容,已隔离;绝不自动运行(§2.10)。
 */
export type ArtifactInspectionVerdict = "pending" | "clean" | "quarantined";

export interface LocalArtifact {
  readonly artifactId: string;
  readonly fileName: string;
  /** 字节大小;未知为 null,UI 显示"大小未知"而不猜测 */
  readonly sizeBytes: number | null;
  readonly inspection: {
    readonly verdict: ArtifactInspectionVerdict;
    /** 检出的可执行内容清单(相对压缩包路径);无检出为空数组 */
    readonly executables: readonly string[];
  };
  /** 预览图 URL 列表(多图走相册交互);空 = 尚未提取或无图 */
  readonly previewImageUrls: readonly string[];
}

export type AcquireView =
  | { schemaVersion: 1; kind: "not-connected" }
  | {
      schemaVersion: 1;
      kind: "gallery";
      /** 用户指定的扫描范围;空数组 = 尚未指定 */
      readonly scanDirs: readonly string[];
      readonly artifacts: readonly LocalArtifact[];
    };

export interface AcquirePort {
  snapshot(): Promise<AcquireView>;
  subscribe(callback: (view: AcquireView) => void): Unsubscribe;
  capability(): Promise<CapabilityReport>;
}
