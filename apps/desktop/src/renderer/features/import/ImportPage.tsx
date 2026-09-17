import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { Icon } from "@vua/design-system";
import {
  useGateway,
  type WarehouseCommandOutcome,
} from "../../gateway/index.ts";
import { commandErrorText } from "../warehouse/acquire-model.ts";
import { format, strings } from "../../i18n/index.ts";
import type { DownloadsListCompletedItemV04 } from "@vua/contracts";
import {
  BOOTH_HOME_URL,
  browseAvailability,
  classifyRemoteOpenError,
  createBrowsePanelLifecycle,
  displayUrl,
  embeddedBrowseReducer,
  initialEmbeddedBrowseState,
  normalizeBrowseAddress,
  bytesText,
  narrowCompletedDownloads,
  type EmbeddedBrowseAvailability,
  type EmbeddedBrowseOpenFailure,
  type EmbeddedBrowseState,
} from "./import-model.ts";
import "./import-page.css";

/**
 * 素材导入页(M6 IMP-2 批 A;proposal 015 对账受理,design-standard 0.7.0
 * §8.3「素材导入独立页签」):连续素材获取路径的独立页,两段诚实呈现——
 *
 * - 云端段:内嵌浏览面板。能力两态(desktop 架构 1.1.0):壳能力自报驱动——
 *   false = 未接线诚实降级(不可用标注,无替代假动作);true = 面板可用。
 *   首开自动导航默认首页 booth.pm(允许清单内;用户实测缺口修复),用户
 *   关闭后不强行重开,后续导航历史照常保留;地址栏手动导航保留。视图
 *   打开时呈现固定导航条(后退/前进/刷新/回首页/URL 脱敏显示/关闭回
 *   VUA+窗口控制;用户实测缺口修复——全屏视图原盖死壳界面无法退出),
 *   Main 侧视图上缘让位同高条带(remote-content REMOTE_VIEW_NAV_STRIP_PX)。
 *   视图生命周期随页面(#25 定性修复 2026-09-13):面板卸载(切页)即关闭
 *   在途视图——页面是视图唯一控制面,卸载不关会留下无导航条、不可控的
 *   全屏视图与重开泄漏;U9 四分法导航在 Main 侧生效,本页不做第二次分流;
 *   blocked 事件诚实呈现。生命周期守卫用代次模型(#37 修复 2026-09-18):
 *   原卸载布尔在 StrictMode 效果双调用后永真,自动打开与「打开」全部
 *   瞬间自关,内嵌浏览无法进入;代次比较使活跃挂载的 open 保留、已卸载
 *   或过期挂载的 open 随即关闭。导航条经 createPortal 挂 document.body
 *   (#38 修复 2026-09-18):面板所在 .vua-card 带毛玻璃 backdrop-filter,
 *   按 CSS 规范构成 fixed 后代的包含块,把 position:fixed;top:0 的导航
 *   条钉进卡片内部、落入视图覆盖区看不见点不着(视图内无退出);portal
 *   脱离该包含块,top:0 恢复相对视口,与 Main 侧让位条带重新对齐。
 *   地址栏输入归一化(#39 修复 2026-09-18):无 scheme 的裸域名(如
 *   booth.pm)自动补 https:// 再开,无法解析的输入本地失败态呈现;
 *   open 失败按拒绝原因三分呈现(地址无法解析/清单外拒绝/打开失败),
 *   不再误用仓储命令文案(原「仓库服务尚未接入」与本错误无关,用户
 *   据此误判 #37 未修复)。Main 侧清单裁决语义不变。
 *   批 A 未含:目录模式(catalog 轨迁移随 IMP-4 重组,双轨头移除桌面自排);
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

/** 内嵌视图 open 失败文案映射(BOARD #39 修复):按拒绝原因呈现——
 *  本地归一化失败/清单外拒绝/其它失败三分,不再误用仓储命令文案
 *  (原实现复用 vua_warehouse_unavailable「仓库服务尚未接入」,与本
 *  错误完全无关,用户据此外观误判 #37 未修复)。 */
const openFailureText: Record<EmbeddedBrowseOpenFailure["kind"], string> = {
  "invalid-address": copy.openInvalidAddress,
  "origin-not-allowed": copy.openOriginNotAllowed,
  "open-failed": copy.openFailed,
};

/* ---- 云端段:内嵌浏览面板 ---- */

function EmbeddedBrowsePanel({
  availability,
}: {
  availability: EmbeddedBrowseAvailability;
}) {
  const [browse, setBrowse] = useState<EmbeddedBrowseState>(initialEmbeddedBrowseState);
  const [address, setAddress] = useState("");
  const [openFailure, setOpenFailure] = useState<EmbeddedBrowseOpenFailure | null>(null);
  // 视图生命周期守卫(#25 卸载即关 + #37 StrictMode 修复):Main 侧视图在
  // 壳导航切页后仍存续,而导航条/视图状态随本面板卸载——失联视图既无导航
  // 条也不可控(渲染层 viewId 判空,关闭入口缺席),重挂载首开还会叠加无人
  // 能关的泄漏视图。守卫用生命周期代次(import-model):挂载与卸载都推进
  // 代次,open 落定按「捕获代次 = 当前代次?」判定——原 disposedRef 布尔
  // 只在清理置 true、无挂载复位,StrictMode 效果双调用(mount→cleanup→
  // mount)后永真,每个新视图被竞态兜底立即关闭(#37 根因);代次模型下
  // 活跃挂载的 open 落定即保留,已卸载/过期挂载的 open 落定即关闭
  const lifecycleRef = useRef(createBrowsePanelLifecycle());
  const viewIdRef = useRef<string | null>(null);

  useEffect(() => {
    const remote = window.vua?.remoteContent;
    if (remote === undefined) return undefined;
    return remote.events.subscribe((event) => {
      setBrowse((state) => embeddedBrowseReducer(state, event));
    });
  }, []);

  // viewId 同步进 ref:卸载清理闭包读 state 不保新值
  useEffect(() => {
    viewIdRef.current = browse.viewId;
  }, [browse.viewId]);

  // 卸载即关(#25 定性修复;#37 起卸载接线同时推进生命周期代次):素材导入
  // 页是视图的唯一控制面(固定导航条随页面渲染,壳导航常驻面没有第二套视
  // 图控制),带着视图切页＝留下无导航条的全屏视图;页面卸载时显式关闭已
  // 托管视图,并在途 open 落定时代次失配随即关闭,重挂载首开不叠加泄漏视图
  useEffect(
    () => () => {
      lifecycleRef.current.unmount();
      const current = viewIdRef.current;
      if (current !== null) {
        void window.vua?.remoteContent?.close(current).catch(() => {
          /* 视图已被关闭(重复清理/竞态):诚实忽略,无状态可猜 */
        });
      }
    },
    [],
  );

  const openAddress = (url: string) => {
    setOpenFailure(null);
    const remote = window.vua?.remoteContent;
    if (remote === undefined) return;
    // 输入归一化(#39 修复):裸域名(如 booth.pm)自动补 https://——原样
    // 透传会被 Main 源站清单按 origin_not_allowed 拒绝(用户真机实测撞
    // 上);无法解析的输入不上 Main,本地按「地址无法解析」诚实呈现。
    // Main 清单裁决语义不变,归一化只做「用户可读地址 → 可解析 URL」翻译
    const normalized = normalizeBrowseAddress(url);
    if (normalized.kind === "invalid") {
      setOpenFailure({ kind: "invalid-address" });
      return;
    }
    const generation = lifecycleRef.current.capture();
    void remote.open({ url: normalized.url }).then((state) => {
      // open 落定时该 open 若属已卸载实例(真实切页)或已过期挂载
      // (StrictMode 首挂的自动打开),代次失配:视图随即关闭,不留失联/
      // 孤儿视图;活跃挂载的 open 正常保留(#37 修复点)
      if (lifecycleRef.current.isStale(generation)) {
        void remote.close(state.viewId).catch(() => {});
      }
    }).catch((error: unknown) => {
      // 窄面拒绝按原因诚实呈现(#39 修复:原实现误用仓储命令文案):
      // 清单外拒绝/其它失败分类呈现,不放行不猜测(Main 确认层语义属
      // 导航策略面,页内确认层随批 B);面板已卸载则不再呈现
      if (!lifecycleRef.current.isStale(generation)) {
        setOpenFailure(classifyRemoteOpenError(error));
      }
    });
  };

  // 首开自动导航默认首页(booth.pm,允许清单内;用户实测缺口修复):
  // 仅面板挂载且无打开视图时执行一次——用户关闭视图后不强行重开,
  // 后续导航历史照常保留。StrictMode 双调用下首挂的 open 在次挂后
  // 落定,由生命周期代次判失配随即关闭,只留次挂(#37 修复)视图
  useEffect(() => {
    if (availability.kind !== "available") return;
    if (window.vua?.remoteContent === undefined) return;
    openAddress(BOOTH_HOME_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 挂载一次性动作
  }, [availability.kind]);

  const viewId = browse.viewId;
  const closeView = () => {
    if (viewId === null) return;
    void window.vua?.remoteContent?.close(viewId).catch(() => {
      // 未知视图(已被关闭等):视图关闭事件会同步状态,这里不猜测
    });
  };
  const historyAction = (action: "goBack" | "goForward" | "reload") => {
    if (viewId === null) return;
    void window.vua?.remoteContent?.[action](viewId).catch(() => {
      // 未知视图(已被关闭等):视图关闭事件会同步状态,这里不猜测
    });
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
        <Button
          variant="default"
          disabled={address.trim() === ""}
          onClick={() => openAddress(address.trim())}
        >
          {copy.openCta}
        </Button>
        {viewId !== null ? (
          <Button variant="subtle" onClick={closeView}>
            {copy.closeCta}
          </Button>
        ) : null}
      </div>
      {openFailure !== null ? (
        <p className="vua-caption vua-text-secondary" role="alert">
          {openFailureText[openFailure.kind]}
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
      {/* 导航条经 createPortal 挂 document.body(#38 修复 2026-09-18):
          面板所在 .vua-card 带毛玻璃 backdrop-filter,按 CSS 规范构成
          fixed 后代的包含块,把 position:fixed;top:0 的导航条钉进卡片
          内部、落入原生视图覆盖区(Main 侧视图占 y≥44 全窗)——被压在
          视图下面看不见点不着＝视图内无退出;portal 脱离该包含块后
          top:0 恢复视口语义,重新对齐 Main 侧 REMOTE_VIEW_NAV_STRIP_PX=44
          让位条带(两处同批改动纪律不变,本修复不动高度)。仓库先例:
          ContextMenu(同类 fixed 包含块问题经 portal 解决)。条件渲染与
          卸载语义不变:随本面板卸载 portal 内容同步移除,#25 卸载即关
          与 #37 代次模型均不受影响。 */}
      {viewId !== null
        ? createPortal(
            <div className="vua-import__browse-bar" role="toolbar" aria-label={copy.navBarAria}>
              <button
                type="button"
                className="vua-import__browse-button"
                aria-label={copy.navBack}
                title={copy.navBack}
                disabled={!browse.canGoBack}
                onClick={() => historyAction("goBack")}
              >
                <Icon name="arrow-left" size={16} />
              </button>
              <button
                type="button"
                className="vua-import__browse-button"
                aria-label={copy.navForward}
                title={copy.navForward}
                disabled={!browse.canGoForward}
                onClick={() => historyAction("goForward")}
              >
                <Icon name="arrow-right" size={16} />
              </button>
              <button
                type="button"
                className="vua-import__browse-button"
                aria-label={copy.navReload}
                title={copy.navReload}
                onClick={() => historyAction("reload")}
              >
                <Icon name="refresh" size={16} />
              </button>
              <button
                type="button"
                className="vua-import__browse-button"
                aria-label={copy.navHome}
                title={copy.navHome}
                onClick={() => void window.vua?.remoteContent?.navigate(viewId, BOOTH_HOME_URL)}
              >
                <Icon name="home" size={16} />
              </button>
              <span className="vua-import__browse-url" title={browse.currentUrl ?? undefined}>
                {displayUrl(browse.currentUrl ?? "")}
              </span>
              <button
                type="button"
                className="vua-import__browse-button vua-import__browse-button--close"
                aria-label={copy.navClose}
                title={copy.navClose}
                onClick={closeView}
              >
                <Icon name="close" size={16} />
              </button>
              <span className="vua-import__browse-separator" aria-hidden="true" />
              <button
                type="button"
                className="vua-import__browse-button"
                aria-label={strings.app.windowMinimize}
                title={strings.app.windowMinimize}
                onClick={() => void window.vua?.window.minimize()}
              >
                <Icon name="minimize" size={16} />
              </button>
              <button
                type="button"
                className="vua-import__browse-button"
                aria-label={strings.app.windowMaximize}
                title={strings.app.windowMaximize}
                onClick={() => void window.vua?.window.toggleMaximize()}
              >
                <Icon name="maximize" size={16} />
              </button>
              <button
                type="button"
                className="vua-import__browse-button vua-import__browse-button--close"
                aria-label={strings.app.windowClose}
                title={strings.app.windowClose}
                onClick={() => void window.vua?.window.close()}
              >
                <Icon name="close" size={16} />
              </button>
            </div>,
            document.body,
          )
        : null}
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
        // 收窄纪律(BOARD #36 缺陷②修复批):live 应答 = bdl-queries 三键
        // 信封 {schemaVersion, operation, result:{downloads}},不是契约平铺
        // 值——按信封收窄(与 packages-live 同纪律),收不齐 = 提供方响应
        // 不可解释,如实 unavailable,不以空清单伪装
        const downloads = result.ok ? narrowCompletedDownloads(result.value) : null;
        if (downloads !== null) {
          setState({ kind: "loaded", downloads });
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
