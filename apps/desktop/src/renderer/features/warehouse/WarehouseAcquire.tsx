import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import {
  ContextMenu,
  type ContextMenuState,
} from "../../components/primitives/ContextMenu.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import {
  useAcquireView,
  useGateway,
  type AcquireEntryDetailView,
  type WarehouseArtifact,
  type WarehouseArtifactState,
} from "../../gateway/index.ts";
import { format, strings, termLabel } from "../../i18n/index.ts";
import {
  artifactCardMatches,
  artifactCards,
  entryModeLine,
  sizeText,
  type AcquireArtifactCard,
} from "./acquire-model.ts";
import { useCardSpotlight } from "./use-card-spotlight.ts";

const copy = strings.warehouse.acquire;
const cloudCopy = strings.warehouse;

/**
 * Warehouse 本地轨图册(C-ACQUIRE,F4-6 条目模型):
 * - 数据来源:仓库素材包条目(WarehouseEntry × WarehouseArtifact);先检查
 *   再使用,检出可执行内容即隔离(红色左边线),绝不提供任何"运行"入口;
 * - 卡片墙/详情抽屉复用云端浏览的组件与色彩纪律(徽标中性灰,橙仅选中描边):
 *   卡片 = 条目 × 工件展开,带状态与副本角色徽标;预览提取未接入,媒体区
 *   渲染诚实空槽,不伪造缩略图;
 * - 详情抽屉 = 条目详情(entryDetail 读取面):模式行(覆盖 or 跟随全局,
 *   F4-9 的编辑展示位)+ 工件清单;quarantined 的诚实拒绝理由在此呈现;
 * - 搜索为显示名/文件夹名/相对路径客户端过滤(fixture 规模);真实实现
 *   移交端口查询时 UI 不重写。
 */

function artifactSize(artifact: WarehouseArtifact): string {
  const size = sizeText(artifact.sizeBytes);
  return format(copy[size.unitKey], { amount: size.amount });
}

function stateTone(state: WarehouseArtifactState) {
  // 色彩纪律(§6.1):隔离是安全异常,用红;待检查中性;未见可执行内容用 success
  switch (state) {
    case "quarantined":
      return "error" as const;
    case "clean":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

/* ---- 工件卡片(与云端目录卡同形同交互;卡片 = 条目 × 工件) ---- */

function ArtifactCard({
  card,
  selected,
  onOpen,
  onMenu,
}: {
  card: AcquireArtifactCard;
  selected: boolean;
  onOpen: () => void;
  onMenu: (event: ReactMouseEvent<HTMLElement>) => void;
}) {
  const { entry, artifact } = card;
  return (
    <article
      className="vua-warehouse-card"
      data-selected={selected || undefined}
      data-verdict={artifact.state}
      onClick={onOpen}
      onContextMenu={onMenu}
      role="listitem"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="vua-warehouse-card__media">
        {/* 预览提取未接入(F4-6 裁决):诚实空槽,升版随检查钩子切片回归 */}
        <div className="vua-warehouse-card__no-image">
          <span className="vua-caption vua-text-secondary">{copy.previewEmpty}</span>
        </div>
      </div>
      <div className="vua-warehouse-card__body">
        <p className="vua-warehouse-card__title" title={entry.displayName}>
          {entry.displayName}
        </p>
        <div className="vua-warehouse-card__meta">
          <span>{artifactSize(artifact)}</span>
          <span className="vua-caption vua-text-secondary">{copy.kind[entry.kind]}</span>
        </div>
        <div className="vua-warehouse-card__badges">
          <Badge tone={stateTone(artifact.state)}>{copy.verdict[artifact.state]}</Badge>
          <Badge tone="neutral">{copy.role[artifact.role]}</Badge>
        </div>
      </div>
    </article>
  );
}

/* ---- 条目详情抽屉(entryDetail 读取面) ---- */

type DetailState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "loaded"; view: AcquireEntryDetailView };

function EntryDetail({ entryId }: { entryId: string }) {
  const gateway = useGateway();
  const [state, setState] = useState<DetailState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    gateway.acquire.entryDetail(entryId).then(
      (view) => {
        if (active) setState({ kind: "loaded", view });
      },
      () => {
        if (active) setState({ kind: "failed" });
      },
    );
    return () => {
      active = false;
    };
  }, [gateway, entryId, reloadKey]);

  if (state.kind === "loading") {
    return (
      <div className="vua-warehouse-detail__content">
        <Skeleton width="100%" height="auto" className="vua-warehouse-card__skeleton-media" />
        <Skeleton width="50%" height={14} />
        <Skeleton width="100%" height={60} />
      </div>
    );
  }
  if (state.kind === "failed" || state.view.kind === "not-connected") {
    return (
      <div className="vua-warehouse-detail__content">
        <p className="vua-text-secondary">{copy.detailLoadFailed}</p>
        <div>
          <Button variant="default" onClick={() => setReloadKey((key) => key + 1)}>
            {cloudCopy.detail.retry}
          </Button>
        </div>
      </div>
    );
  }
  if (state.view.kind === "not-found") {
    return (
      <div className="vua-warehouse-detail__content">
        <p className="vua-text-secondary">{copy.detailNotFound}</p>
      </div>
    );
  }

  const entry = state.view.entry;
  const mode = entryModeLine(entry);
  return (
    <div className="vua-warehouse-detail__content">
      {/* 预览提取未接入:诚实空槽(与卡片媒体区同一纪律) */}
      <div className="vua-warehouse-detail__preview3d">
        <span className="vua-caption vua-text-secondary">{copy.previewEmpty}</span>
      </div>
      <div className="vua-warehouse-detail__badges">
        <Badge tone="neutral">{copy.kind[entry.kind]}</Badge>
        {/* 模式行(F4-9 编辑展示位):生效模式 + 覆盖 or 跟随全局 */}
        <Badge tone="neutral">{copy.mode[mode.effective]}</Badge>
        <Badge tone="neutral">
          {mode.overridden ? copy.modeOverride : copy.modeFollowGlobal}
        </Badge>
      </div>
      <p className="vua-caption vua-text-secondary" title={entry.folderName}>
        {entry.folderName}
      </p>

      <section>
        <h3 className="vua-warehouse-detail__section-title">{copy.artifactsTitle}</h3>
        <ul className="vua-acquire__executables">
          {entry.artifacts.map((artifact) => (
            <li key={artifact.artifactSha256}>
              <div>
                <code>{artifact.relativePath}</code>{" "}
                <Badge tone={stateTone(artifact.state)}>{copy.verdict[artifact.state]}</Badge>{" "}
                <Badge tone="neutral">{copy.role[artifact.role]}</Badge>{" "}
                <span className="vua-caption vua-text-secondary">{artifactSize(artifact)}</span>
              </div>
              {artifact.state === "quarantined" && artifact.rejectionReason !== null ? (
                <p className="vua-caption vua-text-secondary">{artifact.rejectionReason}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {entry.artifacts.some((artifact) => artifact.state === "quarantined") ? (
        <p className="vua-caption vua-text-secondary">
          {format(copy.neverRunNote, { recipe: termLabel("recipe") })}
        </p>
      ) : null}
      {entry.artifacts.some((artifact) => artifact.state === "pending") ? (
        <p className="vua-caption vua-text-secondary">
          {format(copy.pendingNote, { recipe: termLabel("recipe") })}
        </p>
      ) : null}
    </div>
  );
}

/* ---- 页面 ---- */

export function WarehouseAcquire() {
  const view = useAcquireView();
  const [text, setText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 工件卡右键菜单(S-XII):仅真实动作——查看详情(条目) */
  const [cardMenu, setCardMenu] = useState<ContextMenuState | null>(null);

  // 指针聚光 + 微倾斜,与云端墙一致(非 animated 模式零开销)
  const [wallEl, setWallEl] = useState<HTMLDivElement | null>(null);
  useCardSpotlight(wallEl);

  if (view.kind === "not-connected") {
    return (
      <EmptyState
        title={copy.states.notConnectedTitle}
        description={copy.states.notConnectedDescription}
      />
    );
  }

  const cards = artifactCards(view.entries);
  const selectedEntry =
    selectedId === null
      ? null
      : (view.entries.find((entry) => entry.warehouseItemId === selectedId) ?? null);

  const shown = cards.filter((card) => artifactCardMatches(card, text));

  const openCardMenu = (event: ReactMouseEvent<HTMLElement>, card: AcquireArtifactCard) => {
    event.preventDefault();
    setCardMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          id: "open",
          label: cloudCopy.card.detailsCta,
          onSelect: () => setSelectedId(card.entry.warehouseItemId),
        },
      ],
    });
  };

  return (
    <div className="vua-warehouse__content" data-drawer-open={selectedEntry !== null || undefined}>
      <div className="vua-warehouse__main">
        <div className="vua-warehouse__toolbar" role="search">
          <input
            type="search"
            className="vua-warehouse__search"
            placeholder={cloudCopy.searchPlaceholder}
            aria-label={cloudCopy.searchAria}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <span className="vua-caption vua-text-secondary">
            {format(copy.entryCount, { count: view.entries.length })}
          </span>
        </div>

        <div className="vua-warehouse__wall-scroll" ref={setWallEl}>
          {view.entries.length === 0 ? (
            <EmptyState title={copy.entriesTitle} description={copy.entriesEmpty} />
          ) : shown.length === 0 ? (
            <EmptyState
              title={cloudCopy.states.emptyResultTitle}
              description={cloudCopy.states.emptyResultDescription}
            />
          ) : (
            <div className="vua-warehouse__wall" role="list">
              {shown.map((card) => (
                <ArtifactCard
                  key={card.key}
                  card={card}
                  selected={card.entry.warehouseItemId === selectedId}
                  onOpen={() => setSelectedId(card.entry.warehouseItemId)}
                  onMenu={(event) => openCardMenu(event, card)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEntry !== null ? (
        <aside
          className="vua-warehouse__drawer"
          aria-label={cloudCopy.detail.panelAria}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedId(null);
          }}
        >
          <div className="vua-warehouse__drawer-header">
            <h2 className="vua-warehouse-detail__title" title={selectedEntry.displayName}>
              {selectedEntry.displayName}
            </h2>
            <Button
              variant="subtle"
              aria-label={cloudCopy.detail.closeAria}
              onClick={() => setSelectedId(null)}
            >
              {cloudCopy.detail.close}
            </Button>
          </div>
          {/* key=warehouseItemId:切换条目时重置详情取数与组件内状态 */}
          <EntryDetail key={selectedEntry.warehouseItemId} entryId={selectedEntry.warehouseItemId} />
        </aside>
      ) : null}
      {cardMenu !== null ? (
        <ContextMenu menu={cardMenu} onClose={() => setCardMenu(null)} />
      ) : null}
    </div>
  );
}
