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
  type ChangeRequest,
  type PackageChangePreview,
  type PackageEntryResult,
  type PackageProject,
  type PackageRow,
  type PackageSource,
} from "../../gateway/index.ts";
import { ChangesDialog } from "./ChangesDialog.tsx";
import { PackageDetailDrawer } from "./PackageDetailDrawer.tsx";
import { PackageTable } from "./PackageTable.tsx";
import { RepoSection } from "./RepoSection.tsx";
import {
  SEARCH_DEBOUNCE_MS,
  TOAST_DURATION_MS,
  filterPackages,
  invalidReasonKey,
  isEmptyPreview,
  migrationSummaryKey,
  rangeSelect,
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
 * - 有项目 → 项目头 + 迁移卡 + 工具栏 + 表格;切换项目时表格区骨架
 *   (stale-while-revalidate,其余区域不清空);
 * - 所有变更两阶段:previewChanges → ChangesDialog 确认 → applyChanges;
 *   破坏性预览的确认钮由 ChangesDialog 内 DelayedButton 延迟解锁。
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
  // 选择 / 详情抽屉 / 项目切换
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  // 变更两阶段
  const [preview, setPreview] = useState<PackageChangePreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [applying, setApplying] = useState(false);
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
  const selectedProjectId = ready?.selectedProjectId ?? null;

  // 项目切换收敛(render 期调整,React 推荐模式):清空选择/锚点/抽屉;
  // 订阅广播到达后解除切换中骨架
  const [lastProjectId, setLastProjectId] = useState(selectedProjectId);
  if (selectedProjectId !== lastProjectId) {
    setLastProjectId(selectedProjectId);
    setSelectedIds([]);
    setAnchorId(null);
    setDetailId(null);
  }
  if (pendingProjectId !== null && pendingProjectId === selectedProjectId) {
    setPendingProjectId(null);
  }

  const capable = capability?.state === "ready";
  const switching = pendingProjectId !== null && pendingProjectId !== selectedProjectId;

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

  const chooseProject = (projectId: string) => {
    if (ready === null || projectId === selectedProjectId) return;
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

      {preview !== null ? (
        <ChangesDialog
          preview={preview}
          applying={applying}
          resolveName={resolveName}
          onCancel={() => setPreview(null)}
          onConfirm={confirmPreview}
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
