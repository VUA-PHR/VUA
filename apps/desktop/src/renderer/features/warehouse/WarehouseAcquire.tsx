import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import {
  ContextMenu,
  type ContextMenuState,
} from "../../components/primitives/ContextMenu.tsx";
import { useAcquireView, type LocalArtifact } from "../../gateway/index.ts";
import { format, strings, termLabel } from "../../i18n/index.ts";
import { sizeText } from "./acquire-model.ts";
import { useCardSpotlight } from "./use-card-spotlight.ts";
import { CardAlbumMedia, DetailAlbum } from "./WarehouseAlbum.tsx";

const copy = strings.warehouse.acquire;
const cloudCopy = strings.warehouse;

/**
 * 本地素材图册(C-ACQUIRE 重做,ADR-0004:BLM 只读适配搁置后,本地轨与云端
 * 目录浏览共用同一套图册界面):
 * - 卡片墙/相册/详情抽屉复用云端浏览的组件与色彩纪律(徽标中性灰,橙仅选中描边);
 * - 数据来源:用户指定扫描范围内到达的 LocalArtifact;先检查再使用,
 *   检出可执行内容即隔离(红色左边线),绝不提供任何"运行"入口;
 * - 预览图尚未提取(pending/隔离件/未接入提取能力)时渲染诚实空槽,不伪造缩略图;
 * - 搜索为文件名客户端过滤(fixture 规模);真实实现移交端口查询时 UI 不重写。
 */

function artifactSize(artifact: LocalArtifact): string {
  if (artifact.sizeBytes === null) return copy.sizeUnknown;
  const size = sizeText(artifact.sizeBytes);
  return format(copy[size.unitKey], { amount: size.amount });
}

function verdictTone(verdict: LocalArtifact["inspection"]["verdict"]) {
  // 色彩纪律(§6.1):隔离是安全异常,用红;待检查中性;未见可执行内容用 success
  switch (verdict) {
    case "quarantined":
      return "error" as const;
    case "clean":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

/* ---- 素材卡片(与云端目录卡同形同交互) ---- */

function ArtifactCard({
  artifact,
  selected,
  onOpen,
  onMenu,
}: {
  artifact: LocalArtifact;
  selected: boolean;
  onOpen: () => void;
  onMenu: (event: ReactMouseEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className="vua-warehouse-card"
      data-selected={selected || undefined}
      data-verdict={artifact.inspection.verdict}
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
        {artifact.previewImageUrls.length > 0 ? (
          <CardAlbumMedia imageUrls={artifact.previewImageUrls} title={artifact.fileName} />
        ) : (
          <div className="vua-warehouse-card__no-image">
            <span className="vua-caption vua-text-secondary">{cloudCopy.card.noImage}</span>
          </div>
        )}
      </div>
      <div className="vua-warehouse-card__body">
        <p className="vua-warehouse-card__title" title={artifact.fileName}>
          {artifact.fileName}
        </p>
        <div className="vua-warehouse-card__meta">
          <span>{artifactSize(artifact)}</span>
        </div>
        <div className="vua-warehouse-card__badges">
          <Badge tone={verdictTone(artifact.inspection.verdict)}>
            {copy.verdict[artifact.inspection.verdict]}
          </Badge>
        </div>
      </div>
    </article>
  );
}

/* ---- 详情抽屉 ---- */

function ArtifactDetail({ artifact }: { artifact: LocalArtifact }) {
  const { verdict, executables } = artifact.inspection;
  return (
    <div className="vua-warehouse-detail__content">
      {artifact.previewImageUrls.length > 0 ? (
        <DetailAlbum imageUrls={artifact.previewImageUrls} title={artifact.fileName} />
      ) : (
        <div className="vua-warehouse-detail__preview3d">
          <span className="vua-caption vua-text-secondary">{copy.previewEmpty}</span>
        </div>
      )}
      <div className="vua-warehouse-detail__badges">
        <Badge tone={verdictTone(verdict)}>{copy.verdict[verdict]}</Badge>
        <Badge tone="neutral">{artifactSize(artifact)}</Badge>
      </div>
      {verdict === "quarantined" ? (
        <section>
          <h3 className="vua-warehouse-detail__section-title">{copy.executablesTitle}</h3>
          <ul className="vua-acquire__executables">
            {executables.map((entry) => (
              <li key={entry}>
                <code>{entry}</code>
              </li>
            ))}
          </ul>
          <p className="vua-caption vua-text-secondary">
            {format(copy.neverRunNote, { recipe: termLabel("recipe") })}
          </p>
        </section>
      ) : null}
      {verdict === "pending" ? (
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
  /** 素材卡右键菜单(S-XII):仅真实动作——查看详情 */
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

  if (view.scanDirs.length === 0) {
    return <EmptyState title={copy.scanTitle} description={copy.scanEmpty} />;
  }

  const query = text.trim().toLowerCase();
  const shown = query
    ? view.artifacts.filter((artifact) => artifact.fileName.toLowerCase().includes(query))
    : view.artifacts;
  const selected = view.artifacts.find((artifact) => artifact.artifactId === selectedId) ?? null;

  const openCardMenu = (event: ReactMouseEvent<HTMLElement>, artifact: LocalArtifact) => {
    event.preventDefault();
    setCardMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          id: "open",
          label: cloudCopy.card.detailsCta,
          onSelect: () => setSelectedId(artifact.artifactId),
        },
      ],
    });
  };

  return (
    <div className="vua-warehouse__content" data-drawer-open={selected !== null || undefined}>
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
            {copy.scanTitle}: {view.scanDirs.join(" · ")}
          </span>
        </div>

        <div className="vua-warehouse__wall-scroll" ref={setWallEl}>
          {view.artifacts.length === 0 ? (
            <EmptyState title={copy.artifactsTitle} description={copy.artifactsEmpty} />
          ) : shown.length === 0 ? (
            <EmptyState
              title={cloudCopy.states.emptyResultTitle}
              description={cloudCopy.states.emptyResultDescription}
            />
          ) : (
            <div className="vua-warehouse__wall" role="list">
              {shown.map((artifact) => (
                <ArtifactCard
                  key={artifact.artifactId}
                  artifact={artifact}
                  selected={selectedId === artifact.artifactId}
                  onOpen={() => setSelectedId(artifact.artifactId)}
                  onMenu={(event) => openCardMenu(event, artifact)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected !== null ? (
        <aside
          className="vua-warehouse__drawer"
          aria-label={cloudCopy.detail.panelAria}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedId(null);
          }}
        >
          <div className="vua-warehouse__drawer-header">
            <h2 className="vua-warehouse-detail__title" title={selected.fileName}>
              {selected.fileName}
            </h2>
            <Button
              variant="subtle"
              aria-label={cloudCopy.detail.closeAria}
              onClick={() => setSelectedId(null)}
            >
              {cloudCopy.detail.close}
            </Button>
          </div>
          {/* key=artifactId:切换素材时重置相册等组件内状态 */}
          <ArtifactDetail key={selected.artifactId} artifact={selected} />
        </aside>
      ) : null}
      {cardMenu !== null ? (
        <ContextMenu menu={cardMenu} onClose={() => setCardMenu(null)} />
      ) : null}
    </div>
  );
}
