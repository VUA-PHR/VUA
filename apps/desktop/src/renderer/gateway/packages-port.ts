import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * VPM 包管理窄端口(S-XVI;调研 docs/research/vrc-get-vcc-research.md)。
 *
 * 定位:
 * - Recipe 复制/分享是包装配的主路径;本端口支撑 Recipe 之外的手动
 *   VPM 操作面(包管理页):项目库浏览、包安装/升级/移除、本地包导入、
 *   仓库订阅启停。
 * - 诚实纪律:版本状态(updateAvailable / compatible / yanked)全部由
 *   端口给出,表现层不做版本词法比较;能力未接入时一律 unavailable /
 *   not-connected,不编造包清单。
 * - 变更一律两阶段:先 previewChanges 拿分类预览(含冲突与 legacy 移除
 *   清单),用户确认后 applyChanges 才落地;破坏性预览由表现层延迟确认。
 * - 真实引擎(orchestrator 侧)接入路由见 collab/proposals/024-packages-wire-face.md
 *   (packages.* wire 面 P1/P2/P3 分期方向稿;原锚 GitHub issue #25 经核实不存在,
 *   2026-09-17 更正,wt-2 gh 核实照录);本契约即其前端边界。
 * - P1 中间诚实态(024 冻结批消费批,2026-09-17):词面单方法
 *   packages.listInstalled 已消费(ready-p1 视图变体,区块可用性标注的
 *   权威事实源 = served_capabilities 的 packages.query 能力行);P3 变
 *   更面无词表无事实源,changes 区块类型级恒 false,写入口不渲染。
 * - P2 读面诚实态(025 冻结批消费批,2026-09-17):packages.listRepos
 *   (订阅清单,ready-p2 repos 行承载)+ packages.packageCatalog(单
 *   包目录按需查询)已消费;blocks.repos/catalog 权威事实源 =
 *   served_capabilities 对应能力行(随引擎 catalog_capabilities 声明
 *   翻转,未实现即诚实不可渲染),健康面非目标零拟态词。v0.2 增量批
 *   (2026-09-17)消费更新:packageCatalog 双族协商(v0.1 七键/v0.2
 *   八键 cacheSourced 披露),盖戳族常量辨词面永不猜测。
 */

/** 包来源:官方 / 官方精选 / 社区订阅 / 本地导入(玩家语言,不暴露 VPM 术语) */
export type PackageSource = "official" | "curated" | "community" | "local";

/** 仓库健康:VUA 自建能力(ALCOM 短板);unknown 为未核对,不猜测 */
export type RepoHealth = "unknown" | "ok" | "stale" | "unreachable";

export interface PackageProject {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  /** 未知缺省,不猜测 */
  readonly unityVersion?: string;
  /** 无效行降级:禁用交互并解释原因(strings.packages.projects.invalidReasons) */
  readonly valid: boolean;
  readonly invalidReasonKey?: string;
  readonly favorite: boolean;
}

export interface PackageVersionEntry {
  readonly version: string;
  /** 不兼容版本分组到分隔线下方(ALCOM 手法) */
  readonly compatible: boolean;
  /** 已撤回版本:红字标注,默认不选 */
  readonly yanked?: boolean;
}

export interface PackageRow {
  readonly id: string;
  readonly displayName: string;
  readonly description?: string;
  readonly source: PackageSource;
  /** null = 未安装 */
  readonly installedVersion: string | null;
  readonly latestVersion: string | null;
  /** 端口计算,前端不比较版本 */
  readonly updateAvailable: boolean;
  readonly versions: readonly PackageVersionEntry[];
  readonly changelogUrl?: string;
}

export interface RepoInfo {
  readonly id: string;
  readonly name: string;
  readonly url?: string;
  readonly kind: "official" | "curated" | "community";
  /** 启停语义:停用不删数据 */
  readonly enabled: boolean;
  readonly health: RepoHealth;
  readonly lastCheckedAt?: string;
  readonly packageCount?: number;
}

/**
 * P1 已装包行(packages-query v0.1 冻结词面三键,镜像 @vua/contracts
 * PackagesInstalledItemV01;字段闭集 = 虚假断言防线:updateAvailable/
 * source/versions 等 P2 事实字段在词面不存在,消费层不发明)。
 */
export interface InstalledPackageRowV01 {
  readonly packageId: string;
  readonly version: string;
  readonly dependencies: readonly string[];
}

/**
 * P2 仓库订阅行(025 packages-repos v0.1 冻结词面五键闭集,镜像
 * @vua/contracts PackagesRepoInfoV01):订阅面为世界(用户配置事实),
 * 四标识/定位事实可空字符串(null = 库面 Option 如实投影,本地目录仓
 * 库 url = null);cached 必带 = 逐仓库缓存命中事实,false = 已订阅未
 * 刷新(其自身诚实状态,不隐藏不伪造成空目录)。字段闭集 = 虚假断言
 * 防线:health/status/lastRefreshed 等发明字段在词面不存在(P2 非目
 * 标,负面向量钉死),消费层不发明。
 */
export interface RepoInfoRowV01 {
  readonly repoId: string | null;
  readonly name: string | null;
  readonly url: string | null;
  readonly localPath: string | null;
  readonly cached: boolean;
}

/**
 * P2 目录版本行(packages-catalog v0.1 冻结词面三键,镜像
 * @vua/contracts PackagesCatalogVersionV01):yanked = 仓库缓存携带事
 * 实;compatible = 按选中工程 Unity 版本判定,null = 工程版本未知
 * (null 不是不兼容)。
 */
export interface CatalogVersionRowV01 {
  readonly version: string;
  readonly yanked: boolean;
  readonly compatible: boolean | null;
}

/**
 * P2 单包目录事实(packages-catalog v0.1 冻结词面七键闭集,镜像
 * @vua/contracts PackagesPackageCatalogResultV01 去 schemaVersion 信封
 * 键):source 二态("repo"|"local")与 installed 布尔分立必带——三态
 * 呈现(仓库包/本地包/已装)由两事实组合,词面不合并来源与安装;
 * updateAvailable = 冻结判定结论,null = 判定未执行(本工程未安装或
 * 工程 Unity 版本未知)——缺席不是「无更新」,null 时更新 UI 不渲染
 * 不以默认值填充(P1 防线延续);versions = 仓库缓存版本升序,local
 * 来源 = 空数组(诚实空,非错误;yanked 断言仅版本行携带,本地包行不
 * 渲染 yanked——「无缓存事实」≠「未 yanked」);displayName 可空
 * (null 以 packageId 兼任显示名,不冒充字段事实,P1 裁决 3)。
 */
export interface CatalogPackageFactsV01 {
  readonly projectPath: string;
  readonly packageId: string;
  readonly displayName: string | null;
  readonly source: "repo" | "local";
  readonly installed: boolean;
  readonly updateAvailable: boolean | null;
  readonly versions: readonly CatalogVersionRowV01[];
}

/**
 * P2 单包目录事实 v0.2(025 v0.2 增量冻结批词面,镜像 @vua/contracts
 * PackagesPackageCatalogResultV02 去 schemaVersion 信封键):冻结 v0.1
 * 七键恰加必带 cacheSourced,其余零变动。纯增量双版本协商:backend 未
 * 声明 v0.2 前以 v0.1 族应答(七键,消费端不虚构标注);盖戳族常量告知
 * 应答词面世代,客户端读戳辨族永不猜测。
 */
export interface CatalogPackageFactsV02 extends CatalogPackageFactsV01 {
  /** 信息性降级披露:true = 本次结果经缓存降级路径(offline→load_cache
   *  或在线 load 失败降级),呈现「缓存数据」标注——信息性非失败,绝不
   *  渲染为失败态;false = 在线刷新所得,无标注 */
  readonly cacheSourced: boolean;
}

/**
 * P1 读取失败形态:typed 错误码照原词呈现(工程事实,不猜测映射;
 * 复用码 vua.project.project_not_found = 选中项目已从 013 注册面消失,
 * 与「零已装包」的合法空数组严格区分——诚实纪律 2,失败不冒充空态)。
 */
export interface PackagesP1LoadError {
  readonly code: string;
}

/**
 * P2 读取失败形态(与 P1 同形:typed 错误码原词):listRepos 的
 * vua.vpm.capability_missing / 后端 typed 码与 packageCatalog 的
 * vua.vpm.no_matching_package(词表外无此包,独立空态呈现)/
 * vua.project.project_not_found 等各自照原词上呈,不折叠为空态。
 */
export interface PackagesP2LoadError {
  readonly code: string;
}

export type PackagesView =
  | { schemaVersion: 1; kind: "not-connected" }
  | {
      schemaVersion: 1;
      kind: "ready";
      readonly projects: readonly PackageProject[];
      readonly selectedProjectId: string | null;
      /** 当前选中项目的包清单 */
      readonly packages: readonly PackageRow[];
      readonly repos: readonly RepoInfo[];
      readonly migrationHint?: {
        readonly kind: "vpm" | "unity2022";
        readonly summaryKey: string;
      };
    }
  /**
   * P1 中间诚实态(024 冻结批;「已安装可看、变更面不可用」):
   * - blocks 是区块可用性标注,权威事实源 = served_capabilities 的
   *   packages.query 能力行;repos/changes 在 P1 词面无对应方法行,
   *   类型级恒 false(词表落地前不可能为 true,渲染层据此不渲染
   *   仓库分区与一切变更/写入入口);
   * - installedPackages 按 packageId 升序(冻结的确定性呈现事实),
   *   空数组 = 诚实零已装包;
   * - loadError = 最近一次 listInstalled 的 typed 失败(错误码原词),
   *   存在时表格区呈现失败而非空态。
   */
  | {
      schemaVersion: 1;
      kind: "ready-p1";
      readonly blocks: {
        readonly installed: boolean;
        readonly repos: false;
        readonly changes: false;
      };
      readonly projectPath: string | null;
      readonly installedPackages: readonly InstalledPackageRowV01[];
      readonly loadError?: PackagesP1LoadError;
    }
  /**
   * P2 读面诚实态(025 冻结批消费批;「已装可看 + 订阅清单/包目录按
   * 能力行解锁、变更面仍不可用」):
   * - blocks.repos/catalog 权威事实源 = served_capabilities 的
   *   packages.listRepos/packages.packageCatalog 能力行(随引擎后端
   *   catalog_capabilities 声明翻转);false = 该读面当前无能力行或行
   *   不可用,对应区块不渲染(渲染层不伪造);changes 在 P3 词面落地
   *   前类型级恒 false,一切写入口不渲染;
   * - repos 行序 = 订阅面自身顺序(配置事实,客户端不重排);空数组 =
   *   诚实零订阅;reposError = listRepos typed 失败(错误码原词),存
   *   在时仓库区呈现失败而非空态(两者严格区分);
   * - installedPackages/loadError 语义与 ready-p1 相同。
   * - 包目录事实不进快照:按需查询粒度(双键闭集),经
   *   PackagesPort.packageCatalog 由选中包驱动,页面局部承载。
   */
  | {
      schemaVersion: 1;
      kind: "ready-p2";
      readonly blocks: {
        readonly installed: boolean;
        readonly repos: boolean;
        readonly catalog: boolean;
        readonly changes: false;
      };
      readonly projectPath: string | null;
      readonly installedPackages: readonly InstalledPackageRowV01[];
      readonly loadError?: PackagesP1LoadError;
      readonly repos: readonly RepoInfoRowV01[];
      readonly reposError?: PackagesP2LoadError;
    };

/** 变更预览条目种类:大版本升级与降级在确认对话框中带警告条 */
export type PackageChangeKind =
  | "install"
  | "upgrade"
  | "majorUpgrade"
  | "downgrade"
  | "remove"
  | "reinstall";

export interface PackageChangeItem {
  readonly kind: PackageChangeKind;
  readonly packageId: string;
  readonly displayName: string;
  readonly fromVersion?: string;
  readonly toVersion?: string;
}

export interface PackageChangePreview {
  readonly id: string;
  readonly items: readonly PackageChangeItem[];
  /** 冲突红名单:messageKey 指向 strings.packages.changes.conflicts */
  readonly conflicts: readonly {
    readonly packageIds: readonly string[];
    readonly messageKey: string;
  }[];
  /** 将被移除的 legacy 目录名 */
  readonly legacyRemovals: readonly string[];
  /** true → 确认按钮走 DelayedButton 延迟确认 */
  readonly destructive: boolean;
}

export type ChangeRequest =
  | { readonly kind: "install"; readonly packageId: string; readonly version?: string }
  | { readonly kind: "update"; readonly packageId: string; readonly version?: string }
  | { readonly kind: "remove"; readonly packageId: string }
  | { readonly kind: "bulk-update-latest"; readonly packageIds: readonly string[] };

/** addProject / importLocalPackage 的三态结果:取消与未接入如实区分,不产生副作用 */
export type PackageEntryResult =
  | { readonly kind: "added"; readonly view: PackagesView }
  | { readonly kind: "cancelled" }
  | { readonly kind: "unavailable" };

export interface PackagesPort {
  snapshot(): Promise<PackagesView>;
  subscribe(callback: (view: PackagesView) => void): Unsubscribe;
  selectProject(projectId: string): Promise<PackagesView>;
  /**
   * P1 词面消费(packages.listInstalled,024 冻结批):单个已注册项目的
   * 已装包集合;projectId 参数即 013 注册路径(P1 视图无第二项目身份)。
   * unavailable = 引擎缺席/未接线;failed 携带 typed 错误码原词
   * (vua.project.project_not_found 等),不折叠为空态。
   */
  listInstalled(
    projectPath: string,
  ): Promise<
    | { readonly kind: "ok"; readonly result: readonly InstalledPackageRowV01[] }
    | { readonly kind: "failed"; readonly code: string }
    | { readonly kind: "unavailable" }
  >;
  /**
   * P2 词面消费(packages.packageCatalog,025 冻结批＋v0.2 增量批):单包
   * 目录事实按需查询——双键闭集 {projectPath(013 注册路径), packageId},
   * 无全量投影无分页;调用方必须持有工程上下文(compatible 判定绑定选中
   * 工程,无工程上下文不发起查询)。双族协商:v0.1 应答 = 七键事实(无
   * 披露字段,消费端不自行标注缓存来源);v0.2 应答 = 八键事实(含
   * cacheSourced 披露,true 时页面呈现「缓存数据」信息标注非失败)。
   * unavailable = 引擎缺席/未接线;failed 携带 typed 错误码原词
   * (vua.vpm.no_matching_package = 词表外无此包,呈现为独立空态非错误
   * 页),不折叠不猜测。
   */
  packageCatalog(
    projectPath: string,
    packageId: string,
  ): Promise<
    | { readonly kind: "ok"; readonly result: CatalogPackageFactsV01 | CatalogPackageFactsV02 }
    | { readonly kind: "failed"; readonly code: string }
    | { readonly kind: "unavailable" }
  >;
  /** 添加既有 Unity 项目文件夹(VUA 的项目创建走 Recipe-first,此处仅登记既有项目) */
  addProject(): Promise<PackageEntryResult>;
  /** 导入本地包(文件夹/压缩包):Recipe 之外的手动入口 */
  importLocalPackage(): Promise<PackageEntryResult>;
  previewChanges(
    requests: readonly ChangeRequest[],
  ): Promise<
    { readonly kind: "ok"; readonly preview: PackageChangePreview } | { readonly kind: "unavailable" }
  >;
  /** 应用已确认的预览;实现推进状态后广播新 snapshot */
  applyChanges(
    previewId: string,
  ): Promise<
    { readonly kind: "applied"; readonly view: PackagesView } | { readonly kind: "unavailable" }
  >;
  setRepoEnabled(repoId: string, enabled: boolean): Promise<PackagesView>;
  capability(): Promise<CapabilityReport>;
}
