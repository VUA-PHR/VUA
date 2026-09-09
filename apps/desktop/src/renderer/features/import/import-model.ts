import type { RemoteContentEventV1 } from "@vua/contracts";

/**
 * 素材导入页云端段「内嵌浏览面板」的呈现纯函数(M6 IMP-2 批 A,proposal 015
 * 对账;design-standard 0.7.0 §8.3):
 * - 能力两态(两态开关,desktop 架构 1.1.0):app.snapshot 的 remoteBrowser
 *   标志驱动呈现——false = 未接线诚实降级(不可用标注,无替代假动作);
 *   true = 内嵌浏览面板可用(翻转随批 B);
 * - 内嵌视图状态由 remote-content 事件流归约(view-opened/navigated/
 *   view-closed/blocked),blocked 事件诚实呈现不静默;
 * - 隔离红线与本面板无关:远程内容在 Main 侧 WebContentsView(sandbox/
 *   无 preload/独立 partition),本页只发语义动作。
 */

export type EmbeddedBrowseAvailability =
  | { readonly kind: "available" }
  | { readonly kind: "unavailable" };

/** app.snapshot 的能力标志 → 面板两态(未知快照 = 保守不可用,不猜测) */
export function browseAvailability(remoteBrowser: unknown): EmbeddedBrowseAvailability {
  return remoteBrowser === true ? { kind: "available" } : { kind: "unavailable" };
}

export interface EmbeddedBrowseState {
  /** 当前托管视图身份;null = 无打开视图 */
  readonly viewId: string | null;
  /** 视图当前地址(navigated 事件同步;用户输入草稿不入此状态) */
  readonly currentUrl: string | null;
  /** 最近一次策略拦截目标(诚实呈现;null = 无) */
  readonly lastBlocked: string | null;
}

export const initialEmbeddedBrowseState: EmbeddedBrowseState = {
  viewId: null,
  currentUrl: null,
  lastBlocked: null,
};

/** remote-content 事件流归约:只跟踪当前托管视图(单视图面板;多视图管理
 *  超出本页面板语义),blocked 一律留痕呈现 */
export function embeddedBrowseReducer(
  state: EmbeddedBrowseState,
  event: RemoteContentEventV1,
): EmbeddedBrowseState {
  if (event.kind === "view-opened") {
    return { viewId: event.viewId, currentUrl: event.url, lastBlocked: null };
  }
  if (event.kind === "navigated" && state.viewId !== null && event.viewId === state.viewId) {
    return { ...state, currentUrl: event.url };
  }
  if (event.kind === "view-closed") {
    if (event.viewId === "" || event.viewId === state.viewId) {
      return { ...state, viewId: null, currentUrl: null };
    }
    return state;
  }
  if (event.kind === "blocked") {
    return { ...state, lastBlocked: event.url };
  }
  return state;
}
