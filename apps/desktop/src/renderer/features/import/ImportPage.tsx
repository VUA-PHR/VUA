import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import {
  useGateway,
  type WarehouseCommandOutcome,
} from "../../gateway/index.ts";
import { commandErrorText } from "../warehouse/acquire-model.ts";
import { format, strings } from "../../i18n/index.ts";
import type { DownloadsListCompletedItemV04 } from "@vua/contracts";
import {
  browseAvailability,
  embeddedBrowseReducer,
  initialEmbeddedBrowseState,
  bytesText,
  type EmbeddedBrowseAvailability,
  type EmbeddedBrowseState,
} from "./import-model.ts";
import "./import-page.css";

/**
 * 素材导入页(M6 IMP-2 批 A;proposal 015 对账受理,design-standard 0.7.0
 * §8.3「素材导入独立页签」):连续素材获取路径的独立页,两段诚实呈现——
 *
 * - 云端段:内嵌浏览面板。能力两态(desktop 架构 1.1.0):app.snapshot 的
 *   remoteBrowser 标志驱动——false = 未接线诚实降级(不可用标注,无替代
 *   假动作;现状即此态,翻转随批 B);true = 面板可用(打开/地址导航/关闭
 *   视图;后退/前进需 Main 视图历史接口,本批不呈现假按钮——缺口已声明)。
 *   U9 四分法导航在 Main 侧生效,本页不做第二次分流;blocked 事件诚实呈现。
 *   批 A 未含:目录模式(catalog 轨迁移随 IMP-4 重组,双轨头移除桌面自排)、
 *   已完成下载采纳入口(批 B,wire 接线前诚实降级);
 * - 本地段:W18 提交流原样迁入(拾取→确认列表→单命令 warehouse.import→
   任务中心;IMP-4 收口,零新增词表)。两段落成同一素材包条目模型。
 */
const copy = strings.importPage;
const acquireCopy = strings.warehouse.acquire;

function commandErrorTextFor(error: {
  kind: "unavailable" | "request_rejected" | "application";
  code?: string;
}): string {
  return commandErrorText(error, acquireCopy.commandErrors as Record<string, string>);
}

/* ---- 云端段:内嵌浏览面板 ---- */

function EmbeddedBrowsePanel({
  availability,
}: {
  availability: EmbeddedBrowseAvailability;
}) {
  const [browse, setBrowse] = useState<EmbeddedBrowseState>(initialEmbeddedBrowseState);
  const [address, setAddress] = useState("");
  const [openFailed, setOpenFailed] = useState(false);

  useEffect(() => {
    const remote = window.vua?.remoteContent;
    if (remote === undefined) return undefined;
    return remote.events.subscribe((event) => {
      setBrowse((state) => embeddedBrowseReducer(state, event));
    });
  }, []);

  const openAddress = () => {
    const url = address.trim();
    setOpenFailed(false);
    void window.vua?.remoteContent?.open({ url }).catch(() => {
      // 窄面拒绝(清单外来源):诚实呈现,不放行不猜测(Main 确认层语义
      // 属导航策略面,页内确认层随批 B)
      setOpenFailed(true);
    });
  };

  const viewId = browse.viewId;
  const closeView = () => {
    if (viewId === null) return;
    void window.vua?.remoteContent?.close(viewId);
  };

  if (availability.kind === "unavailable") {
    return (
      <div className="vua-import__cloud-degraded" role="note">
        <Badge tone="neutral">{strings.settings.experimental.badge}</Badge>
        <p className="vua-text-secondary">{copy.cloudUnavailable}</p>
      </div>
    );
  }
  return (
    <div className="vua-import__cloud-panel">
      <Badge tone="neutral">{copy.cloudBadge}</Badge>
      <div className="vua-import__cloud-address" role="group" aria-label={copy.addressAria}>
        <input
          type="text"
          value={address}
          aria-label={copy.addressAria}
          placeholder={copy.addressPlaceholder}
          onChange={(event) => setAddress(event.target.value)}
        />
        <Button variant="default" disabled={address.trim() === ""} onClick={openAddress}>
          {copy.openCta}
        </Button>
        {viewId !== null ? (
          <Button variant="subtle" onClick={closeView}>
            {copy.closeCta}
          </Button>
        ) : null}
      </div>
      {openFailed ? (
        <p className="vua-caption vua-text-secondary" role="alert">
          {acquireCopy.commandErrors.vua_warehouse_unavailable}
        </p>
      ) : null}
      {browse.viewId === null ? (
        <p className="vua-caption vua-text-secondary">{copy.noView}</p>
      ) : (
        <p className="vua-caption vua-text-secondary" title={browse.currentUrl ?? undefined}>
          {browse.currentUrl}
        </p>
      )}
      {browse.lastBlocked !== null ? (
        <div role="alert">
          <p className="vua-caption vua-text-secondary">{copy.blockedTitle}</p>
          <p className="vua-caption vua-text-secondary">{browse.lastBlocked}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ---- 本地段:W18 提交流(仓储页 verbatim 迁入,IMP-4 收口) ---- */

function LocalImportSection() {
  const gateway = useGateway();
  const [pendingFolders, setPendingFolders] = useState<readonly string[] | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const startImport = () => {
    setImportFeedback(null);
    void window.vua?.dialog.pickWarehouseFolders().then((folders) => {
      if (folders === null || folders.length === 0) {
        setImportFeedback(folders === null ? null : acquireCopy.importEmptySelection);
        return;
      }
      setPendingFolders(folders);
    });
  };

  const submitImport = (folders: readonly string[]) => {
    setImportBusy(true);
    setImportFeedback(null);
    void gateway.warehouseCommands.importFolders(folders).then((outcome: WarehouseCommandOutcome) => {
      setImportBusy(false);
      if (outcome.ok) {
        setPendingFolders(null);
        setImportFeedback(acquireCopy.importAccepted);
      } else {
        setImportFeedback(commandErrorTextFor(outcome.error));
      }
    });
  };

  return (
    <div className="vua-import__local">
      <Button variant="default" onClick={startImport} disabled={importBusy}>
        {acquireCopy.importTitle}
      </Button>
      {importFeedback !== null ? (
        <p className="vua-caption vua-text-secondary" role="status">
          {importFeedback}
        </p>
      ) : null}
      {pendingFolders !== null ? (
        <div className="vua-warehouse__import-confirm" role="group" aria-label={acquireCopy.importConfirmTitle}>
          <p className="vua-warehouse-detail__section-title">{acquireCopy.importConfirmTitle}</p>
          <p className="vua-caption vua-text-secondary">{acquireCopy.importConfirmDesc}</p>
          <ul className="vua-warehouse__import-list">
            {pendingFolders.map((folder) => (
              <li key={folder}>
                <span>{folder}</span>
                <Button
                  variant="subtle"
                  aria-label={`${acquireCopy.importRemove}: ${folder}`}
                  disabled={importBusy}
                  onClick={() => setPendingFolders(pendingFolders.filter((f) => f !== folder))}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <div className="vua-warehouse__import-actions">
            <Button variant="default" disabled={importBusy} onClick={() => setPendingFolders(null)}>
              {acquireCopy.importCancel}
            </Button>
            <Button variant="primary" disabled={importBusy} onClick={() => submitImport(pendingFolders)}>
              {acquireCopy.importConfirmCta}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---- 云端段:已完成下载列表＋采纳入口(bdl-queries v0.4 + v0.4 写面) ---- */

interface DownloadsViewState {
  readonly kind: "loading" | "unavailable";
}
interface DownloadsViewLoaded {
  readonly kind: "loaded";
  readonly downloads: readonly DownloadsListCompletedItemV04[];
}

function CompletedDownloadsPanel() {
  const gateway = useGateway();
  const [state, setState] = useState<DownloadsViewState | DownloadsViewLoaded>({
    kind: "loading",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [adoptBusyId, setAdoptBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void window.vua?.gateway
      .invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "downloads.listCompleted",
        params: {},
      })
      .then((result) => {
        if (!active) return;
        // 收窄纪律(与 warehouse-commands-live 同构):必需字段收不齐 =
        // 提供方响应不可解释,如实 unavailable
        const downloads =
          result.ok
            ? (result.value as { downloads?: unknown }).downloads
            : undefined;
        if (Array.isArray(downloads)) {
          setState({ kind: "loaded", downloads: downloads as readonly DownloadsListCompletedItemV04[] });
        } else {
          setState({ kind: "unavailable" });
        }
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const adopt = (downloadId: string) => {
    setAdoptBusyId(downloadId);
    setFeedback(null);
    void gateway.warehouseCommands.importDownloads([downloadId]).then((outcome: WarehouseCommandOutcome) => {
      setAdoptBusyId(null);
      if (outcome.ok) {
        setFeedback(copy.downloadAccepted);
        setReloadKey((key) => key + 1);
      } else {
        setFeedback(
          outcome.error.kind === "application"
            ? `${commandErrorTextFor(outcome.error)}`
            : acquireCopy.commandErrors.vua_warehouse_unavailable,
        );
      }
    });
  };

  return (
    <div className="vua-import__downloads">
      {feedback !== null ? (
        <p className="vua-caption vua-text-secondary" role="status">
          {feedback}
        </p>
      ) : null}
      {state.kind === "loading" ? (
        <p className="vua-caption vua-text-secondary">{acquireCopy.importConfirmTitle}</p>
      ) : null}
      {state.kind === "unavailable" ? (
        <p className="vua-caption vua-text-secondary" role="alert">
          {acquireCopy.commandErrors.vua_warehouse_unavailable}
        </p>
      ) : null}
      {state.kind === "loaded" && state.downloads.length === 0 ? (
        <p className="vua-caption vua-text-secondary">{copy.downloadsEmpty}</p>
      ) : null}
      {state.kind === "loaded" && state.downloads.length > 0 ? (
        <ul className="vua-project-compat__specs">
          {state.downloads.map((download) => {
            const adopted = download.adoptedWarehouseItemIds.length > 0;
            const name = download.suggestedFileName ?? download.sourceUrl;
            return (
              <li key={download.downloadId}>
                <strong>{name}</strong>{" "}
                <span className="vua-caption vua-text-secondary">
                  {format(copy.downloadSize, { size: bytesText(download.receivedBytes) })} ·{" "}
                  {format(copy.downloadCompletedAt, { at: download.completedAt })}
                </span>{" "}
                {adopted ? (
                  <Badge tone="success">{copy.downloadAdopted}</Badge>
                ) : (
                  <Button
                    variant="default"
                    disabled={adoptBusyId !== null}
                    onClick={() => adopt(download.downloadId)}
                  >
                    {copy.downloadAdoptCta}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      <Button variant="subtle" onClick={() => setReloadKey((key) => key + 1)}>
        {copy.downloadsReload}
      </Button>
    </div>
  );
}

/* ---- 页面 ---- */

export function ImportPage() {
  // 能力两态数据源 = 壳能力自报(proposal 015 §11 仲裁方案 a:能力拥有者
  // (Electron 壳)经 preload 面静态自报,不经 provider 转述)。无壳环境
  // (浏览器开发)保守不可用;非函数态读取同样保守不可用。
  const availability = useMemo<EmbeddedBrowseAvailability>(
    () => browseAvailability(window.vua?.capabilities?.remoteBrowser),
    [],
  );

  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{copy.title}</h1>
        <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>
      </section>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.cloudTitle}</h3>
            <EmbeddedBrowsePanel availability={availability} />
            <h3 className="vua-warehouse-detail__section-title">{copy.downloadsTitle}</h3>
            <CompletedDownloadsPanel />
          </section>
        </div>
      </Card>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.localTitle}</h3>
            <LocalImportSection />
          </section>
        </div>
      </Card>
    </div>
  );
}
