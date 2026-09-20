import type {
  PackagesInstallPlanV02,
  PackagesInstallReceiptV02,
  PackagesOpsRejectedV02,
  PackagesPackageRequestV02,
  PackagesRemovePlanV01,
  PackagesRemoveReceiptV01,
  PackagesRemoveRejectedV01,
} from "@vua/contracts";
import type {
  PackagesRegisterReceiptV03,
  PackagesRegisterRejectedV03,
  PackagesRemoteRepoAddedV04,
  PackagesLocalRepoAddedV04,
  PackagesRepoRejectedV04,
  PackagesRepoRemovedV04,
} from "@vua/contracts";
import type {
  PackagesProjectCreatedV05,
  PackagesCreateRejectedV05,
} from "@vua/contracts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

/** A1 移除写面冻结词面(026;镜像 @vua/contracts application-contract.ts
 *  A1 段——词面权威,投影与窄化纪律见 packages-live.ts) */
export type {
  PackagesChangeItemV01,
  PackagesRemovePlanV01,
  PackagesRemoveReceiptV01,
  PackagesRemoveRejectedV01,
} from "@vua/contracts";

/** A2 安装/升级写面冻结词面(026 packages-ops v0.2;镜像 @vua/contracts
 *  application-contract.ts A2 段——词面权威,投影与窄化纪律见
 *  packages-live.ts) */
export type {
  PackagesInstallPlanV02,
  PackagesInstallReceiptV02,
  PackagesOpsRejectedV02,
  PackagesPackageRequestV02,
} from "@vua/contracts";

/** A3 本地包注册写面冻结词面(026 packages-ops v0.3;镜像 @vua/contracts
 *  application-contract.ts A3 段——词面权威,投影与窄化纪律见
 *  packages-live.ts) */
export type { PackagesRegisterResultV03 } from "@vua/contracts";

/** A4 仓库订阅增删写面冻结词面(026 packages-ops v0.4;镜像 @vua/contracts
 *  application-contract.ts A4 段——词面权威,投影与窄化纪律见
 *  packages-live.ts) */
export type {
  PackagesLocalRepoAddedV04,
  PackagesRemoteRepoAddedV04,
  PackagesRepoRejectedV04,
  PackagesRepoRemovedV04,
} from "@vua/contracts";

/** A5 项目创建写面冻结词面(026 packages-ops v0.5;镜像 @vua/contracts
 *  application-contract.ts A5 段——词面权威,投影与窄化纪律见
 *  packages-live.ts)。created 收据 = 端口 ProjectRef {id, root} 投影四
 *  键闭集(packages-ops 族唯一有实际载荷的收据);rejected guard 三值闭
 *  集复用 A1–A4 零新增 */
export type {
  PackagesCreateProjectResultV05,
  PackagesCreateRejectedV05,
  PackagesProjectCreatedV05,
} from "@vua/contracts";

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
 * - A1 移除写面消费批(026 冻结批 TS 面经第 99 批入库＋wire 接线批
 *   41503a4,2026-09-19):packages.previewRemove(同步只读变更预览,
 *   确认链第一步)与 packages.applyRemove(九态任务化移除写命令,双摘
 *   要守卫——confirmedDigest 漂移即拒 preview_drift recoverable 冲突,
 *   重预览重确认绝不静默覆盖,诚实纪律 3)已消费;blocks.changes 权威
 *   事实源 = served_capabilities 的 packages.removeOps 能力行(随引擎
 *   后端 remove_packages 能力声明翻转,false = 行缺席或不可用,写入口
 *   不渲染——渲染层不伪造)。
 * - A2 安装/升级写面消费批(026 packages-ops v0.2 冻结批 8552d2c 经第
 *   101 批入库＋wire 接线批 61da51a 经第 102 批入库＋钉法缺口收口
 *   beb7d34 经第 104 批入库,2026-09-19):packages.previewInstall(同步
 *   只读安装/升级预览,依赖解析可达仓库)与 packages.applyInstall(九
 *   态任务化安装写命令,双摘要守卫同 A1)已消费;blocks.installs 权威
 *   事实源 = served_capabilities 的 packages.installOps 能力行(一位服
 *   务 A2 双方法,removeOps 先例;false = 行缺席或不可用,安装入口不渲
 *   染);blocks.changes 键语义与来源零变更(A1 逐面升级承诺:纯增量新
 *   键,不改变已消费面的既有形状)。批量多选消费面解锁前置(同 id 唯一
 *   三层钉法)已落地,本批照 C 面自决程序先交付行内单包安装首面。
 * - A3 本地包注册写面消费批(026 packages-ops v0.3 冻结批 0282a66 经第
 *   105 批入库＋wire 接线批 45ec57c 经第 107 批入库＋桌面 A3 形状核可
 *   f1939d1 经第 106 批收编,2026-09-19):packages.registerLocalPackage
 *   (族中唯一无 preview 对偶的九态任务化注册写命令——幂等集合添加,
 *   AlreadyAdded 答成功折叠为一个成功事实;非破坏性;无 digest 无确认
 *   链,用户显式提交即确认;params 单键闭集 {packageRoot},无
 *   projectPath——注册只动后端隔离环境)已消费;blocks.registers 权威
 *   事实源 = served_capabilities 的 packages.registerOps 能力行(一行
 *   服务本方法,removeOps/installOps 先例;default declared-none 访问器
 *   翻转前如实 unavailable,false = 行缺席或不可用,注册入口不渲染);
 *   blocks.changes/installs 键语义与来源零变更(逐面升级承诺:纯增量
 *   新键,不改变已消费面的既有形状)。
 * - A4 仓库订阅增删写面消费批(026 packages-ops v0.4 冻结批 28c63fa 经
 *   第 108 批入库＋wire 接线批 3d4b667 经第 109 批入库＋桌面 A4 形状核
 *   可 6771d5e 经第 110 批收编,2026-09-19):packages.addRemoteRepo/
 *   packages.addLocalRepo/packages.removeRepo(照 A3 同律无 preview 对
 *   偶的三命令九态任务化写命令——远端订阅天然含清单拉取网络段,无既
 *   有状态摘要可绑定,用户显式提交即确认,无 digest 位无 projectPath;
 *   添加面与移除面都不宣称幂等:库面守卫拒绝重复/未知 id 如实折
 *   rejected 呈现,A3 AlreadyAdded 折叠刻意不复制)已消费;
 *   blocks.repoWrites 权威事实源 = served_capabilities 的 packages.
 *   repoOps 能力行(一行服务三方法,行可用性由后端 repo_write_
 *   capabilities 三独立位承载——任一位声明即 available;wire 门按方法
 *   绝不按面,部分声明后端上未声明方法的提交在路由层答 capability_
 *   missing 照原词呈现;false = 行缺席或不可用,仓库写入口不渲染);
 *   既有 blocks 键语义与来源零变更(逐面升级承诺:纯增量新键);启停
 *   (enable/disable)不在任何已冻结词面内(候 W25 VCC 禁用列表键名真
 *   机核实)——桌面不发明启停入口;重排不在本面。
 * - A5 项目创建写面消费批(026 packages-ops v0.5 冻结批 0c77273 经第
 *   112 批入库＋wire 接线批 8abb638 经第 113 批入库＋桌面 A5 形状核可
 *   a700e61 经第 113 批收编,2026-09-19):packages.createProject(照
 *   A3/A4 同律无 preview 对偶且根在端口的单命令九态任务化写命令——全
 *   新项目目录无既有状态可 diff 无摘要可绑定,用户显式表单提交即确认,
 *   无 digest 位无 projectPath;template REQUIRED-nullable,null = 后端
 *   默认模板解析非选择器,首面零新读面 templates.* 不立;创建不幂等:
 *   重复目录执行时拒绝如实折 rejected 呈现;created 收据 = ProjectRef
 *   投影四键闭集——projectId 信息性标识,projectPath = 注册路径身份)
 *   已消费;blocks.creates 权威事实源 = served_capabilities 的
 *   packages.createOps 能力行(一行服务本方法,removeOps/installOps/
 *   registerOps/repoOps 一行先例;行可用性 = 既有
 *   VpmCapabilities.create_project 五联位——A5 零新 accessor,与 A3/A4
 *   declared-none 缺省态不同构:位先于冻结批在库,双后端已声明 true;
 *   false = 行缺席或不可用,创建入口不渲染);create 能力呈现系新立键
 *   不可复用 blocks.changes(其语义 = 变更预览可用性,与「可新建项目」
 *   不同构——A5 形状核可裁定);既有 blocks 键语义与来源零变更(逐面
 *   升级承诺:纯增量新键)。
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
 * 已装包行 v0.2(027 F3 packages-query v0.2 冻结词面五键,镜像
 * @vua/contracts PackagesInstalledItemV02):v0.1 三键零变动＋判定对两
 * 键(必带可空)。虚假断言防线(024 表态②,用户裁定):latestVersion null
 * = 当前设置下无合资格版本(跨仓 max——刻意非 F2 分仓视图);updateAvailable
 * null = 判定未执行——null 绝不是「已最新」,消费端空显绝不默认 false;
 * false 精确语义 =「当前过滤条件下不存在严格更新版本」,非泛化「无更新」。
 */
export interface InstalledPackageRowV02 extends InstalledPackageRowV01 {
  readonly latestVersion: string | null;
  readonly updateAvailable: boolean | null;
}

/**
 * packages.listInstalled 双族应答事实(027 F3 消费批):盖戳族常量判别
 * 应答词面世代,消费端读戳辨族永不猜测(catalog v0.2 双版本协商先例)。
 * v0.1 族 = 冻结三键行(零判定事实,消费端不虚构「可更新」列内容与缓
 * 存标注);v0.2 族 = 五键行(判定对)＋必带 cacheSourced 信息性降级披
 * 露(true = 缓存降级路径所得,呈现「缓存数据」标注非失败;false = 在
 * 线刷新所得,无标注)。
 */
export type InstalledListAnswer =
  | {
      readonly family: "vua.packages-installed/v0.1";
      readonly rows: readonly InstalledPackageRowV01[];
    }
  | {
      readonly family: "vua.packages-installed/v0.2";
      readonly rows: readonly InstalledPackageRowV02[];
      readonly cacheSourced: boolean;
    };

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
 * F2 仓库级包行(027 packages-repo-catalog v0.1 冻结词面五键闭集,镜像
 * @vua/contracts PackagesRepoCatalogPackageV01):库面实际上限闭集——
 * author 刻意缺席(库面 manifest 反序列化闭集无 author 字段,单事实源
 * 裁决,发明即形状违反)、compatible 刻意不存在(无工程上下文判定不可
 * 执行,恒 null 非事实);displayName null 呈现 = packageId 兼任显示名
 * (P1 裁决 3,不冒充字段事实);latestVersion null = 当前设置下无合资格
 * 版本——缺席不是「无包」,呈现层不得渲染「已最新」类断言;versionCount
 * = 仓库缓存自身清单计数(yanked 计入)——缓存事实非可用性承诺。
 */
export interface RepoCatalogPackageRowV01 {
  readonly packageId: string;
  readonly displayName: string | null;
  readonly description: string | null;
  readonly latestVersion: string | null;
  readonly versionCount: number;
}

/**
 * F2 仓库行(027 冻结词面四键闭集,镜像 @vua/contracts
 * PackagesRepoCatalogRepoV01):cached 必带 = 逐仓库缓存命中事实,
 * false = 已订阅未刷新——其自身诚实状态以空 packages 数组如实呈现,
 * 不隐藏不伪造;行序 = 集合自身枚举顺序照实投影,客户端不重排。
 */
export interface RepoCatalogRepoRowV01 {
  readonly repoId: string | null;
  readonly name: string | null;
  readonly cached: boolean;
  readonly packages: readonly RepoCatalogPackageRowV01[];
}

/**
 * F2 仓库级目录事实(027 冻结词面,镜像 @vua/contracts
 * PackagesRepoCatalogResultV01 去 schemaVersion 信封键):repos 空数组
 * = 诚实零仓库缓存应答;cacheSourced 必带信息性降级披露(出生即带,
 * catalog v0.2 先例)——true = 缓存降级路径所得,呈现「缓存数据」信息
 * 标注非失败;false = 在线刷新所得,无标注。
 */
export interface RepoCatalogFactsV01 {
  readonly repos: readonly RepoCatalogRepoRowV01[];
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
   * P1 中间诚实态(024 冻结批;「已安装可看、变更面随能力行解锁」):
   * - blocks 是区块可用性标注,权威事实源 = served_capabilities 的
   *   packages.query 能力行;repos 在 P1 词面无对应方法行类型级恒 false;
   *   changes 权威事实源 = packages.removeOps 能力行(026 A1 写面:随
   *   引擎后端 remove_packages 能力声明翻转,false = 行缺席或不可用,
   *   写入口不渲染,渲染层不伪造);installs 权威事实源 =
   *   packages.installOps 能力行(026 A2 安装/升级写面消费批,一位服务
   *   双方法,同翻转纪律;A1 逐面升级承诺 = 纯增量新键,changes 语义与
   *   来源零变更);registers 权威事实源 = packages.registerOps 能力行
   *   (026 A3 本地包注册写面消费批,一行一方法,同翻转纪律;逐面升级
   *   承诺 = 纯增量新键,既有键语义与来源零变更);repoWrites 权威事实
   *   源 = packages.repoOps 能力行(026 A4 仓库订阅增删写面消费批,一
   *   行服务三方法,removeOps/installOps/registerOps 一行先例;行可用
   *   性由后端 repo_write_capabilities 三独立位承载——任一位声明即
   *   available,wire 门按方法绝不按面,部分声明后端上未声明方法的提
   *   交在路由层答 capability_missing 照原词呈现;同翻转纪律;逐面升
   *   级承诺 = 纯增量新键,既有键语义与来源零变更);creates 权威事实
   *   源 = packages.createOps 能力行(026 A5 项目创建写面消费批,一行
   *   一方法,repoOps 一行先例;行可用性 = 既有 VpmCapabilities.
   *   create_project 五联位,A5 零新 accessor、无 declared-none 缺省态
   *   ——位先于冻结批在库双后端已声明 true;create 能力呈现系新立键
   *   不可复用 blocks.changes——语义不同构,核可裁定;同翻转纪律;逐
   *   面升级承诺 = 纯增量新键,既有键语义与来源零变更);
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
        readonly changes: boolean;
        readonly installs: boolean;
        readonly registers: boolean;
        readonly repoWrites: boolean;
        readonly creates: boolean;
      };
      readonly projectPath: string | null;
      readonly installedPackages: readonly (InstalledPackageRowV01 | InstalledPackageRowV02)[];
      /** 027 F3:仅 v0.2 族应答携带(族常量判别,v0.1 族应答绝不虚构) */
      readonly installedCacheSourced?: boolean;
      readonly loadError?: PackagesP1LoadError;
    }
  /**
   * P2 读面诚实态(025 冻结批消费批;「已装可看 + 订阅清单/包目录按
   * 能力行解锁、变更面随 removeOps/installOps 能力行解锁」):
   * - blocks.repos/catalog 权威事实源 = served_capabilities 的
   *   packages.listRepos/packages.packageCatalog 能力行(随引擎后端
   *   catalog_capabilities 声明翻转);false = 该读面当前无能力行或行
   *   不可用,对应区块不渲染(渲染层不伪造);changes 权威事实源 =
   *   packages.removeOps 能力行(026 A1 写面消费批,同翻转纪律);
   *   installs 权威事实源 = packages.installOps 能力行(026 A2 安装/
   *   升级写面消费批,一位服务双方法,同翻转纪律);registers 权威事实
   *   源 = packages.registerOps 能力行(026 A3 本地包注册写面消费批,
   *   一行一方法,同翻转纪律);repoWrites 权威事实源 = packages.repoOps
   *   能力行(026 A4 仓库订阅增删写面消费批,一行服务三方法,同翻转纪
   *   律);creates 权威事实源 = packages.createOps 能力行(026 A5 项目
   *   创建写面消费批,一行一方法,同翻转纪律);
   * - repos 行序 = 订阅面自身顺序(配置事实,客户端不重排);空数组 =
   *   诚实零订阅;reposError = listRepos typed 失败(错误码原词),存
   *   在时仓库区呈现失败而非空态(两者严格区分);
   * - installedPackages/loadError 语义与 ready-p1 相同。
   * - repoCatalog 权威事实源 = packages.repoCatalogOps 能力行(027 F2
   *   仓库级包目录读面消费批:一行服务 packages.repoCatalog,removeOps/
   *   installOps/registerOps/repoOps/creates 一行先例;default
   *   declared-none 访问器门控,环境覆写置真前如实 unavailable;同翻转
   *   纪律;逐面升级承诺 = 纯增量新键,既有键语义与来源零变更);
   * - 包目录事实不进快照:按需查询粒度(双键闭集),经
   *   PackagesPort.packageCatalog 由选中包驱动,页面局部承载;
   *   F2 仓库级目录事实同理不进快照:经 PackagesPort.repoCatalog 由
   *   仓库行展开驱动,页面局部承载。
   */
  | {
      schemaVersion: 1;
      kind: "ready-p2";
      readonly blocks: {
        readonly installed: boolean;
        readonly repos: boolean;
        readonly catalog: boolean;
        readonly changes: boolean;
        readonly installs: boolean;
        readonly registers: boolean;
        readonly repoWrites: boolean;
        readonly creates: boolean;
        /** F2 仓库级包目录读面(027 消费批):权威事实源 = served_
         *  capabilities 的 packages.repoCatalogOps 能力行(default
         *  declared-none 访问器门控,环境覆写置真前如实 unavailable);
         *  false = 行缺席或不可用,仓库浏览入口不渲染(渲染层不伪造);
         *  纯增量新键,既有键语义与来源零变更(逐面升级承诺) */
        readonly repoCatalog: boolean;
      };
      readonly projectPath: string | null;
      readonly installedPackages: readonly (InstalledPackageRowV01 | InstalledPackageRowV02)[];
      /** 027 F3:仅 v0.2 族应答携带(族常量判别,v0.1 族应答绝不虚构) */
      readonly installedCacheSourced?: boolean;
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

/**
 * A1 移除写面结果(026 冻结词面;applyRemove 任务化消费四态):
 * - ok = 审计收据(确认指纹回显＋请求清单＋实际移除行,014 导入收据
 *   先例同构);
 * - rejected = 类型化守卫拒绝(guard 三值闭集 preview_drift/
 *   package_not_found/execution_failed;preview_drift 系 recoverable
 *   冲突——重预览重确认,绝不静默覆盖,诚实纪律 3);
 * - failed = 受理信封错误或任务非成功终态(typed 码原词:受理持久化
 *   失败 vua.provider.persistence_failed 等);
 * - unavailable = 引擎缺席/断连/超时无法确认结果(不猜测不伪造,
 *   任务真实状态由任务中心呈现——014 先例)。
 */
export type PackagesRemoveApplyOutcome =
  | { readonly kind: "ok"; readonly receipt: PackagesRemoveReceiptV01 }
  | { readonly kind: "rejected"; readonly rejection: PackagesRemoveRejectedV01 }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

/**
 * A2 安装/升级写面结果(026 packages-ops v0.2 冻结词面;applyInstall
 * 任务化消费四态,与 A1 移除四态同构):
 * - ok = 审计收据(installReceipt 变体:确认指纹回显＋请求行 verbatim
 *   携版本选择语义＋实际应用行,014 导入收据先例同构);
 * - rejected = 类型化守卫拒绝(guard 三值闭集复用 A1——preview_drift/
 *   package_not_found/execution_failed;preview_drift 系 recoverable
 *   冲突——重预览重确认,绝不静默覆盖,诚实纪律 3);
 * - failed = 受理信封错误或任务非成功终态(typed 码原词:预览/查询段
 *   失败 vua.packages.preview_failed〔A2 信封新码〕等);
 * - unavailable = 引擎缺席/断连/超时无法确认结果(不猜测不伪造,
 *   任务真实状态由任务中心呈现——014 先例)。
 */
export type PackagesInstallApplyOutcome =
  | { readonly kind: "ok"; readonly receipt: PackagesInstallReceiptV02 }
  | { readonly kind: "rejected"; readonly rejection: PackagesOpsRejectedV02 }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

/**
 * A3 本地包注册写面结果(026 packages-ops v0.3 冻结词面;
 * registerLocalPackage 任务化消费四态,与 A1/A2 四态同构):
 * - ok = 审计收据(registered 变体:最小诚实三键回显 {schemaVersion,
 *   kind, packageRoot}——端口答 unit 无载荷,收据只携请求回显别无他物;
 *   AlreadyAdded 幂等折叠 = 无首次/重复事实,一个成功事实);
 * - rejected = 类型化守卫拒绝(guard 三值闭集复用 A1/A2 零新增;
 *   原端口码 vua.vpm.local_package_invalid/local_package_register_failed
 *   在 detail 原词溯源,不入 code 键);
 * - failed = 受理信封错误或任务非成功终态(typed 码原词:能力缺席
 *   vua.vpm.capability_missing 在路由层答、受理持久化失败
 *   vua.provider.persistence_failed 等);
 * - unavailable = 引擎缺席/断连/超时无法确认结果(不猜测不伪造,
 *   任务真实状态由任务中心呈现——014 先例)。
 */
export type PackagesRegisterApplyOutcome =
  | { readonly kind: "ok"; readonly receipt: PackagesRegisterReceiptV03 }
  | { readonly kind: "rejected"; readonly rejection: PackagesRegisterRejectedV03 }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

/**
 * A4 仓库订阅添加写面结果(026 packages-ops v0.4 冻结词面;
 * addRemoteRepo/addLocalRepo 任务化消费四态,与 A1/A2/A3 四态同构):
 * - ok = 审计收据(repoReceipt 变体:remote 五键 {schemaVersion,
 *   kind, repoType: "remote", url 回显, name 回显} / local 五键
 *   {同前, repoType: "local", path 回显, name 回显}——端口答
 *   Result<(),_> 无载荷,收据只携请求回显别无他物,不发明时间戳/行位/
 *   清单内容);
 * - rejected = 类型化守卫拒绝(guard 三值闭集复用 A1/A2/A3 零新增;
 *   原端口码 vua.vpm.repo_invalid/repo_fetch_failed 在 detail 原词溯
 *   源,不入 code 键);**添加面不宣称幂等**——与 A3 AlreadyAdded 折叠
 *   刻意不同(库面守卫拒绝重复订阅如实 repo_invalid 折 rejected),拒
 *   绝如实呈现,不发明幂等成功;
 * - failed = 受理信封错误或任务非成功终态(typed 码原词:能力缺席
 *   vua.vpm.capability_missing 在路由层答、受理持久化失败
 *   vua.provider.persistence_failed 等);
 * - unavailable = 引擎缺席/断连/超时无法确认结果(不猜测不伪造,
 *   任务真实状态由任务中心呈现——014 先例)。
 */
export type PackagesRepoAddApplyOutcome =
  | {
      readonly kind: "ok";
      readonly receipt: PackagesRemoteRepoAddedV04 | PackagesLocalRepoAddedV04;
    }
  | { readonly kind: "rejected"; readonly rejection: PackagesRepoRejectedV04 }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

/**
 * A4 仓库订阅移除写面结果(026 packages-ops v0.4 冻结词面;
 * removeRepo 任务化消费四态,与添加四态同构):
 * - ok = 审计收据(removed 三键 {schemaVersion, kind, repoId 回显}——
 *   回显即审计链,不发明被删行快照);
 * - rejected = 类型化守卫拒绝(同添加;原端口码 vua.vpm.repo_not_found/
 *   repo_write_failed 在 detail 原词溯源;移除面同样不宣称幂等——重复
 *   移除未知 id 如实 repo_not_found);
 * - failed/unavailable 语义与添加四态相同。
 */
export type PackagesRepoRemoveApplyOutcome =
  | { readonly kind: "ok"; readonly receipt: PackagesRepoRemovedV04 }
  | { readonly kind: "rejected"; readonly rejection: PackagesRepoRejectedV04 }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

/**
 * A5 项目创建写面结果(026 packages-ops v0.5 冻结词面;
 * createProject 任务化消费四态,与 A1–A4 四态同构):
 * - ok = created 收据(端口 ProjectRef {id, root} 投影四键闭集
 *   {schemaVersion, kind, projectId, projectPath}——packages-ops 族唯
 *   一有实际载荷的收据;projectId = 端口铸造事实回显,信息性标识非 013
 *   身份键;projectPath = 新项目根目录 = 注册路径身份,创建即在册冻结
 *   端口事实:双后端成功路径尾调 FileSystemProjectStore::initialize,
 *   创建成功即在册、在册列表刷新即见;不发明创建时间戳/复制统计/包清
 *   单);
 * - rejected = 类型化守卫拒绝(guard 三值闭集复用 A1–A4 零新增;原端
 *   口码 vua.vpm.template_missing〔库路径四 i18n 键共享载体——双后端
 *   拒绝形状不同构如实载明〕/vua.vpm.apply_failed〔CLI 超时/非零退出
 *   携 exitCode 与登记腿〕/vua.vpm.backend_unavailable〔CLI runner 故
 *   障〕在 detail 原词溯源,不入 code 键);**创建不幂等**——重复目录
 *   执行时拒绝如实折 rejected 呈现,A3 AlreadyAdded 折叠刻意不复制;
 * - failed = 受理信封错误或任务非成功终态(typed 码原词:能力缺席
 *   vua.vpm.capability_missing 在路由层答、受理持久化失败
 *   vua.provider.persistence_failed 等);
 * - unavailable = 引擎缺席/断连/超时无法确认结果(不猜测不伪造,
 *   任务真实状态由任务中心呈现——014 先例)。
 */
export type PackagesCreateApplyOutcome =
  | { readonly kind: "ok"; readonly receipt: PackagesProjectCreatedV05 }
  | { readonly kind: "rejected"; readonly rejection: PackagesCreateRejectedV05 }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

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
   * P1 词面消费(packages.listInstalled,024 冻结批;027 F3 消费批起双
   * 族协商):单个已注册项目的已装包集合;projectId 参数即 013 注册路
   * 径(P1 视图无第二项目身份)。应答按盖戳族常量辨世代(InstalledList
   * Answer):v0.1 族 = 冻结三键行零判定事实;v0.2 族 = 五键行判定对＋
   * cacheSourced 披露——updateAvailable null = 判定未执行绝不渲染「已
   * 最新」绝不默认 false。unavailable = 引擎缺席/未接线;failed 携带
   * typed 错误码原词(vua.project.project_not_found 等),不折叠为空态。
   */
  listInstalled(
    projectPath: string,
  ): Promise<
    | { readonly kind: "ok"; readonly result: InstalledListAnswer }
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
  /**
   * F2 词面消费(packages.repoCatalog,027 packages-repo-catalog v0.1
   * 冻结批):仓库级可装包清单只读查询——双键必带可空 params verbatim
   * 传输:repoId null = 全部仓库逐仓分组(跨仓合并不存在于本面,同名包
   * 在各仓各自出现),非空串 = 只答该仓库行(词表外 id = 端口答
   * vua.vpm.repo_not_found,逐字透传——P2 读面零折叠,不折叠为空态);
   * packageIds null = 不过滤浏览,非空 = Recipe 需求集合批量过滤(唯一
   * 非空 id;空数组 = 形状违反,UI 不构造)。逐仓 latestVersion 判定无
   * 工程 Unity 约束,null = 当前设置下无合资格版本(缺席不是「无包」,
   * 呈现层不渲染「已最新」类断言);cacheSourced = true 呈现「缓存数据」
   * 信息标注非失败。unavailable = 引擎缺席/未接线或 served 行 declared
   * -none(环境覆写置真前诚实缺席);failed 携带 typed 错误码原词,不折
   * 叠不猜测。
   */
  repoCatalog(
    repoId: string | null,
    packageIds: readonly string[] | null,
  ): Promise<
    | { readonly kind: "ok"; readonly result: RepoCatalogFactsV01 }
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
  /**
   * A1 词面消费(packages.previewRemove,026 冻结批):移除将造成的全部
   * 变更预览(含传递依赖移除)与摘要指纹 digest——确认链第一步,永不
   * 变更任何状态;packageIds = 显式非空闭列(无通配无「移除全部」速记)。
   * failed 携带信封 typed 码原词(vua.project.project_not_found = 未注册
   * 路径复用码;vua.packages.package_not_found = 请求移除的包不在已装
   * 集合;vua.vpm.capability_missing = 引擎后端未声明 remove_packages),
   * 不折叠不猜测。
   */
  previewRemove(
    projectPath: string,
    packageIds: readonly string[],
  ): Promise<
    | { readonly kind: "ok"; readonly plan: PackagesRemovePlanV01 }
    | { readonly kind: "failed"; readonly code: string }
    | { readonly kind: "unavailable" }
  >;
  /**
   * A1 词面消费(packages.applyRemove,026 冻结批):任务化移除写命令
   * (import-copy 同构——端口内封装受理→终态等待→Done payload 窄化,
   * 020 result 回流先例);confirmedDigest 必携 = previewRemove 结果的
   * digest,服务端执行前复算,漂移即拒 preview_drift(recoverable 冲突
   * ——重预览重确认,绝不静默覆盖,诚实纪律 3;权威判定在服务端)。
   * 任务九态语义(可取消/事件＋revision/恢复 inspect_required 绝不隐
   * 式续传)归应用契约任务面;任务真实状态由任务中心呈现,本端口只消
   * 费终态结果(014 先例)。
   */
  applyRemove(
    projectPath: string,
    packageIds: readonly string[],
    confirmedDigest: string,
  ): Promise<PackagesRemoveApplyOutcome>;
  /**
   * A2 词面消费(packages.previewInstall,026 packages-ops v0.2 冻结批):
   * 安装/升级将造成的全部变更预览(依赖解析可达仓库,在线刷新失败降级
   * 缓存——缓存降级是文档载明的行为,不是本面传输的事实)与摘要指纹
   * digest——确认链第一步,永不变更任何状态;packages = 请求行闭列
   * ({packageId, version string|null},version null = 解析器选最新稳定
   * 版,string = 钉死精确版本,升级/降级同语法——A2 词面不立 upgrade
   * 动词;同 packageId 重复 = 词面违反,行间 id 唯一在信封守卫钉死)。
   * failed 携带信封 typed 码原词(vua.project.project_not_found = 未注册
   * 路径复用码;vua.packages.preview_failed = A2 信封新码——预览/查询段
   * 失败〔仓库解析、IO、外部失败类〕;vua.vpm.capability_missing =
   * 引擎后端未声明 preview_install),不折叠不猜测。
   */
  previewInstall(
    projectPath: string,
    packages: readonly PackagesPackageRequestV02[],
  ): Promise<
    | { readonly kind: "ok"; readonly plan: PackagesInstallPlanV02 }
    | { readonly kind: "failed"; readonly code: string }
    | { readonly kind: "unavailable" }
  >;
  /**
   * A2 词面消费(packages.applyInstall,026 packages-ops v0.2 冻结批):
   * 任务化安装写命令(import-copy 同构——端口内封装受理→终态等待→
   * Done payload 窄化,020 result 回流先例);confirmedDigest 必携 =
   * previewInstall 结果的 digest,服务端执行前复算,漂移即拒
   * preview_drift(recoverable 冲突——重预览重确认,绝不静默覆盖,诚实
   * 纪律 3;权威判定在服务端)。任务九态语义(可取消/事件＋revision/
   * 恢复 inspect_required 绝不隐式续传)归应用契约任务面;任务真实状态
   * 由任务中心呈现,本端口只消费终态结果(014 先例)。
   */
  applyInstall(
    projectPath: string,
    packages: readonly PackagesPackageRequestV02[],
    confirmedDigest: string,
  ): Promise<PackagesInstallApplyOutcome>;
  /**
   * A3 词面消费(packages.registerLocalPackage,026 packages-ops v0.3
   * 冻结批):任务化本地包注册写命令(import-copy/A1/A2 同构——端口内
   * 封装受理→终态等待→Done payload 窄化,020 result 回流先例)。
   * packageRoot = 本地包根目录(含 package.json),单键闭集,verbatim
   * 传输;注册只动后端隔离环境,无 projectPath(不触项目、不触用户
   * VCC/ALCOM 设置)。族中唯一无 preview 对偶的写面:无 digest 无确认
   * 链——用户显式提交即确认(携 confirmedDigest = 形状违反,负例钉死);
   * 幂等集合添加,AlreadyAdded 折叠为同一个成功事实。任务九态语义归
   * 应用契约任务面;任务真实状态由任务中心呈现,本端口只消费终态结果。
   */
  registerLocalPackage(packageRoot: string): Promise<PackagesRegisterApplyOutcome>;
  /**
   * A4 词面消费(packages.addRemoteRepo,026 packages-ops v0.4 冻结批):
   * 任务化远端仓库订阅写命令(import-copy/A1/A2/A3 同构——端口内封装
   * 受理→终态等待→Done payload 窄化,020 result 回流先例)。params 双
   * 键闭集 {url, name} verbatim 传输;无 projectPath(订阅面只写后端隔
   * 离环境)、无 digest 位(本面无 preview 可漂移——用户显式提交即确
   * 认,携 confirmedDigest = 形状违反)、首期词面不收 HTTP 头/凭据。
   * 添加面不宣称幂等:库面守卫拒绝重复订阅如实折 rejected 呈现。
   * 任务九态语义归应用契约任务面;任务真实状态由任务中心呈现,本端口
   * 只消费终态结果。
   */
  addRemoteRepo(url: string, name: string): Promise<PackagesRepoAddApplyOutcome>;
  /**
   * A4 词面消费(packages.addLocalRepo,026 packages-ops v0.4 冻结批):
   * 任务化本地目录仓库订阅写命令(无网络段);params 双键闭集
   * {path, name} verbatim 传输;无 digest 无确认链同 addRemoteRepo。
   */
  addLocalRepo(path: string, name: string): Promise<PackagesRepoAddApplyOutcome>;
  /**
   * A4 词面消费(packages.removeRepo,026 packages-ops v0.4 冻结批):
   * 任务化订阅移除写命令;params 单键闭集 {repoId} verbatim 传输(稳定
   * 行柄;id 缺席行在本词面移除可达范围之外——列表 id 为 null 的行不
   * 提供移除入口,UI 不发明)。未知 repoId = 执行时端口答
   * repo_not_found 折 rejected 呈现(移除面同样不宣称幂等)。删除订阅
   * 行不删任何包文件与项目内容(非破坏性,ADR-0006 延迟警示路径不适
   * 用;行内两击确认是纯 UX 步骤,不发明词面事实)。
   */
  removeRepo(repoId: string): Promise<PackagesRepoRemoveApplyOutcome>;
  /**
   * A5 词面消费(packages.createProject,026 packages-ops v0.5 冻结批):
   * 任务化项目创建写命令(import-copy/A1–A4 同构——端口内封装受理→终
   * 态等待→Done payload 窄化,020 result 回流先例)。params 三键闭集
   * {parent, name, template} verbatim 传输:parent = 新项目目录的父目
   * 录(路径事实,非在册项目身份;创建不寻址任何在册项目,无
   * projectPath),name 后端名称校验为执行时权威(表单前置校验仅作
   * UI 引导),template REQUIRED-nullable(null = 后端默认模板解析
   * 〔库路径默认 Avatar 三级解析序,冻结词面事实非选择器,首面零新读
   * 面〕;非空串 = verbatim;空串 = 形状违反,UI 不构造)。照 A3/A4 同
   * 律无 preview 对偶且根在端口:无 digest 无确认链——用户显式表单提
   * 交即确认。**创建不幂等**:重复目录执行时拒绝如实折 rejected 呈现
   * (原端口码 detail 溯源),不发明幂等成功。created 收据 = ProjectRef
   * 投影四键闭集;创建即在册(冻结端口事实)——成功后广播新快照,在
   * 册列表刷新即见。任务九态语义归应用契约任务面;任务真实状态由任务
   * 中心呈现,本端口只消费终态结果。
   */
  createProject(parent: string, name: string, template: string | null): Promise<PackagesCreateApplyOutcome>;
  setRepoEnabled(repoId: string, enabled: boolean): Promise<PackagesView>;
  capability(): Promise<CapabilityReport>;
}
