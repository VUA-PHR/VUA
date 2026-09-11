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

/** 云端段默认首页(用户实测缺口修复 2026-09-12):booth.pm 在浏览允许清单
 *  内(U9 双轨:浏览清单与下载域清单分开);面板首开自动导航至此,后续
 *  导航历史照常保留,「回首页」按钮同址。 */
export const BOOTH_HOME_URL = "https://booth.pm/";

/** 地址脱敏显示(导航条只读位):origin + 路径,弃查询串与片段——登录态
 *  令牌/追踪参数不展示;解析失败如实回显原文(不猜测) */
export function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/** app.snapshot 的能力标志 → 面板两态(未知快照 = 保守不可用,不猜测) */
export function browseAvailability(remoteBrowser: unknown): EmbeddedBrowseAvailability {
  return remoteBrowser === true ? { kind: "available" } : { kind: "unavailable" };
}

/** 字节 → 人读量级(1024 进位;B 档整数,KB 起一位小数去尾零)。
 *  与 project-compat-model 同规则(单位错位缺陷修复的同一形态,各档边界
 *  由彼处测试与本页 receivedBytes 呈现共用语义)。 */
export function bytesText(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    unit === 0 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
  return `${rounded} ${units[unit]}`;
}

export interface EmbeddedBrowseState {
  /** 当前托管视图身份;null = 无打开视图 */
  readonly viewId: string | null;
  /** 视图当前地址(navigated 事件同步;用户输入草稿不入此状态) */
  readonly currentUrl: string | null;
  /** 导航历史可走性(navigated 事件同步;导航条后退/前进按钮禁用判据) */
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  /** 最近一次策略拦截目标(诚实呈现;null = 无) */
  readonly lastBlocked: string | null;
}

export const initialEmbeddedBrowseState: EmbeddedBrowseState = {
  viewId: null,
  currentUrl: null,
  canGoBack: false,
  canGoForward: false,
  lastBlocked: null,
};

/** remote-content 事件流归约:只跟踪当前托管视图(单视图面板;多视图管理
 *  超出本页面板语义),blocked 一律留痕呈现 */
export function embeddedBrowseReducer(
  state: EmbeddedBrowseState,
  event: RemoteContentEventV1,
): EmbeddedBrowseState {
  if (event.kind === "view-opened") {
    return { viewId: event.viewId, currentUrl: event.url, canGoBack: false, canGoForward: false, lastBlocked: null };
  }
  if (event.kind === "navigated" && state.viewId !== null && event.viewId === state.viewId) {
    return {
      ...state,
      currentUrl: event.url,
      canGoBack: event.canGoBack,
      canGoForward: event.canGoForward,
    };
  }
  if (event.kind === "view-closed") {
    if (event.viewId === "" || event.viewId === state.viewId) {
      return { ...state, viewId: null, currentUrl: null, canGoBack: false, canGoForward: false };
    }
    return state;
  }
  if (event.kind === "blocked") {
    return { ...state, lastBlocked: event.url };
  }
  return state;
}
