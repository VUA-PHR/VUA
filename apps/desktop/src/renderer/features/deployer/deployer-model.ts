/**
 * 部署器表现模型(美术方案 v0.3.3 §4)。
 * 纯函数、无 IO:环境检测的真实数据由 Rust 应用层注入,这里只负责呈现决策。
 *
 * 部署器分两个辖区(§2.1):游玩环境(VRChat / VR 运行时 / 网络)与
 * 创作环境(Unity / VPM / 磁盘)。检查项按 zone 归属,两个页面各自汇总;
 * 其中创作环境就绪是 AMF 车间页的唯一硬门控(nav-model.resolvePageLanding)。
 *
 * 文案纪律(i18n 预备):本文件不持有任何文案字面量。辖区文案在
 * strings.deployer.zones[zone] 按 zone id 直接索引;汇总结果返回
 * 字符串 key + 插值参数,由表现层查表展开。
 */

/** info = 中性事实项:未安装的可选项(同属替代组且组已被其它成员满足),
 *  不构成待办、不点亮红绿灯警示色 */
export type CheckStatus = "ok" | "warning" | "error" | "info";

/** 部署器辖区:play = 游玩环境,create = 创作环境(与 strings.deployer.zones 键一致) */
export type CheckZone = "play" | "create";

export interface CheckItem {
  id: string;
  zone: CheckZone;
  /** 卡片标题,如 "VRChat 本体"(数据负载,由数据源提供) */
  title: string;
  status: CheckStatus;
  /** 一行玩家语言说明(§4.1) */
  description: string;
  /** 单项修复入口文案,动词短语;无修复入口时省略 */
  fixLabel?: string;
  /** 替代组 id(CHECK_GROUPS):同组任一成员 detected 即满足整组;
   *  无 groupId 的项独立计数 */
  groupId?: string;
}

/**
 * 替代组注册表(消费侧呈现决策,契约授权消费侧做严重度裁决):
 * 同组检查项互为替代关系——VRChat 游玩只需要其中任一可用路径,
 * 缺装未拥有的品牌运行时不是问题。引擎只报各项在场事实,
 * "任选其一"的归组与计数属于本层。
 * 当前唯一组:游玩辖区的 VR 运行时与串流(引擎 inspect_zone 七项)。
 */
export const CHECK_GROUPS = [
  {
    id: "vr_runtime",
    zone: "play",
    memberIds: [
      "steamvr",
      "openxr_runtime",
      "oculus_runtime",
      "pico_runtime",
      "vive_runtime",
      "virtual_desktop",
      "alvr",
    ],
  },
] as const;

/** 替代组裁决:任一成员 ok → 整组 ok;无 ok 且有检测失败成员 → error;
 *  全部未检测到 → warning(一张待办卡,而非每成员一张) */
export function summarizeGroup(members: readonly CheckItem[]): Exclude<CheckStatus, "info"> {
  if (members.some((item) => item.status === "ok")) return "ok";
  if (members.some((item) => item.status === "error")) return "error";
  return "warning";
}

/** 结论文案 key:"ready" 取辖区 readyHeadline;"pending" 取 summary.pending 并展开 {count};
 * "empty" 取 summary.empty(空列表:无证据不得判就绪,原则①) */
export type HeadlineKey = "ready" | "pending" | "empty";

/** 主按钮文案 key:strings.deployer.summary.cta*(empty 时表现层隐藏主按钮) */
export type CtaKey = "enterNext" | "fixAll";

export interface HealthSummary {
  ready: boolean;
  /** 未就绪项数量(warning 与 error 计入;未满足的替代组整组计 1 项;
   *  info 中性项不计入) */
  pendingCount: number;
  /** 汇总后的最差状态,驱动英雄区状态灯;空列表为 "unknown"(无数据,非"正常") */
  overall: CheckStatus | "unknown";
  headlineKey: HeadlineKey;
  /** headlineKey = "pending" 时的插值参数 */
  headlineParams: { count: number };
  ctaKey: CtaKey;
}

export function summarizeHealth(items: CheckItem[]): HealthSummary {
  // 空列表 ≠ 全部正常:没有检测证据时绝不给出就绪结论(原则①)
  if (items.length === 0) {
    return {
      ready: false,
      pendingCount: 0,
      overall: "unknown",
      headlineKey: "empty",
      headlineParams: { count: 0 },
      ctaKey: "fixAll",
    };
  }
  // 替代组整组计数:组满足(任一成员 ok)时组内其余非 ok 成员是可选事实,
  // 不产生待办;组未满足时整组只计 1 项待办(任选其一即可,不逐项告警)
  const ungrouped = items.filter((item) => item.groupId === undefined);
  const groups = new Map<string, CheckItem[]>();
  for (const item of items) {
    if (item.groupId === undefined) continue;
    const members = groups.get(item.groupId);
    if (members) members.push(item);
    else groups.set(item.groupId, [item]);
  }
  const ungroupedPending = ungrouped.filter(
    (item) => item.status === "warning" || item.status === "error",
  ).length;
  const groupVerdicts = [...groups.values()].map(summarizeGroup);
  const unsatisfiedGroups = groupVerdicts.filter((verdict) => verdict !== "ok").length;
  const pendingCount = ungroupedPending + unsatisfiedGroups;
  const ready = pendingCount === 0;
  const overall: CheckStatus =
    ungrouped.some((item) => item.status === "error") || groupVerdicts.includes("error")
      ? "error"
      : pendingCount > 0
        ? "warning"
        : "ok";
  return {
    ready,
    pendingCount,
    overall,
    headlineKey: ready ? "ready" : "pending",
    headlineParams: { count: pendingCount },
    ctaKey: ready ? "enterNext" : "fixAll",
  };
}

/**
 * 单辖区检测证据:结论只由本辖区检测项与检测时间支撑(两辖区互不污染)。
 */
export interface ZoneCheckResult {
  items: CheckItem[];
  /** ISO 时间戳:结论基于何时的检测证据,表现层如实展示 */
  checkedAt: string;
}

/**
 * 单辖区状态机(C-ENV):not-run →(用户主动 runCheck)→ running →
 * results / failed。running 与 failed 携带上次证据(last):旧证据只以
 * "时间戳 + 仅供参考"呈现,不得升级为当前结论;failed 本身是最新事实(原则①)。
 */
export type ZonePhase =
  | { kind: "not-run" }
  | { kind: "running"; startedAt: string; last: ZoneCheckResult | null }
  | ({ kind: "results" } & ZoneCheckResult)
  | { kind: "failed"; last: ZoneCheckResult | null };

/**
 * 部署器页面视图:两辖区各自独立的状态机,结论互不污染(C-ENV)。
 * 任一辖区无 results 证据时,该辖区必须呈现诚实的未检测/检测中/失败状态,
 * 不得展示虚构的检查结论(美术方案原则①)。
 */
export interface DeployerView {
  zones: Record<CheckZone, ZonePhase>;
}

/** 初始视图:两辖区均无检测证据 */
export function neverChecked(): DeployerView {
  return { zones: { play: { kind: "not-run" }, create: { kind: "not-run" } } };
}

/* ---- 版本轨道(S-XV,借鉴 Comfy-Desktop VersionStatPanel)---- */

/** 版本轨道状态:结论由数据源给出(版本比较语义属于数据源,
 *  前端不做词法猜测);unknown = 未检测到已安装或最新值 */
export type VersionTrackState = "up-to-date" | "update-available" | "unknown";

/** 单条版本轨道:运行库/依赖的已安装与最新可用事实 */
export interface VersionTrack {
  id: string;
  /** 轨道名负载(由数据源提供,如 "Unity 编辑器") */
  title: string;
  /** 已安装版本;未检测到为 null */
  installed: string | null;
  /** 最新可用版本;未知为 null */
  latest: string | null;
  /** 上次核对时间(ISO);从未核对为 null */
  checkedAt: string | null;
  state: VersionTrackState;
}

export type RelativeTimeKey = "justNow" | "minutesAgo" | "hoursAgo" | "daysAgo";

/** 相对时间分桶(相对时间显示、绝对时间挂 title):
 *  <1min justNow;<60min minutes;<24h hours;否则 days(截断不进位);
 *  非法时间戳返回 null(表现层显示占位) */
export function relativeTimeKey(
  iso: string,
  now: number,
): { key: RelativeTimeKey; count: number } | null {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  const diffMin = Math.max(0, Math.floor((now - at) / 60000));
  if (diffMin < 1) return { key: "justNow", count: 0 };
  if (diffMin < 60) return { key: "minutesAgo", count: diffMin };
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return { key: "hoursAgo", count: diffHours };
  return { key: "daysAgo", count: Math.floor(diffHours / 24) };
}

/**
 * 创作环境是否就绪:驱动 AMF Tab 角标与车间页门控(§2.1)。
 * 创作辖区必须是 results 且至少一项全部通过;not-run / running / failed
 * 一律视为未就绪,防止检测器漏报创作项时被误判为就绪。
 */
export function creatorEnvReady(view: DeployerView): boolean {
  const create = view.zones.create;
  if (create.kind !== "results") return false;
  return create.items.length > 0 && create.items.every((item) => item.status === "ok");
}
