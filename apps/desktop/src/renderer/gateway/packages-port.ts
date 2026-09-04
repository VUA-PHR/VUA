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
 * - 真实引擎(orchestrator 侧)接入见 GitHub issue #25;本契约即其前端边界。
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
