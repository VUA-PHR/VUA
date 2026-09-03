import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import {
  ContextMenu,
  type ContextMenuItem,
  type ContextMenuState,
} from "../../components/primitives/ContextMenu.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { Icon } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type {
  ChangeRequest,
  PackageRow,
  PackageVersionEntry,
} from "../../gateway/index.ts";
import {
  SKELETON_ROW_COUNT,
  bulkCapabilities,
  bulkRequests,
  looksPrerelease,
  requestForVersion,
  rowStatus,
  versionGroups,
  type BulkAction,
} from "./packages-model.ts";

const copy = strings.packages;

/** 版本选项文案:yanked/预发布带文字后缀(不依赖颜色表达,原生 select 无法逐选项着色) */
function versionLabel(entry: PackageVersionEntry): string {
  const suffix = entry.yanked
    ? copy.states.yanked
    : looksPrerelease(entry.version)
      ? copy.states.prerelease
      : null;
  return suffix === null
    ? entry.version
    : format(copy.states.versionSuffix, { version: entry.version, suffix });
}

/** 行右键菜单:只放真实动作;不可用项置灰并附原因(hover 可发现) */
function rowMenuItems(
  row: PackageRow,
  onShowDetail: () => void,
  onRequests: (requests: readonly ChangeRequest[]) => void,
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [
    { id: "view", label: copy.menu.viewDetails, onSelect: onShowDetail },
  ];
  if (row.installedVersion === null) {
    if (row.latestVersion !== null) {
      items.push({
        id: "install",
        label: copy.menu.installLatest,
        onSelect: () => onRequests([{ kind: "install", packageId: row.id }]),
      });
    }
  } else {
    items.push({
      id: "update",
      label: copy.menu.updateToLatest,
      disabled: !row.updateAvailable,
      disabledReason: copy.menu.updateUnavailableReason,
      onSelect: () => onRequests([{ kind: "update", packageId: row.id }]),
    });
  }
  items.push({
    id: "remove",
    label: copy.menu.remove,
    disabled: row.installedVersion === null,
    disabledReason: copy.menu.removeUnavailableReason,
    onSelect: () => onRequests([{ kind: "remove", packageId: row.id }]),
  });
  return items;
}

function VersionSelect({
  row,
  showPrereleases,
  onRequests,
}: {
  row: PackageRow;
  showPrereleases: boolean;
  onRequests: (requests: readonly ChangeRequest[]) => void;
}) {
  const groups = versionGroups(row, showPrereleases);
  return (
    <select
      className="vua-packages__version-select"
      /* 行为型控件:恒空值,选择即触发变更预览;取消/应用后自动回到占位项 */
      value=""
      aria-label={format(copy.columns.versionSelectAria, { name: row.displayName })}
      onChange={(event) => {
        const version = event.target.value;
        if (version !== "") onRequests([requestForVersion(row, version)]);
      }}
    >
      <option value="" disabled>
        {row.installedVersion ?? copy.columns.versionPlaceholder}
      </option>
      {groups.compatible.length > 0 ? (
        <optgroup label={copy.columns.compatibleGroup}>
          {groups.compatible.map((entry) => (
            <option key={entry.version} value={entry.version}>
              {versionLabel(entry)}
            </option>
          ))}
        </optgroup>
      ) : null}
      {groups.incompatible.length > 0 ? (
        <optgroup label={copy.columns.incompatibleGroup}>
          {groups.incompatible.map((entry) => (
            <option key={entry.version} value={entry.version}>
              {versionLabel(entry)}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}

function BulkBar({
  count,
  rows,
  busy,
  onRequests,
  onClear,
}: {
  count: number;
  rows: readonly PackageRow[];
  busy: boolean;
  onRequests: (requests: readonly ChangeRequest[]) => void;
  onClear: () => void;
}) {
  // 只显示选中集的能力交集(含未装→不显示升级;含未升级→不显示全升)
  const caps = bulkCapabilities(rows);
  const run = (action: BulkAction) => onRequests(bulkRequests(action, rows));
  return (
    <div className="vua-packages__bulkbar">
      <span className="vua-caption">{format(copy.bulk.selectedCount, { count })}</span>
      {caps.updateAll ? (
        <Button variant="default" disabled={busy} onClick={() => run("updateAll")}>
          {copy.bulk.updateAll}
        </Button>
      ) : null}
      {caps.installAll ? (
        <Button variant="default" disabled={busy} onClick={() => run("installAll")}>
          {copy.bulk.installAll}
        </Button>
      ) : null}
      {caps.removeAll ? (
        <Button variant="default" disabled={busy} onClick={() => run("removeAll")}>
          {copy.bulk.removeAll}
        </Button>
      ) : null}
      <Button variant="subtle" onClick={onClear}>
        {copy.bulk.clear}
      </Button>
    </div>
  );
}

export function PackageTable({
  rows,
  allRows,
  switching,
  selectedIds,
  showPrereleases,
  busy,
  onToggleRow,
  onToggleAll,
  onClearSelection,
  onRequests,
  onShowDetail,
}: {
  /** 当前可见行(已筛选/排序) */
  rows: readonly PackageRow[];
  /** 项目全部行(批量条按选中 id 回查,不受筛选影响) */
  allRows: readonly PackageRow[];
  /** 切换项目中:表格区骨架,stale-while-revalidate 不清空选择之外的状态 */
  switching: boolean;
  selectedIds: readonly string[];
  showPrereleases: boolean;
  busy: boolean;
  onToggleRow: (packageId: string, shiftKey: boolean) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
  onRequests: (requests: readonly ChangeRequest[]) => void;
  onShowDetail: (row: PackageRow) => void;
}) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const openMenu = (event: ReactMouseEvent<HTMLElement>, row: PackageRow) => {
    event.preventDefault();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: rowMenuItems(row, () => onShowDetail(row), onRequests),
    });
  };

  const selectedRows = allRows.filter((row) => selectedIds.includes(row.id));
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const someSelected = rows.some((row) => selectedIds.includes(row.id));

  return (
    <div className="vua-packages__table-scroll">
      <table className="vua-packages__table" aria-busy={switching || undefined}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                aria-label={copy.columns.selectAll}
                checked={allSelected}
                ref={(element) => {
                  if (element) element.indeterminate = !allSelected && someSelected;
                }}
                onChange={onToggleAll}
              />
            </th>
            <th>{copy.columns.name}</th>
            <th>{copy.columns.installed}</th>
            <th>{copy.columns.latest}</th>
            <th>{copy.columns.source}</th>
            {/* 行尾 ⋯ 操作列,无标题 */}
            <th />
          </tr>
        </thead>
        {switching ? (
          /* 切换项目:与最终行同高的 8 行骨架,不清空其余区域 */
          <tbody aria-hidden="true">
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
              <tr key={index}>
                <td>
                  <Skeleton width={14} height={14} />
                </td>
                <td>
                  <Skeleton width="70%" />
                </td>
                <td>
                  <Skeleton width={48} />
                </td>
                <td>
                  <Skeleton width={96} />
                </td>
                <td>
                  <Skeleton width={56} />
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            {rows.map((row) => {
              const status = rowStatus(row);
              const selected = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  data-selected={selected || undefined}
                  onContextMenu={(event) => openMenu(event, row)}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={format(copy.columns.selectRow, { name: row.displayName })}
                      checked={selected}
                      onChange={(event) =>
                        onToggleRow(row.id, (event.nativeEvent as MouseEvent).shiftKey === true)
                      }
                    />
                  </td>
                  <td>
                    <div className="vua-packages__name">
                      <span className="vua-packages__name-title" title={row.displayName}>
                        {row.displayName}
                      </span>
                      {row.description ? (
                        <span
                          className="vua-caption vua-text-secondary vua-packages__name-desc"
                          title={row.description}
                        >
                          {row.description}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="vua-packages__version-cell">
                    {row.installedVersion ?? (
                      <span className="vua-caption vua-text-secondary">
                        {copy.states.notInstalled}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="vua-packages__row-actions">
                      <span className="vua-packages__version-cell">
                        {row.latestVersion ?? "—"}
                      </span>
                      {status === "updateAvailable" ? (
                        <Button
                          variant="default"
                          className="vua-packages__update"
                          disabled={busy}
                          onClick={() => onRequests([{ kind: "update", packageId: row.id }])}
                        >
                          <Icon name="arrow-right" size={16} />
                          {copy.menu.updateToLatest}
                        </Button>
                      ) : null}
                      {status === "upToDate" ? (
                        <span className="vua-packages__state">
                          <Icon name="check" size={16} />
                          <span className="vua-caption">{copy.states.upToDate}</span>
                        </span>
                      ) : null}
                      {status === "notInstalled" && row.latestVersion !== null ? (
                        <Button
                          variant="default"
                          disabled={busy}
                          onClick={() => onRequests([{ kind: "install", packageId: row.id }])}
                        >
                          {copy.menu.installLatest}
                        </Button>
                      ) : null}
                      {row.versions.length > 0 ? (
                        <VersionSelect
                          row={row}
                          showPrereleases={showPrereleases}
                          onRequests={onRequests}
                        />
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <Badge tone="neutral">{copy.sources[row.source]}</Badge>
                  </td>
                  <td>
                    <Button
                      variant="subtle"
                      aria-label={format(copy.columns.rowMenuAria, { name: row.displayName })}
                      onClick={(event) => openMenu(event, row)}
                    >
                      ⋯
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
      {/* 批量条:sticky 贴表格滚动区底部,出现时不推挤上方内容(防跳动) */}
      {!switching && selectedIds.length > 0 ? (
        <BulkBar
          count={selectedIds.length}
          rows={selectedRows}
          busy={busy}
          onRequests={onRequests}
          onClear={onClearSelection}
        />
      ) : null}
      {menu !== null ? <ContextMenu menu={menu} onClose={() => setMenu(null)} /> : null}
    </div>
  );
}
