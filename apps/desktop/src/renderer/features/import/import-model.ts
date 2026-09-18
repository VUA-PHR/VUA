import type { DownloadsListCompletedItemV04, RemoteContentEventV1 } from "@vua/contracts";

/**
 * 素材导入页云端段「内嵌浏览面板」的呈现纯函数(M6 IMP-2 批 A,proposal 015
 * 对账;design-standard 0.7.0 §8.3):
 * - 能力两态(两态开关,desktop 架构 1.1.0):壳能力自报(preload
 *   capabilities.remoteBrowser;app.snapshot 信封同源同值,#36 缺陷4′ 对齐)
 *   驱动呈现——false = 未接线诚实降级(不可用标注,无替代假动作);
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

/** 壳能力自报标志(preload 面;信封同源同值) → 面板两态(未知 = 保守不可用,不猜测) */
export function browseAvailability(remoteBrowser: unknown): EmbeddedBrowseAvailability {
  return remoteBrowser === true ? { kind: "available" } : { kind: "unavailable" };
}

/* ---- 已完成下载收窄(BOARD #36 缺陷②修复批,2026-09-18) ----
 * live wire 形状 = bdl-queries 三键信封(provider-host bdl_query_success:
 * schemaVersion "0.4" + operation + result 本体),不是契约平铺值
 * {downloads}——此前读 value.downloads 恒 undefined→诚实 unavailable
 * (「仓库服务尚未接入」假象,引擎侧直调实为健康)。修法自决申报:渲染层
 * 按嵌套路径收窄(与 packages-live 信封收窄同纪律);路由层统一解包否决——
 * live wire 各族信封异构(bdl/packages 嵌套 result,release/project 平铺
 * 合并),统一解包需按族 wire 知识进 Kernel 且会破坏既有三个信封感知端口。
 * 词表外信封或形态不齐行如实判不可解释,不猜测。 */

const BDL_QUERIES_ENVELOPE_SCHEMA_VERSION = "0.4";
const DOWNLOADS_LIST_COMPLETED_OPERATION = "downloads.listCompleted";

/** 行六键闭集(DownloadsListCompletedItemV04 镜像):多余键/缺键/类型不符
 * = 形态不齐,该行如实丢弃(半可信不渲染,与仓储列表同纪律) */
function isDownloadsRow(value: unknown): value is DownloadsListCompletedItemV04 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  const expected = [
    "adoptedWarehouseItemIds",
    "completedAt",
    "downloadId",
    "receivedBytes",
    "sourceUrl",
    "suggestedFileName",
  ];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  const row = value as Record<string, unknown>;
  return typeof row.downloadId === "string"
    && row.downloadId.length > 0
    && typeof row.sourceUrl === "string"
    && row.sourceUrl.length > 0
    && (row.suggestedFileName === null || typeof row.suggestedFileName === "string")
    && typeof row.receivedBytes === "number"
    && Number.isSafeInteger(row.receivedBytes) && row.receivedBytes >= 0
    && typeof row.completedAt === "string"
    && row.completedAt.length > 0
    && Array.isArray(row.adoptedWarehouseItemIds)
    && row.adoptedWarehouseItemIds.every((id) => typeof id === "string");
}

/**
 * downloads.listCompleted 应答收窄:信封三键 + result.downloads 行数组。
 * 返回 null = 信封词表外/本体或任一行形态不齐(提供方响应不可解释,调用方
 * 如实 unavailable——行是采纳命令的身份事实,不渲染半可信清单);空数组 =
 * 诚实零下载(空态即终态)。
 */
export function narrowCompletedDownloads(
  value: unknown,
): readonly DownloadsListCompletedItemV04[] | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const envelope = value as Record<string, unknown>;
  if (envelope.schemaVersion !== BDL_QUERIES_ENVELOPE_SCHEMA_VERSION) return null;
  if (envelope.operation !== DOWNLOADS_LIST_COMPLETED_OPERATION) return null;
  const result = envelope.result;
  if (typeof result !== "object" || result === null || Array.isArray(result)) return null;
  const downloads = (result as Record<string, unknown>).downloads;
  if (!Array.isArray(downloads)) return null;
  const rows: DownloadsListCompletedItemV04[] = [];
  for (const raw of downloads) {
    if (!isDownloadsRow(raw)) return null;
    rows.push(raw);
  }
  return rows;
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

/**
 * 内嵌浏览面板生命周期代次(BOARD #37 修复,2026-09-18;承 #25 卸载即关):
 * dev 的 StrictMode 对每个组件效果双调用(mount→cleanup→mount),「卸载
 * 布尔」形态的守卫(原 disposedRef 只在清理效果置 true、无挂载复位)在
 * 第二次挂载后永真——此后任意 open 落定的竞态兜底把每个新视图立即关闭,
 * 自动打开与「打开」按钮全部失效,内嵌浏览完全无法进入(#37 根因)。
 * 代次模型:挂载与卸载都推进代次,open 发起时捕获当前代次,open 落定时
 * 比较——
 * - 捕获代次 = 当前代次:open 属于活跃挂载,视图保留(#37 修复);
 * - 失配:open 属于已卸载实例(真实切页后落定)或已过期挂载(StrictMode
 *   首挂的 auto-open,二次挂载后才落定)——视图随即关闭,不留失联视图,
 *   也不留 StrictMode 首挂孤儿视图(#25 语义保持 + dev 无泄漏形态)。
 * 提取为纯对象模型使完整时序(mount→cleanup→remount→open 落定)可在
 * 无 DOM 测试面锁定;组件效果只做接线,不携带生命周期判定。
 */
export interface BrowsePanelLifecycle {
  /** 挂载接线:推进代次并返回新代次(每次挂载效果执行恰好调用一次) */
  mount(): number;
  /** 卸载接线:推进代次,使该实例此前捕获的 open 全部落入失配 */
  unmount(): void;
  /** open 发起时捕获当前代次 */
  capture(): number;
  /** 代次失配判定:true = 该 open 属已卸载/过期挂载,视图应随即关闭 */
  isStale(capturedGeneration: number): boolean;
}

export function createBrowsePanelLifecycle(): BrowsePanelLifecycle {
  let generation = 0;
  return {
    mount() {
      generation += 1;
      return generation;
    },
    unmount() {
      generation += 1;
    },
    capture() {
      return generation;
    },
    isStale(capturedGeneration: number) {
      return capturedGeneration !== generation;
    },
  };
}

/* ---- 地址栏输入归一化与打开失败分类(BOARD #39 修复,2026-09-18) ----
 * 用户真机实测:地址栏输入裸域名 booth.pm(无 https:// 前缀)点「打开」,
 * openAddress 原样透传,Main 侧 isAllowedRemoteOrigin 的 URL 解析对无
 * scheme 输入失败→按 origin_not_allowed 拒绝;渲染层 catch 又误用仓储
 * 命令文案(vua_warehouse_unavailable「仓库服务尚未接入」)呈现与本错误
 * 完全无关的文本,用户据此外观误判 #37 未修复。修法:输入归一化(裸域名
 * 自动补 https://,把「用户可读地址」翻译成「可解析 URL」)＋失败按拒绝
 * 原因准确呈现。Main 侧清单裁决(authority)不变——归一化只加 scheme
 * 前缀并本地预验可解析,不放宽任何 Main 判定。 */

/** 地址归一化结果:open = 可解析 URL(交 Main 按清单裁决);invalid =
 *  输入无法构成合法 URL(本地失败态呈现,不上 Main 不猜测) */
export type NormalizedBrowseAddress =
  | { readonly kind: "open"; readonly url: string }
  | { readonly kind: "invalid" };

const ADDRESS_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * 地址栏输入归一化:无 scheme 的裸域名(判据照登记——不含 scheme、不以
 * "/" 开头、含 ".")自动补 https:// 前缀;已带 scheme 的输入原样验证不
 * 加工(清单协议裁决归 Main,渲染层不越权二次分流);其余输入(无点、
 * 以 "/" 开头)不补前缀,连同补全后仍解析失败的输入一并返回 invalid。
 * 返回值恒为可解析 URL 的标准形(open)或 invalid,不以不可解析字符串
 * 透传 Main。
 */
export function normalizeBrowseAddress(raw: string): NormalizedBrowseAddress {
  const input = raw.trim();
  if (input === "") return { kind: "invalid" };
  const hasScheme = ADDRESS_SCHEME_PATTERN.test(input);
  const bareDomain = !hasScheme && !input.startsWith("/") && input.includes(".");
  const candidate = hasScheme || !bareDomain ? input : `https://${input}`;
  try {
    return { kind: "open", url: new URL(candidate).toString() };
  } catch {
    return { kind: "invalid" };
  }
}

/** 内嵌视图 open 失败的呈现分类:invalid-address = 输入无法解析(本地);
 *  origin-not-allowed = Main 清单外拒绝;open-failed = 其它失败(如实
 *  通用呈现,不猜测具体原因,不借用其它命令面文案) */
export type EmbeddedBrowseOpenFailure =
  | { readonly kind: "invalid-address" }
  | { readonly kind: "origin-not-allowed" }
  | { readonly kind: "open-failed" };

/**
 * Main 侧 open 拒绝分类:Main 侧 vua:remote-content:open 对清单外来源
 * 唯一抛 Error("origin_not_allowed")(remote-content open/navigate 同
 * 码),Electron invoke reject 的 Error message 保留该错误串——按此识别
 * 清单外拒绝;其余错误(unknown_remote_view/时序面等)一律 open-failed
 * 如实通用呈现,不猜测。
 */
export function classifyRemoteOpenError(error: unknown): EmbeddedBrowseOpenFailure {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("origin_not_allowed")
    ? { kind: "origin-not-allowed" }
    : { kind: "open-failed" };
}

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
