import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { Icon } from "@vua/design-system";
import { format, strings, termLabel } from "../../i18n/index.ts";
import {
  useDataSource,
  useGateway,
  usePackagesView,
  type CapabilityReport,
  type CatalogPackageFactsV01,
  type CatalogPackageFactsV02,
  type ChangeRequest,
  type InstalledPackageRowV01,
  type PackageChangePreview,
  type PackageEntryResult,
  type PackageProject,
  type PackageRow,
  type PackageSource,
  type PackagesRemovePlanV01,
  type PackagesRemoveReceiptV01,
  type PackagesRemoveRejectedV01,
  type RegisteredProjectRow,
  type RepoInfoRowV01,
} from "../../gateway/index.ts";
import { ChangesDialog } from "./ChangesDialog.tsx";
import { PackageDetailDrawer } from "./PackageDetailDrawer.tsx";
import { PackageTable } from "./PackageTable.tsx";
import { ProjectCompatSection } from "./ProjectCompatSection.tsx";
import { RemoveConfirmDialog } from "./RemoveConfirmDialog.tsx";
import { RepoSection } from "./RepoSection.tsx";
import {
  SEARCH_DEBOUNCE_MS,
  TOAST_DURATION_MS,
  filterPackages,
  invalidReasonKey,
  isEmptyPreview,
  migrationSummaryKey,
  rangeSelect,
  removeEnvelopeErrorKey,
  sortPackages,
  sortProjects,
  sourceTextKeys,
} from "./packages-model.ts";
import "./packages.css";

const copy = strings.packages;

/**
 * 包管理页(S-XVI):Recipe 之外的手动 VPM 操作面。
 *
 * 状态机(诚实纪律):
 * - capability 查询中 → 骨架;unavailable/error → 整页诚实未接入空态
 *   (detailKey 文案来自 strings.capability.details);
 * - 视图 not-connected → EmptyState;无项目 → 空态 + 添加按钮(capability 门控);
 * - 视图 ready-p1(024 P1 中间诚实态)→ 项目选择器(013 注册清单)+
 *   已装包简表;repos 无词表行恒不渲染;移除写入口随 removeOps 能力行
 *   解锁(026 A1 消费批:previewRemove 确认链 + applyRemove 任务面);
 * - 视图 ready-p2(025 P2 读面消费批)→ P1 布局 + 仓库订阅区块(能力行
 *   解锁,cached=false「已订阅·缓存未建立」诚实态,零健康拟态词)+
 *   行内目录查询入口(按需;compatible 绑定选中工程,无工程上下文不
 *   渲染入口;no_matching_package = 独立空态;updateAvailable null =
 *   更新行不渲染;v0.2 cacheSourced=true =「缓存数据」信息标注,v0.1
 *   无字段不虚构)+ 移除写入口(随 removeOps 能力行解锁,同 P1);
 * - 有项目 → 项目头 + 迁移卡 + 工具栏 + 表格;切换项目时表格区骨架
 *   (stale-while-revalidate,其余区域不清空);
 * - demo 泛型变更链(fixture 面):previewChanges → ChangesDialog 确认 →
 *   applyChanges;破坏性预览的确认钮由 ChangesDialog 内 DelayedButton
 *   延迟解锁;live A1 词面链(026):previewRemove → RemoveConfirmDialog
 *   (conflicts 警示 + destructive 延迟确认)→ applyRemove(任务化)→
 *   receipt/rejected 终态内联呈现——两链分立互不污染。
 */

type PackagesSection = "packages" | "repos";

/* ---- 项目头:项目下拉(收藏置顶,无效禁用)+ 添加项目文件夹 ---- */

function ProjectHeader({
  projects,
  selectedProjectId,
  capable,
  onSelect,
  onAdd,
}: {
  projects: readonly PackageProject[];
  selectedProjectId: string | null;
  capable: boolean;
  onSelect: (projectId: string) => void;
  onAdd: () => void;
}) {
  const ordered = sortProjects(projects);
  const invalid = ordered.filter((project) => !project.valid);
  return (
    <div className="vua-packages__main">
      <div className="vua-packages__project-header">
        <select
          className="vua-packages__project-select"
          aria-label={copy.projects.selectorAria}
          value={selectedProjectId ?? ""}
          onChange={(event) => onSelect(event.target.value)}
        >
          {selectedProjectId === null ? (
            <option value="" disabled>
              {copy.projects.selectorAria}
            </option>
          ) : null}
          {ordered.map((project) => (
            <option key={project.id} value={project.id} disabled={!project.valid}>
              {project.unityVersion
                ? `${project.name} · Unity ${project.unityVersion}`
                : project.name}
            </option>
          ))}
        </select>
        {capable ? (
          <Button variant="default" onClick={onAdd}>
            <Icon name="folder" size={16} />
            {copy.projects.addProject}
          </Button>
        ) : null}
      </div>
      {/* 无效项目:禁用 + 解释(图标 + 文字,原因可发现) */}
      {invalid.length > 0 ? (
        <ul className="vua-packages__invalid-projects">
          {invalid.map((project) => (
            <li key={project.id}>
              <Icon name="warning" size={16} />
              <span className="vua-caption">
                {format(copy.projects.invalidLine, {
                  name: project.name,
                  reason:
                    copy.projects.invalidReasons[invalidReasonKey(project.invalidReasonKey)],
                })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---- 迁移建议卡:存在即出现;真实迁移未接入 → 诚实说明,无假按钮 ---- */

function MigrationHintCard({ summaryKey }: { summaryKey: string }) {
  const key = migrationSummaryKey(summaryKey);
  // 词表外键:不渲染卡片,不编造文案
  if (key === null) return null;
  return (
    <div className="vua-packages__migration">
      <Icon name="question" size={16} />
      <div>
        <p>{copy.migration.summaries[key]}</p>
        <p className="vua-caption vua-text-secondary">{copy.migration.note}</p>
      </div>
    </div>
  );
}

/* ---- 工具栏:搜索(防抖)+ 来源筛选 + 导入本地包 + 预发布开关 ---- */

function PackageToolbar({
  searchText,
  source,
  showPrereleases,
  capable,
  onSearch,
  onSource,
  onTogglePrereleases,
  onImport,
}: {
  searchText: string;
  source: PackageSource | "";
  showPrereleases: boolean;
  capable: boolean;
  onSearch: (text: string) => void;
  onSource: (source: PackageSource | "") => void;
  onTogglePrereleases: (checked: boolean) => void;
  onImport: () => void;
}) {
  return (
    <div className="vua-packages__toolbar" role="search">
      <input
        type="search"
        className="vua-packages__search"
        placeholder={copy.toolbar.searchPlaceholder}
        aria-label={copy.toolbar.searchAria}
        value={searchText}
        onChange={(event) => onSearch(event.target.value)}
      />
      <select
        className="vua-packages__filter"
        aria-label={copy.toolbar.sourceFilterAria}
        value={source}
        onChange={(event) => onSource(event.target.value as PackageSource | "")}
      >
        <option value="">{copy.toolbar.allSources}</option>
        {(Object.keys(sourceTextKeys) as PackageSource[]).map((key) => (
          <option key={key} value={key}>
            {copy.sources[key]}
          </option>
        ))}
      </select>
      {capable ? (
        <Button variant="default" onClick={onImport}>
          {copy.toolbar.importLocal}
        </Button>
      ) : null}
      <label className="vua-packages__prerelease">
        <input
          type="checkbox"
          checked={showPrereleases}
          onChange={(event) => onTogglePrereleases(event.target.checked)}
        />
        <span className="vua-caption">{copy.toolbar.showPrereleases}</span>
      </label>
    </div>
  );
}

/* ---- P1 中间诚实态(024 冻结批消费批):「已安装可看、变更面不可用」。
 * 区块可用性标注(ready-p1 blocks)驱动渲染:repos/changes 类型级恒 false
 * = 无词表无事实源,分区切换器与一切写入口不渲染;包行三键
 * packageId/version/dependencies 照实显示,更新语义列与版本枚举 UI 无
 * 事实源不渲染(虚假断言防线);displayName 无生产者字段,以 packageId
 * 兼任显示(024 核心裁决 3,桌面表态既定走向)。 ---- */

function P1Notice({ changesOpen }: { changesOpen: boolean }) {
  return (
    <div className="vua-packages__migration">
      <Icon name="question" size={16} />
      <p>{changesOpen ? copy.p1.noticeChangesOpen : copy.p1.notice}</p>
    </div>
  );
}

function P2Notice({ changesOpen }: { changesOpen: boolean }) {
  return (
    <div className="vua-packages__migration">
      <Icon name="question" size={16} />
      <p>{changesOpen ? copy.p2.noticeChangesOpen : copy.p2.notice}</p>
    </div>
  );
}

/** P1 项目选择器:清单来自 013 project.listProjects(同一注册事实,无第二
 * 项目身份,path 即词面 projectPath);登记路径缺失的行禁用可见,形状不
 * 符行以计数如实呈现(诚实纪律:缺席可见,不猜测内容)。 */
function P1ProjectPicker({
  projects,
  unreadable,
  selectedProjectPath,
  onSelect,
}: {
  projects: readonly RegisteredProjectRow[];
  unreadable: number | null;
  selectedProjectPath: string | null;
  onSelect: (projectPath: string) => void;
}) {
  const ordered = [...projects].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="vua-packages__main">
      <div className="vua-packages__project-header">
        <select
          className="vua-packages__project-select"
          aria-label={copy.projects.selectorAria}
          value={selectedProjectPath ?? ""}
          onChange={(event) => onSelect(event.target.value)}
        >
          {selectedProjectPath === null ? (
            <option value="" disabled>
              {copy.projects.selectorAria}
            </option>
          ) : null}
          {ordered.map((project) => (
            <option key={project.path} value={project.path} disabled={!project.pathPresent}>
              {project.unityVersion !== null
                ? `${project.name} · Unity ${project.unityVersion}`
                : project.name}
            </option>
          ))}
        </select>
      </div>
      {unreadable !== null && unreadable > 0 ? (
        <ul className="vua-packages__invalid-projects">
          <li>
            <Icon name="warning" size={16} />
            <span className="vua-caption">{format(copy.p1.unreadableProjects, { count: unreadable })}</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

/** P1 已装包简表:loadError 存在时呈现 typed 失败(错误码原词),绝不以
 * 空态冒充;零已装包 = 合法空数组的诚实空态(两种形态严格区分)。
 * onShowCatalog 仅 P2 分支传入:目录事实(catalog)区块可用时行内提供
 * 按需目录查询入口,无工程上下文不由本表控制(页面级门控)。
 * onRemove 仅 blocks.changes(026 A1 removeOps 能力行)可用时传入:
 * 行内移除写入口,能力行缺席 = 入口不渲染(渲染层不伪造)。 */
function P1InstalledTable({
  rows,
  loadErrorCode,
  onShowCatalog,
  onRemove,
  removeBusy,
}: {
  rows: readonly InstalledPackageRowV01[];
  loadErrorCode: string | null;
  onShowCatalog?: (packageId: string) => void;
  onRemove?: (packageId: string) => void;
  removeBusy?: boolean;
}) {
  if (loadErrorCode !== null) {
    return (
      <EmptyState
        title={copy.p1.loadFailedTitle}
        description={format(copy.p1.loadFailed, { code: loadErrorCode })}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title={copy.empty.noPackagesTitle}
        description={copy.p1.emptyInstalledDescription}
      />
    );
  }
  return (
    <div className="vua-packages__table-scroll">
      <table className="vua-packages__table">
        <thead>
          <tr>
            <th scope="col">{copy.columns.name}</th>
            <th scope="col">{copy.columns.installed}</th>
            <th scope="col">{copy.p1.dependenciesColumn}</th>
            {onShowCatalog ? <th scope="col">{copy.p2.catalogColumn}</th> : null}
            {onRemove ? <th scope="col">{copy.remove.column}</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.packageId}>
              <td data-column={copy.columns.name}>
                <div className="vua-packages__name">
                  <span className="vua-packages__name-title" title={row.packageId}>
                    {row.packageId}
                  </span>
                </div>
              </td>
              <td data-column={copy.columns.installed}>{row.version}</td>
              <td
                data-column={copy.p1.dependenciesColumn}
                title={row.dependencies.length > 0 ? row.dependencies.join(", ") : undefined}
              >
                {format(copy.p1.dependenciesCount, { count: row.dependencies.length })}
              </td>
              {onShowCatalog ? (
                <td data-column={copy.p2.catalogColumn}>
                  <Button variant="subtle" onClick={() => onShowCatalog(row.packageId)}>
                    {copy.p2.catalogColumn}
                  </Button>
                </td>
              ) : null}
              {onRemove ? (
                <td data-column={copy.remove.column}>
                  <Button
                    variant="subtle"
                    disabled={removeBusy}
                    onClick={() => onRemove(row.packageId)}
                  >
                    {copy.menu.remove}
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- P2 读面(025 冻结批消费批):仓库订阅清单 + 单包目录按需查询。
 * 健康面 = 词面非目标,零健康拟态词;cached=false =「已订阅·缓存未建
 * 立」独立诚实态(绝不呈现为空目录);目录查询需工程上下文(compatible
 * 绑定选中工程),无工程上下文不渲染入口;no_matching_package = 独立
 * 空态非错误页;updateAvailable null = 判定未执行,更新行不渲染不以
 * 默认值填充(P1 防线);yanked 事实仅版本行携带,本地包(versions 空
 * 数组)无 yanked 断言。 ---- */

/** P2 仓库订阅清单:行序 = 订阅面自身顺序(配置事实,不重排);
 * reposError = typed 失败照原词呈现,与空数组零订阅严格区分。 */
function P2ReposSection({
  repos,
  reposErrorCode,
}: {
  repos: readonly RepoInfoRowV01[];
  reposErrorCode: string | null;
}) {
  if (reposErrorCode !== null) {
    return (
      <EmptyState
        title={copy.p2.reposLoadFailedTitle}
        description={format(copy.p2.reposLoadFailed, { code: reposErrorCode })}
      />
    );
  }
  if (repos.length === 0) {
    return (
      <EmptyState
        title={copy.p2.reposEmptyTitle}
        description={copy.p2.reposEmptyDescription}
      />
    );
  }
  return (
    <Card>
      <h2 className="vua-packages__section-title">{copy.p2.reposTitle}</h2>
      <ul className="vua-packages__repo-list">
        {repos.map((repo, index) => {
          const title = repo.name ?? repo.repoId ?? copy.p2.repoNoIdentifier;
          const location = repo.url ?? repo.localPath;
          return (
            <li key={`${repo.repoId ?? "repo"}-${index}`} className="vua-packages__repo-row">
              <div className="vua-packages__repo-main">
                <span className="vua-packages__name-title" title={repo.repoId ?? undefined}>
                  {title}
                </span>
                <Badge tone={repo.cached ? "neutral" : "warning"}>
                  {repo.cached ? copy.p2.repoCached : copy.p2.repoNotCached}
                </Badge>
              </div>
              {location !== null && location !== undefined ? (
                <span className="vua-caption vua-text-secondary" title={location}>
                  {repo.url !== null ? `${copy.p2.repoUrlLabel}: ${repo.url}` : `${copy.p2.repoLocalPathLabel}: ${repo.localPath}`}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** P2 目录事实面板:挂载即按需查询(双键闭集);五种形态严格区分——
 * 加载骨架 / typed 失败(码原词) / no_matching_package 独立空态 /
 * 目录事实行闭集呈现(displayName null 以 packageId 兼任;source 二态
 * × installed 组合呈现;updateAvailable null 时更新行不渲染) /
 * v0.2 cacheSourced=true「缓存数据」信息性标注(非失败;v0.1 应答无
 * 此字段不虚构标注——双族协商,盖戳族常量辨词面永不猜测)。 */
function P2CatalogPanel({
  projectPath,
  packageId,
  gateway,
  onClose,
}: {
  projectPath: string;
  packageId: string;
  gateway: ReturnType<typeof useGateway>;
  onClose: () => void;
}) {
  const [outcome, setOutcome] = useState<
    | { kind: "loading" }
    | { kind: "ok"; facts: CatalogPackageFactsV01 | CatalogPackageFactsV02 }
    | { kind: "failed"; code: string }
    | { kind: "unavailable" }
  >({ kind: "loading" });

  useEffect(() => {
    let active = true;
    setOutcome({ kind: "loading" });
    void gateway.packages.packageCatalog(projectPath, packageId).then((result) => {
      if (!active) return;
      if (result.kind === "ok") setOutcome({ kind: "ok", facts: result.result });
      else if (result.kind === "failed") setOutcome({ kind: "failed", code: result.code });
      else setOutcome({ kind: "unavailable" });
    });
    return () => {
      active = false;
    };
  }, [gateway, projectPath, packageId]);

  const facts = outcome.kind === "ok" ? outcome.facts : null;
  const displayName = facts === null ? null : (facts.displayName ?? facts.packageId);
  // v0.2 披露标注:仅盖戳 v0.2 且 cacheSourced=true 时呈现「缓存数据」
  // 信息标注(信息性非失败);v0.1 应答无此字段,绝不虚构标注(双族协商)
  const cacheSourcedLine =
    facts === null || !("cacheSourced" in facts) || !facts.cacheSourced
      ? null
      : copy.p2.catalogCachedData;
  const updateLine =
    facts === null || facts.updateAvailable === null
      ? null
      : facts.updateAvailable
        ? copy.p2.updateAvailableYes
        : copy.p2.updateAvailableNo;
  const sourceLine =
    facts === null
      ? null
      : facts.source === "repo"
        ? facts.installed
          ? copy.p2.sourceRepoInstalled
          : copy.p2.sourceRepoNotInstalled
        : facts.installed
          ? copy.p2.sourceLocalInstalled
          : copy.p2.sourceLocalNotInstalled;

  return (
    <Card>
      <div className="vua-packages__catalog-head">
        <h2 className="vua-packages__section-title">
          {format(copy.p2.catalogTitle, { packageId })}
        </h2>
        <Button variant="subtle" onClick={onClose}>
          {copy.p2.catalogClose}
        </Button>
      </div>
      {outcome.kind === "loading" ? (
        <div className="vua-page__stack">
          <Skeleton width="45%" />
          <Skeleton width="70%" />
        </div>
      ) : outcome.kind === "failed" ? (
        outcome.code === "vua.vpm.no_matching_package" ? (
          <EmptyState
            title={copy.p2.catalogNotFoundTitle}
            description={copy.p2.catalogNotFoundDescription}
          />
        ) : (
          <EmptyState
            title={copy.p2.catalogFailedTitle}
            description={format(copy.p2.catalogQueryFailed, { code: outcome.code })}
          />
        )
      ) : outcome.kind === "unavailable" ? (
        <EmptyState
          title={copy.p2.catalogFailedTitle}
          description={copy.p2.catalogUnavailable}
        />
      ) : (
        <div className="vua-packages__catalog-body">
          <p>
            <span className="vua-caption vua-text-secondary">{copy.columns.name}: </span>
            {displayName}
          </p>
          <p>
            <span className="vua-caption vua-text-secondary">{copy.p2.sourceLabel}: </span>
            {sourceLine}
          </p>
          {cacheSourcedLine !== null ? (
            <p className="vua-caption vua-text-secondary">
              <Icon name="question" size={16} /> {cacheSourcedLine}
            </p>
          ) : null}
          {updateLine !== null ? (
            <p>
              <span className="vua-caption vua-text-secondary">{copy.p2.updateAvailableLabel}: </span>
              {updateLine}
            </p>
          ) : null}
          <h3 className="vua-packages__section-title">{copy.p2.versionsTitle}</h3>
          {outcome.facts.versions.length === 0 ? (
            <p className="vua-caption vua-text-secondary">{copy.p2.versionsEmpty}</p>
          ) : (
            <ul className="vua-packages__repo-list">
              {outcome.facts.versions.map((version) => (
                <li key={version.version} className="vua-packages__repo-row">
                  <span className="vua-packages__name-title">{version.version}</span>
                  <span className="vua-caption">
                    {version.yanked ? copy.p2.versionYanked : null}
                    {version.compatible === true ? copy.p2.compatibleYes : null}
                    {version.compatible === false ? copy.p2.compatibleNo : null}
                    {version.compatible === null ? copy.p2.compatibleUnknown : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---- 页面 ---- */

export function PackagesPage() {
  const gateway = useGateway();
  const dataSource = useDataSource();
  const view = usePackagesView();

  const [capability, setCapability] = useState<CapabilityReport | null>(null);
  const [section, setSection] = useState<PackagesSection>("packages");
  // 工具栏:搜索原始输入立即受控,防抖后再参与筛选
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [sourceFilter, setSourceFilter] = useState<PackageSource | "">("");
  const [showPrereleases, setShowPrereleases] = useState(false);
  // 预发布警告:每次会话开启前弹一次确认(用户裁决的一次性确认,不持久化)
  const [prereleaseAcked, setPrereleaseAcked] = useState(false);
  const [prereleasePrompt, setPrereleasePrompt] = useState(false);
  // 选择 / 详情抽屉 / 项目切换 / P2 目录面板(按需查询目标包)
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [catalogTarget, setCatalogTarget] = useState<string | null>(null);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  // 变更两阶段
  const [preview, setPreview] = useState<PackageChangePreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  // A1 移除确认链(026 消费批;live 词面与 demo 泛型链分立互不污染):
  // confirm(预览确认)→ applying(任务化执行,任务中心呈现真实状态)→
  // receipt(审计收据)/rejected(守卫拒绝)终态内联呈现
  const [removeFlow, setRemoveFlow] = useState<{
    phase: "confirm" | "applying" | "receipt" | "rejected";
    plan: PackagesRemovePlanV01;
    requestedPackageIds: readonly string[];
    receipt: PackagesRemoveReceiptV01 | null;
    rejection: PackagesRemoveRejectedV01 | null;
  } | null>(null);
  const [removePreviewBusy, setRemovePreviewBusy] = useState(false);
  // 结果 toast(短暂停留,role=status)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastSeq = useRef(0);

  useEffect(() => {
    let active = true;
    gateway.packages.capability().then(
      (report) => {
        if (active) setCapability(report);
      },
      () => {
        // capability 查询本身失败:按未接入诚实呈现,不猜测原因
        if (active) setCapability({ state: "unavailable", detailKey: "packagesEngineMissing" });
      },
    );
    return () => {
      active = false;
    };
  }, [gateway]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(searchText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const ready = view.kind === "ready" ? view : null;
  const p1 = view.kind === "ready-p1" ? view : null;
  const p2 = view.kind === "ready-p2" ? view : null;
  const selectedProjectId = ready?.selectedProjectId ?? null;

  // P1/P2 注册项目清单(013 聚合,packages.listInstalled 的同一注册事实):
  // 进入中间诚实态时加载;清单不可用 = null(诚实注记),形状不符行计数上呈
  const [registeredProjects, setRegisteredProjects] = useState<readonly RegisteredProjectRow[] | null>(null);
  const [p1Unreadable, setP1Unreadable] = useState<number | null>(null);
  const p1AutoSelected = useRef(false);

  useEffect(() => {
    if (view.kind !== "ready-p1" && view.kind !== "ready-p2") return;
    let active = true;
    void gateway.projectOps.listProjects().then((outcome) => {
      if (!active) return;
      if (outcome.ok) {
        setRegisteredProjects(outcome.projects);
        setP1Unreadable(outcome.unreadable);
      } else {
        setRegisteredProjects(null);
        setP1Unreadable(null);
      }
    });
    return () => {
      active = false;
    };
  }, [gateway, view.kind]);

  // P1/P2 自动初始选择:清单首个可用项目(一次;此后尊重用户显式选择)
  useEffect(() => {
    if ((view.kind !== "ready-p1" && view.kind !== "ready-p2") || registeredProjects === null || p1AutoSelected.current) return;
    const firstUsable = registeredProjects.find((project) => project.pathPresent);
    if (firstUsable !== undefined) {
      p1AutoSelected.current = true;
      void gateway.packages.selectProject(firstUsable.path);
    }
  }, [gateway, view.kind, registeredProjects]);

  // 项目切换收敛(render 期调整,React 推荐模式):清空选择/锚点/抽屉/
  // 目录面板;订阅广播到达后解除切换中骨架。ready 身份 = projectId,
  // P1/P2 身份 = 路径
  const selectedIdentity = ready?.selectedProjectId ?? p1?.projectPath ?? p2?.projectPath ?? null;
  const [lastProjectId, setLastProjectId] = useState(selectedIdentity);
  if (selectedIdentity !== lastProjectId) {
    setLastProjectId(selectedIdentity);
    setSelectedIds([]);
    setAnchorId(null);
    setDetailId(null);
    setCatalogTarget(null);
    setRemoveFlow(null);
    setRemovePreviewBusy(false);
  }
  if (pendingProjectId !== null && pendingProjectId === selectedIdentity) {
    setPendingProjectId(null);
  }

  const capable = capability?.state === "ready";
  const switching = pendingProjectId !== null && pendingProjectId !== selectedIdentity;

  const visibleRows = useMemo(
    () =>
      sortPackages(
        filterPackages(ready?.packages ?? [], {
          text: debouncedText,
          source: sourceFilter,
          showPrereleases,
        }),
      ),
    [ready?.packages, debouncedText, sourceFilter, showPrereleases],
  );

  // P1 过滤:仅按 packageId 本地搜索;行序保持服务端 packageId 升序
  // (冻结的确定性呈现事实,客户端不重排)
  const p1Rows = useMemo(() => {
    if (p1 === null) return [] as readonly InstalledPackageRowV01[];
    const text = debouncedText.trim().toLowerCase();
    if (text === "") return p1.installedPackages;
    return p1.installedPackages.filter((row) => row.packageId.toLowerCase().includes(text));
  }, [p1, debouncedText]);

  // P2 过滤:同 P1 纪律(packageId 本地搜索,行序不重排)
  const p2Rows = useMemo(() => {
    if (p2 === null) return [] as readonly InstalledPackageRowV01[];
    const text = debouncedText.trim().toLowerCase();
    if (text === "") return p2.installedPackages;
    return p2.installedPackages.filter((row) => row.packageId.toLowerCase().includes(text));
  }, [p2, debouncedText]);

  const showToast = (text: string) => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, text });
  };

  /** 变更两阶段第一步:预览;空预览/未接入均以 toast 如实反馈,不弹空对话框 */
  const startChanges = (requests: readonly ChangeRequest[]) => {
    if (requests.length === 0 || previewBusy) return;
    setPreviewBusy(true);
    void gateway.packages.previewChanges(requests).then(
      (result) => {
        setPreviewBusy(false);
        if (result.kind === "unavailable") {
          showToast(copy.toasts.previewUnavailable);
          return;
        }
        if (isEmptyPreview(result.preview)) {
          showToast(copy.toasts.nothingToChange);
          return;
        }
        setPreview(result.preview);
      },
      () => {
        setPreviewBusy(false);
        showToast(copy.toasts.previewUnavailable);
      },
    );
  };

  /** 第二步:应用已确认的预览;结果 toast,成功后清空选择 */
  const confirmPreview = () => {
    if (preview === null || applying) return;
    const count = preview.items.length;
    setApplying(true);
    void gateway.packages.applyChanges(preview.id).then(
      (result) => {
        setApplying(false);
        setPreview(null);
        if (result.kind === "applied") {
          setSelectedIds([]);
          setAnchorId(null);
          showToast(format(copy.toasts.appliedSummary, { count }));
        } else {
          showToast(copy.toasts.applyFailed);
        }
      },
      () => {
        setApplying(false);
        setPreview(null);
        showToast(copy.toasts.applyFailed);
      },
    );
  };

  /** 添加入口(项目/本地包):added → toast;cancelled → 不打扰;unavailable → 诚实说明 */
  const runEntry = (action: () => Promise<PackageEntryResult>, addedText: string) => {
    void action().then(
      (result) => {
        if (result.kind === "added") showToast(addedText);
        else if (result.kind === "unavailable")
          showToast(strings.capability.details.packagesEngineMissing);
      },
      () => showToast(strings.capability.details.packagesEngineMissing),
    );
  };

  /** A1 确认链第一步(026 消费批):previewRemove 同步预览;typed 失败
   * 照词面文案(词外码原词插值),unavailable 诚实说明,绝不弹空对话框 */
  const startRemove = (packageId: string) => {
    const projectPath = p1?.projectPath ?? p2?.projectPath ?? null;
    if (projectPath === null || removePreviewBusy || removeFlow !== null) return;
    setRemovePreviewBusy(true);
    void gateway.packages.previewRemove(projectPath, [packageId]).then(
      (result) => {
        setRemovePreviewBusy(false);
        if (result.kind === "unavailable") {
          showToast(copy.remove.toasts.previewUnavailable);
          return;
        }
        if (result.kind === "failed") {
          const key = removeEnvelopeErrorKey(result.code);
          showToast(
            key === "unknown"
              ? format(copy.remove.toasts.previewFailedUnknown, { code: result.code })
              : copy.remove.envelopeErrors[key],
          );
          return;
        }
        if (result.plan.items.length === 0) {
          showToast(copy.remove.toasts.nothingToRemove);
          return;
        }
        setRemoveFlow({
          phase: "confirm",
          plan: result.plan,
          requestedPackageIds: [packageId],
          receipt: null,
          rejection: null,
        });
      },
      () => {
        setRemovePreviewBusy(false);
        showToast(copy.remove.toasts.previewUnavailable);
      },
    );
  };

  /** A1 确认链第二步:applyRemove 任务化执行(携 plan.digest 为
   * confirmedDigest);receipt/rejected 终态对话框内呈现,failed/unavailable
   * 关闭流以 toast 诚实说明——任务真实状态由任务中心呈现 */
  const confirmRemove = () => {
    if (removeFlow === null || removeFlow.phase !== "confirm") return;
    const { plan, requestedPackageIds } = removeFlow;
    setRemoveFlow({ ...removeFlow, phase: "applying" });
    void gateway.packages.applyRemove(plan.projectPath, requestedPackageIds, plan.digest).then(
      (result) => {
        if (result.kind === "ok") {
          setRemoveFlow((flow) =>
            flow === null ? flow : { ...flow, phase: "receipt", receipt: result.receipt },
          );
        } else if (result.kind === "rejected") {
          setRemoveFlow((flow) =>
            flow === null ? flow : { ...flow, phase: "rejected", rejection: result.rejection },
          );
        } else {
          setRemoveFlow(null);
          if (result.kind === "failed") {
            const key = removeEnvelopeErrorKey(result.code);
            showToast(
              key === "unknown"
                ? format(copy.remove.toasts.applyFailedUnknown, { code: result.code })
                : copy.remove.envelopeErrors[key],
            );
          } else {
            showToast(copy.remove.toasts.applyUnavailable);
          }
        }
      },
      () => {
        setRemoveFlow(null);
        showToast(copy.remove.toasts.applyUnavailable);
      },
    );
  };

  const chooseProject = (projectId: string) => {
    // P1/P2 视图的项目身份 = 013 注册路径(projectPath);各模式同一选择通道
    const currentSelected = ready?.selectedProjectId ?? p1?.projectPath ?? p2?.projectPath ?? null;
    if (ready === null && p1 === null && p2 === null) return;
    if (projectId === currentSelected) return;
    setPendingProjectId(projectId);
    void gateway.packages.selectProject(projectId).then(
      () => setPendingProjectId(null),
      () => setPendingProjectId(null),
    );
  };

  const toggleRow = (packageId: string, shiftKey: boolean) => {
    if (shiftKey && anchorId !== null) {
      setSelectedIds(rangeSelect(visibleRows.map((row) => row.id), anchorId, packageId));
      return;
    }
    setAnchorId(packageId);
    setSelectedIds((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId],
    );
  };

  const toggleAll = () => {
    const allVisibleSelected =
      visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id));
    setSelectedIds(allVisibleSelected ? [] : visibleRows.map((row) => row.id));
    setAnchorId(null);
  };

  const togglePrereleases = (checked: boolean) => {
    if (checked && !prereleaseAcked) {
      setPrereleasePrompt(true);
      return;
    }
    setShowPrereleases(checked);
  };

  const detailRow =
    detailId === null
      ? null
      : (ready?.packages.find((row) => row.id === detailId) ?? null);

  const resolveName = (packageId: string) =>
    ready?.packages.find((row) => row.id === packageId)?.displayName ?? packageId;

  const engineDown = capability !== null && capability.state !== "ready";

  return (
    <div className="vua-page vua-packages">
      <section className="vua-page__hero">
        <h1 className="vua-title">
          {strings.nav.pages.packages}
          {dataSource === "fixture" ? (
            <>
              {" "}
              <Badge tone="warning">{strings.common.fixtureBadge}</Badge>
            </>
          ) : null}
        </h1>
        <p className="vua-text-secondary">{format(copy.subtitle, { recipe: termLabel("recipe") })}</p>
      </section>

      {capability === null ? (
        /* capability 查询中(极短):骨架占位 */
        <Card>
          <div className="vua-page__stack">
            <Skeleton width="40%" />
            <Skeleton width="80%" />
            <Skeleton width="60%" />
          </div>
        </Card>
      ) : engineDown ? (
        /* 能力未接入/异常:整页诚实空态,不渲染任何包数据入口 */
        <EmptyState
          title={copy.empty.engineTitle}
          description={
            capability.detailKey
              ? strings.capability.details[capability.detailKey]
              : strings.capability.states[capability.state]
          }
        />
      ) : p2 !== null ? (
        /* P2 读面诚实态(025)+ A1 写面(026):已装可看 + 订阅清单/目录/
         * 移除写入口按能力行解锁;repos/catalog/changes 区块 false 时不
         * 渲染对应区块与入口(无事实源不渲染,渲染层不伪造) */
        p2.blocks.installed ? (
          <>
            <P2Notice changesOpen={p2.blocks.changes} />
            <P1ProjectPicker
              projects={registeredProjects ?? []}
              unreadable={p1Unreadable}
              selectedProjectPath={p2.projectPath}
              onSelect={chooseProject}
            />
            {p2.blocks.repos ? (
              <P2ReposSection repos={p2.repos} reposErrorCode={p2.reposError?.code ?? null} />
            ) : null}
            {registeredProjects !== null && registeredProjects.length === 0 ? (
              <EmptyState
                title={copy.empty.noProjectsTitle}
                description={copy.p1.noProjectsDescription}
              />
            ) : registeredProjects === null ? (
              <EmptyState
                title={copy.empty.noProjectsTitle}
                description={copy.p1.projectsUnavailable}
              />
            ) : p2.projectPath === null ? (
              <EmptyState
                title={copy.empty.noSelectionTitle}
                description={copy.empty.noSelectionDescription}
              />
            ) : (
              <div className="vua-packages__main">
                <div className="vua-packages__toolbar" role="search">
                  <input
                    type="search"
                    className="vua-packages__search"
                    placeholder={copy.toolbar.searchPlaceholder}
                    aria-label={copy.toolbar.searchAria}
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </div>
                {switching ? (
                  <Card>
                    <div className="vua-page__stack">
                      <Skeleton width="55%" />
                      <Skeleton width="80%" />
                      <Skeleton width="45%" />
                    </div>
                  </Card>
                ) : (
                  <P1InstalledTable
                    rows={p2Rows}
                    loadErrorCode={p2.loadError?.code ?? null}
                    {...(p2.blocks.catalog ? { onShowCatalog: setCatalogTarget } : {})}
                    {...(p2.blocks.changes
                      ? { onRemove: startRemove, removeBusy: removePreviewBusy || removeFlow !== null }
                      : {})}
                  />
                )}
                {catalogTarget !== null && p2.blocks.catalog && p2.projectPath !== null ? (
                  <P2CatalogPanel
                    projectPath={p2.projectPath}
                    packageId={catalogTarget}
                    gateway={gateway}
                    onClose={() => setCatalogTarget(null)}
                  />
                ) : null}
              </div>
            )}
          </>
        ) : (
          /* 能力行存在但不可用:已安装区块诚实不可渲染 */
          <EmptyState
            title={copy.empty.engineTitle}
            description={strings.capability.details.packagesEngineMissing}
          />
        )
      ) : p1 !== null ? (
        /* P1 中间诚实态(024)+ A1 写面(026):repos 无词表行恒 false,
         * 分区切换器不渲染;移除写入口随 removeOps 能力行解锁;清单来自
         * 013 注册面,包行三键照实显示 */
        <>
          {p1.blocks.installed ? (
            <>
              <P1Notice changesOpen={p1.blocks.changes} />
              <P1ProjectPicker
                projects={registeredProjects ?? []}
                unreadable={p1Unreadable}
                selectedProjectPath={p1.projectPath}
                onSelect={chooseProject}
              />
              {registeredProjects !== null && registeredProjects.length === 0 ? (
                <EmptyState
                  title={copy.empty.noProjectsTitle}
                  description={copy.p1.noProjectsDescription}
                />
              ) : registeredProjects === null ? (
                <EmptyState
                  title={copy.empty.noProjectsTitle}
                  description={copy.p1.projectsUnavailable}
                />
              ) : p1.projectPath === null ? (
                <EmptyState
                  title={copy.empty.noSelectionTitle}
                  description={copy.empty.noSelectionDescription}
                />
              ) : (
                <div className="vua-packages__main">
                  <div className="vua-packages__toolbar" role="search">
                    <input
                      type="search"
                      className="vua-packages__search"
                      placeholder={copy.toolbar.searchPlaceholder}
                      aria-label={copy.toolbar.searchAria}
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                    />
                  </div>
                  {switching ? (
                    <Card>
                      <div className="vua-page__stack">
                        <Skeleton width="55%" />
                        <Skeleton width="80%" />
                        <Skeleton width="45%" />
                      </div>
                    </Card>
                  ) : (
                    <P1InstalledTable
                      rows={p1Rows}
                      loadErrorCode={p1.loadError?.code ?? null}
                      {...(p1.blocks.changes
                        ? { onRemove: startRemove, removeBusy: removePreviewBusy || removeFlow !== null }
                        : {})}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            /* 能力行存在但不可用:已安装区块诚实不可渲染 */
            <EmptyState
              title={copy.empty.engineTitle}
              description={strings.capability.details.packagesEngineMissing}
            />
          )}
        </>
      ) : ready === null ? (
        <EmptyState
          title={copy.empty.notConnectedTitle}
          description={copy.empty.notConnectedDescription}
        />
      ) : (
        <>
          <div
            className="vua-packages__sections"
            role="group"
            aria-label={copy.sections.switchAria}
          >
            <button
              type="button"
              className="vua-packages__section-tab"
              data-active={section === "packages" || undefined}
              aria-pressed={section === "packages"}
              onClick={() => setSection("packages")}
            >
              {copy.sections.packages}
            </button>
            <button
              type="button"
              className="vua-packages__section-tab"
              data-active={section === "repos" || undefined}
              aria-pressed={section === "repos"}
              onClick={() => setSection("repos")}
            >
              {copy.sections.repos}
            </button>
          </div>

          {section === "repos" ? (
            <RepoSection
              repos={ready.repos}
              onToggle={(repoId, enabled) => void gateway.packages.setRepoEnabled(repoId, enabled)}
            />
          ) : (
            <>
              <ProjectHeader
                projects={ready.projects}
                selectedProjectId={selectedProjectId}
                capable={capable}
                onSelect={chooseProject}
                onAdd={() =>
                  runEntry(() => gateway.packages.addProject(), copy.toasts.projectAdded)
                }
              />
              {ready.migrationHint ? (
                <MigrationHintCard summaryKey={ready.migrationHint.summaryKey} />
              ) : null}

              {ready.projects.length === 0 ? (
                <EmptyState
                  title={copy.empty.noProjectsTitle}
                  description={copy.empty.noProjectsDescription}
                  action={
                    capable ? (
                      <Button
                        variant="primary"
                        onClick={() =>
                          runEntry(() => gateway.packages.addProject(), copy.toasts.projectAdded)
                        }
                      >
                        {copy.projects.addProject}
                      </Button>
                    ) : undefined
                  }
                />
              ) : selectedProjectId === null ? (
                <EmptyState
                  title={copy.empty.noSelectionTitle}
                  description={copy.empty.noSelectionDescription}
                />
              ) : (
                <div
                  className="vua-packages__content"
                  data-drawer-open={detailRow !== null || undefined}
                >
                  <div className="vua-packages__main">
                    <PackageToolbar
                      searchText={searchText}
                      source={sourceFilter}
                      showPrereleases={showPrereleases}
                      capable={capable}
                      onSearch={setSearchText}
                      onSource={setSourceFilter}
                      onTogglePrereleases={togglePrereleases}
                      onImport={() =>
                        runEntry(
                          () => gateway.packages.importLocalPackage(),
                          copy.toasts.importAdded,
                        )
                      }
                    />
                    {switching ? (
                      <PackageTable
                        rows={[]}
                        allRows={ready.packages}
                        switching
                        selectedIds={selectedIds}
                        showPrereleases={showPrereleases}
                        busy={previewBusy}
                        onToggleRow={toggleRow}
                        onToggleAll={toggleAll}
                        onClearSelection={() => {
                          setSelectedIds([]);
                          setAnchorId(null);
                        }}
                        onRequests={startChanges}
                        onShowDetail={(row) => setDetailId(row.id)}
                      />
                    ) : ready.packages.length === 0 ? (
                      <EmptyState
                        title={copy.empty.noPackagesTitle}
                        description={format(copy.empty.noPackagesDescription, {
                          recipe: termLabel("recipe"),
                        })}
                        action={
                          capable ? (
                            <Button
                              variant="default"
                              onClick={() =>
                                runEntry(
                                  () => gateway.packages.importLocalPackage(),
                                  copy.toasts.importAdded,
                                )
                              }
                            >
                              {copy.toolbar.importLocal}
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : visibleRows.length === 0 ? (
                      /* 搜索/筛选无结果 ≠ 项目无包 */
                      <EmptyState
                        title={copy.empty.noResultTitle}
                        description={copy.empty.noResultDescription}
                      />
                    ) : (
                      <PackageTable
                        rows={visibleRows}
                        allRows={ready.packages}
                        switching={false}
                        selectedIds={selectedIds}
                        showPrereleases={showPrereleases}
                        busy={previewBusy}
                        onToggleRow={toggleRow}
                        onToggleAll={toggleAll}
                        onClearSelection={() => {
                          setSelectedIds([]);
                          setAnchorId(null);
                        }}
                        onRequests={startChanges}
                        onShowDetail={(row) => setDetailId(row.id)}
                      />
                    )}
                  </div>
                  {detailRow !== null ? (
                    <PackageDetailDrawer row={detailRow} onClose={() => setDetailId(null)} />
                  ) : null}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 项目兼容分区(proposal 026 B,用户 2026-09-18 裁决):原「项目兼容」
       * 独立页并入本页尾部,恒渲染不挂 packages 引擎 capability 门控——
       * 分区消费面走 projectOps 独立通道(IA 并入＝选项卡级合并)。 */}
      <ProjectCompatSection />

      {preview !== null ? (
        <ChangesDialog
          preview={preview}
          applying={applying}
          resolveName={resolveName}
          onCancel={() => setPreview(null)}
          onConfirm={confirmPreview}
        />
      ) : null}

      {removeFlow !== null ? (
        <RemoveConfirmDialog
          plan={removeFlow.plan}
          requestedPackageIds={removeFlow.requestedPackageIds}
          phase={removeFlow.phase}
          receipt={removeFlow.receipt}
          rejection={removeFlow.rejection}
          onCancel={() => setRemoveFlow(null)}
          onConfirm={confirmRemove}
        />
      ) : null}

      {prereleasePrompt ? (
        <div
          className="vua-packages-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={copy.toolbar.prereleaseTitle}
          onClick={() => setPrereleasePrompt(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setPrereleasePrompt(false);
          }}
        >
          <div
            className="vua-packages-dialog__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="vua-packages-dialog__title">{copy.toolbar.prereleaseTitle}</h2>
            <div className="vua-packages__warning-strip">
              <Icon name="warning" size={16} />
              <p className="vua-caption">{copy.toolbar.prereleaseBody}</p>
            </div>
            <div className="vua-packages-dialog__footer">
              <Button variant="subtle" autoFocus onClick={() => setPrereleasePrompt(false)}>
                {copy.toolbar.prereleaseCancel}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setPrereleaseAcked(true);
                  setShowPrereleases(true);
                  setPrereleasePrompt(false);
                }}
              >
                {copy.toolbar.prereleaseConfirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {toast !== null ? (
        <div className="vua-packages-toast" role="status" key={toast.id}>
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
