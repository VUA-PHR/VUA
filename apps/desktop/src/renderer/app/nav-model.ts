import type { Strings } from "../i18n/strings.en.ts";
import type { TermId } from "../i18n/terms.ts";

/**
 * 信息架构与导航模型(美术方案 v0.5.0 §2.1)。
 * 一级 Tab = 指挥台 + 四类用户目标(环境部署/游戏引导/工具合集/模型生产,
 * S-XIII-3 起工具合集第四、模型生产第五),
 * 设置不是用户目标,固定在顶部最右侧但仍参与路由、颜色辖区与侧栏计算;
 * 仓库/车间/包管理仅为模型生产侧栏分组,不产生独立模块;
 * 任意已开放功能进入对应 Tab 后一次点击到达(验收 §12-6)。
 *
 * 门控语义(v0.3.3 §2.1 的页面粒度解释):
 * 不自动切页、不强制重定向。车间依赖生产环境,未就绪时车间页内显示
 * 诚实阻断态与"前往准备生产环境"按钮(见 WorkshopPage),用户点击后才跳转;
 * S-XIII-2 起模型生产 Tab 不再持角标,未就绪信息由页面自身表达。
 *
 * 文案纪律(i18n 预备):本文件不持有任何文案字面量,只持有字符串表
 * key 与术语 id;显示文案由表现层经 strings / termLabel 解析。
 */

/** 四类用户目标(业务模块);与首次引导的目标 id 一致(onboarding-model.GoalId) */
export type BusinessModuleId = "env" | "guide" | "production" | "tools";

/** 应用区块:指挥台首页 + 业务模块 + 独立的设置区 */
export type AppSectionId = "home" | BusinessModuleId | "settings";

export type PageId =
  | "home"
  | "env-play"
  | "env-create"
  | "guide-start"
  | "guide-basics"
  | "guide-safety"
  | "guide-devices"
  | "guide-tutorials"
  | "import-material"
  | "compose"
  | "warehouse"
  | "recipe"
  | "inspection"
  | "release"
  | "workshop"
  | "packages"
  | "tools-discover"
  | "tools-devices"
  | "tools-calibration"
  | "tools-installed"
  | "settings-goals"
  | "settings-environment"
  | "settings-language"
  | "settings-theme"
  | "settings-version"
  | "settings-experimental"
  | "settings-about"
  | "settings-donate";

type NavTabKey = keyof Strings["nav"]["tabs"];
type NavGroupKey = keyof Strings["nav"]["groups"];
type NavPageKey = keyof Strings["nav"]["pages"];

export interface SidebarPage {
  id: PageId;
  /** 文案 key(strings.nav.pages);术语页为 null */
  labelKey: NavPageKey | null;
  /** 术语页标签:由这些术语组成(表现层 termLabel/termSequence 渲染) */
  labelTerms?: readonly TermId[];
}

export interface SidebarGroup {
  /** 分组标签 key(strings.nav.groups),无分组时省略 */
  labelKey?: NavGroupKey;
  pages: SidebarPage[];
}

export interface ModuleDef {
  id: AppSectionId;
  /** Tab 文案 key(strings.nav.tabs) */
  labelKey: NavTabKey;
  defaultPage: PageId;
  groups: SidebarGroup[];
  /** 指挥台首页:整页宽布局,不渲染二级侧栏 */
  hideSidebar?: boolean;
}

/** 默认落点:无历史页面时打开指挥台首页(S-VFX-2;原 guide-start 默认已被取代) */
export const defaultPage: PageId = "home";

/** 指挥台首页(S-VFX-2):整页宽布局(无侧栏),固定 Tab 首位 */
export const homeModule: ModuleDef = {
  id: "home",
  labelKey: "home",
  defaultPage: "home",
  hideSidebar: true,
  groups: [
    {
      pages: [{ id: "home", labelKey: "home" }],
    },
  ],
};

/** Tab 顺序即顶部从左到右:指挥台 + 四个业务模块 */
export const businessModules: readonly ModuleDef[] = [
  homeModule,
  {
    id: "env",
    labelKey: "env",
    defaultPage: "env-play",
    groups: [
      {
        pages: [
          { id: "env-play", labelKey: "envPlay" },
          { id: "env-create", labelKey: "envCreate" },
        ],
      },
    ],
  },
  {
    id: "guide",
    labelKey: "guide",
    defaultPage: "guide-start",
    groups: [
      {
        pages: [
          { id: "guide-start", labelKey: "guideStart" },
          { id: "guide-basics", labelKey: "guideBasics" },
          { id: "guide-safety", labelKey: "guideSafety" },
          { id: "guide-devices", labelKey: "guideDevices" },
          { id: "guide-tutorials", labelKey: "guideTutorials" },
        ],
      },
    ],
  },
  {
    id: "tools",
    labelKey: "tools",
    defaultPage: "tools-discover",
    groups: [
      {
        pages: [
          { id: "tools-discover", labelKey: "toolsDiscover" },
          { id: "tools-devices", labelKey: "toolsDevices" },
          { id: "tools-calibration", labelKey: "toolsCalibration" },
          { id: "tools-installed", labelKey: "toolsInstalled" },
        ],
      },
    ],
  },
  {
    id: "production",
    labelKey: "production",
    defaultPage: "warehouse",
    groups: [
      {
        labelKey: "warehouse",
        pages: [
          // 素材导入(设计标准 0.7.0 §8.3:连续素材获取路径的独立页,置于
          // 仓储相邻位——先获取后管理)
          { id: "import-material", labelKey: "importMaterial" },
          // 搭配草稿(019 批 B:项目无关草稿,连续路径的搭配起点)
          { id: "compose", labelKey: "composePage" },
          { id: "warehouse", labelKey: null, labelTerms: ["warehouse"] },
          { id: "recipe", labelKey: null, labelTerms: ["recipe"] },
          // 检查页(BG-15,设计标准 §8.6):报告/证据/下一步;置于出厂前——
          // 主流程「装配 → 检测 → SDK 交接」的检测落点
          { id: "inspection", labelKey: null, labelTerms: ["inspection"] },
          { id: "release", labelKey: null, labelTerms: ["release"] },
        ],
      },
      {
        labelKey: "workshop",
        pages: [
          { id: "workshop", labelKey: null, labelTerms: ["assembly", "production", "inspection"] },
        ],
      },
      {
        labelKey: "packages",
        pages: [
          { id: "packages", labelKey: "packages" },
          // 项目兼容不再持独立页(proposal 026 B,用户 2026-09-18 裁决):
          // 其读面段并入包管理器页尾部分区(PackagesPage 内 ProjectCompatSection)
        ],
      },
    ],
  },
];

/** 设置区:固定顶部最右侧,承载目标重选、语言、主题、版本、关于与捐赠(§2.1) */
export const settingsModule: ModuleDef = {
  id: "settings",
  labelKey: "settings",
  defaultPage: "settings-goals",
  groups: [
    {
      pages: [
        { id: "settings-goals", labelKey: "settingsGoals" },
        { id: "settings-environment", labelKey: "settingsEnvironment" },
        { id: "settings-language", labelKey: "settingsLanguage" },
        { id: "settings-theme", labelKey: "settingsTheme" },
        { id: "settings-version", labelKey: "settingsVersion" },
        { id: "settings-experimental", labelKey: "settingsExperimental" },
        { id: "settings-about", labelKey: "settingsAbout" },
        { id: "settings-donate", labelKey: "settingsDonate" },
      ],
    },
  ],
};

export const modules: readonly ModuleDef[] = [...businessModules, settingsModule];

const pageModule = new Map<PageId, AppSectionId>(
  modules.flatMap((m) => m.groups.flatMap((g) => g.pages.map((p) => [p.id, m.id] as const))),
);

const pageIds = new Set<string>(pageModule.keys());

export function isPageId(value: string | null): value is PageId {
  return value !== null && pageIds.has(value);
}

export function moduleOf(page: PageId): AppSectionId {
  const found = pageModule.get(page);
  if (!found) throw new Error(`unknown page: ${page}`);
  return found;
}

export function moduleDef(id: AppSectionId): ModuleDef {
  const found = modules.find((m) => m.id === id);
  if (!found) throw new Error(`unknown module: ${id}`);
  return found;
}

/**
 * 从启动落点到达某页所需点击数:
 * 同模块内 = 1 次侧栏点击;跨模块 = 1 次 Tab + 至多 1 次侧栏;
 * 最坏情况 2 次(§2.1:进入对应 Tab 后一次点击到达)。
 */
export function clicksToReach(page: PageId, from: PageId = defaultPage): number {
  if (page === from) return 0;
  if (moduleOf(page) === moduleOf(from)) return 1;
  return page === moduleDef(moduleOf(page)).defaultPage ? 1 : 2;
}

/** Tab 落点:进入该模块的默认页,不做门控 */
export function resolveTabLanding(tab: AppSectionId): PageId {
  return moduleDef(tab).defaultPage;
}

/**
 * 顶栏窄窗分级折叠(S-XIII-2 初版;S-XIV-3 升级为梯子,借鉴 Comfy-Desktop
 * 标题栏的实测驱动分级降级):
 * - 0 级 = 完整(品牌副标题 + 全量 Tab);
 * - 1 级 = 隐藏副标题:Tab 排与两侧的间隙低于 TIGHT_GAP 就先降这一级,
 *   不等真正溢出;
 * - 2 级 = 整排 Tab 收进一个折叠按钮(NavOverflowMenu 展开原控件);
 * 回扩要求可用宽度多出 BUFFER 余量(1→0 还要加计副标题收益),
 * 防临界点抖动;各级宽度全部由表现层实测传入,本函数保持纯。
 */
/** 降级触发间隙:Tab 排可用间隙低于此值即先藏副标题 */
export const NAV_TIGHT_GAP_PX = 16;
/** 回扩余量:恢复一级要求可用宽度多出这么多 */
export const NAV_LEVEL_BUFFER_PX = 24;

export type NavLevel = 0 | 1 | 2;

export interface NavLevelInput {
  readonly level: NavLevel;
  /** 全量 Tab 自然宽(量尺行实测) */
  readonly required: number;
  /** 轨道内容盒当前宽 */
  readonly available: number;
  /** 副标题收益(隐藏探针实测的自然宽):1→0 回扩判定的恢复成本 */
  readonly subtitleSaving: number;
}

export function navLevelNext(input: NavLevelInput): NavLevel {
  const { level, required, available, subtitleSaving } = input;
  if (level === 0) return required > available - NAV_TIGHT_GAP_PX ? 1 : 0;
  if (level === 1) {
    if (required > available) return 2;
    return required + subtitleSaving <= available - NAV_LEVEL_BUFFER_PX ? 0 : 1;
  }
  return required <= available - NAV_LEVEL_BUFFER_PX ? 1 : 2;
}

/**
 * 判定输入快照(#28 顶栏抖动修复):决定分级的外部事实只有三样——窗口宽、
 * 全量 Tab 自然宽(量尺行)、副标题收益(探针)。折叠/展开动作本身会改变
 * 轨道内容盒宽(滚动条出现消失、布局回流),ResizeObserver 据此再次触发
 * 判定即在临界宽度下形成 1↔2 自反馈振荡;快照未变则该次触发必是自反馈,
 * 判定跳过——观察者仍监听窗口/量尺/探针,语言切换与用户改窗照常重判。
 */
export interface NavMeasureSnapshot {
  /** 视口宽(window.innerWidth,含滚动条):不随折叠/展开动作变化 */
  readonly windowWidth: number;
  /** 全量 Tab 自然宽(量尺行实测) */
  readonly required: number;
  /** 副标题收益(探针实测) */
  readonly subtitleSaving: number;
}

export function navMeasureChanged(
  prev: NavMeasureSnapshot | null,
  next: NavMeasureSnapshot,
): boolean {
  if (prev === null) return true;
  return prev.windowWidth !== next.windowWidth
    || prev.required !== next.required
    || prev.subtitleSaving !== next.subtitleSaving;
}
