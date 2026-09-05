/**
 * 桌面 Overlay 表面(切片五 F7a,键鼠形态;设计规范 v0.6.1 §8.8)。
 * 经 ?surface=overlay-desktop 在应用初始化最早阶段分流渲染:不初始化主壳
 * Gateway、DEV scenario、路由与业务 store;只挂 Overlay 表面端口。
 *
 * 交互规格(键鼠):紧凑面板 + 拖拽区标题栏 + 关闭 chrome;Tab/Shift+Tab
 * 焦点环(base.css 全局 :focus-visible)、Enter/Space 激活(原生 button)、
 * Esc 关闭;hover 态;目标 32–40px;单主操作(dismiss)。取消用 DelayedButton
 * 延迟确认原语(§8.1 危险操作纪律)。
 *
 * 诚实四态:首帧骨架 / 失败+重试 / inactive 空态 / 正常;关闭永远可用
 * (后端不可达时退化 nativeWindow?.close())。
 */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@vua/design-system";
import { overlayPort } from "./overlay-port-instance.ts";
import type {
  OverlayAction,
  OverlayEnvironmentState,
  OverlaySnapshot,
} from "./overlay-contract.ts";
import {
  overlayViewModel,
  type OverlayActionView,
  type OverlayVisualTone,
} from "./overlay-model.ts";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { DelayedButton } from "../../components/primitives/DelayedButton.tsx";
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { format, strings } from "../../i18n/index.ts";
import "./overlay.css";

const copy = strings.overlay;

/** 首帧快照超时:超过即判定后端不可达,进入失败态而非永久空白(同教程表面) */
const SNAPSHOT_TIMEOUT_MS = 4000;
/** dismiss 裁决超时:超过直接关窗,窗口永远关得掉 */
const DISMISS_TIMEOUT_MS = 2000;
/** 危险操作延迟确认(§8.1:先读完提示再可点) */
const CANCEL_DELAY_MS = 1200;
/** 壳层窗口动作(preload 注入);浏览器预览无 preload */
const nativeWindow = window.vua?.window;

/** 视觉基调 → Badge 语义色(状态不只依赖颜色:徽标文本与色条双通道) */
function badgeTone(tone: OverlayVisualTone): "neutral" | "brand" | "warning" | "error" {
  switch (tone) {
    case "neutral":
      return "neutral";
    case "accent":
      return "brand";
    case "amber":
      return "warning";
    case "error":
      return "error";
  }
}

function environmentBadgeTone(state: OverlayEnvironmentState): "success" | "brand" | "neutral" {
  switch (state) {
    case "ready":
      return "success";
    case "running":
      return "brand";
    case "missing":
      return "neutral";
  }
}

function environmentName(id: string): string {
  return id in copy.environmentNames
    ? copy.environmentNames[id as keyof typeof copy.environmentNames]
    : id;
}

export function DesktopOverlaySurface() {
  const [snapshot, setSnapshot] = useState<OverlaySnapshot | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadSnapshot = useCallback((onFailure: () => void) => {
    // 首帧快照必须带超时与失败态:请求永不返回(应用层冻结/后端不可达)时
    // 窗口不得停留在无内容的空白态(同教程表面纪律)
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), SNAPSHOT_TIMEOUT_MS);
    });
    void Promise.race([overlayPort.snapshot(), timeout])
      .then((s) => {
        if (s === null) onFailure();
        else setSnapshot(s);
      })
      .catch(onFailure);
  }, []);

  useEffect(() => {
    let alive = true;
    loadSnapshot(() => {
      if (alive) setLoadFailed(true);
    });
    const unsubscribe = overlayPort.subscribe(setSnapshot);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [loadSnapshot]);

  /** 关闭 = dismiss + 关窗;后端不可达时退化为原生关窗,窗口永远关得掉 */
  const closeSurface = useCallback(() => {
    const nativeClose = () => void nativeWindow?.close();
    if (!nativeWindow) {
      void overlayPort
        .dispatch("dismiss")
        .then((result) => setSnapshot(result.snapshot))
        .catch(() => {});
      return;
    }
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), DISMISS_TIMEOUT_MS);
    });
    void Promise.race([overlayPort.dispatch("dismiss"), timeout])
      .then(nativeClose)
      .catch(nativeClose);
  }, []);

  // Esc 关闭(桌面键鼠纪律;焦点在任何位置都可关)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSurface();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSurface]);

  const dispatch = useCallback((action: OverlayAction) => {
    // stale / rejected 都携带最新快照,以其为准重新同步
    void overlayPort.dispatch(action).then((result) => setSnapshot(result.snapshot));
  }, []);

  const retrySnapshot = useCallback(() => {
    setLoadFailed(false);
    setSnapshot(null);
    loadSnapshot(() => setLoadFailed(true));
  }, [loadSnapshot]);

  const model = snapshot === null ? null : overlayViewModel(snapshot, "desktop");

  const disabledReason = (action: OverlayActionView): string | null =>
    !action.availability.enabled ? copy.disabledReasons[action.availability.reason] : null;

  return (
    <div
      className={[
        "vua-overlay",
        "vua-overlay--desktop",
        model?.reducedMotion ? "vua-overlay--reduced-motion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--vua-overlay-text-scale": model?.textScale ?? 1 } as CSSProperties}
    >
      <header className="vua-overlay__titlebar vua-drag-region">
        <span className="vua-overlay__title vua-drag-region">{copy.surfaceTitle}</span>
        {import.meta.env.DEV ? (
          <Badge tone="warning">{strings.common.fixtureBadge}</Badge>
        ) : null}
        <button
          type="button"
          className="vua-overlay__chrome-button vua-overlay__chrome-button--close"
          aria-label={copy.closeWindow}
          title={copy.closeWindow}
          onClick={closeSurface}
        >
          <Icon name="close" size={16} />
        </button>
      </header>

      <main className="vua-overlay__body">
        {loadFailed ? (
          <>
            <EmptyState title={copy.loadErrorTitle} description={copy.loadErrorBody} />
            <div className="vua-overlay__error-actions">
              <Button variant="default" onClick={retrySnapshot}>
                {copy.retry}
              </Button>
              <Button variant="primary" onClick={() => void nativeWindow?.close()}>
                {copy.closeWindow}
              </Button>
            </div>
          </>
        ) : model === null ? (
          <>
            <Skeleton height={72} />
            <Skeleton height={56} />
            <Skeleton height={32} width="60%" />
          </>
        ) : model.state === "inactive" ? (
          <EmptyState title={copy.inactiveTitle} description={copy.inactiveBody} />
        ) : (
          <>
            <section className="vua-overlay__status" data-tone={model.tone} aria-live="polite">
              <div>
                <Badge tone={badgeTone(model.tone)}>{copy.statusTones[model.statusTone]}</Badge>
              </div>
              <h1 className="vua-overlay__status-title">{model.statusTitle}</h1>
              {model.statusDetail !== null ? (
                <p className="vua-overlay__status-detail">{model.statusDetail}</p>
              ) : null}
            </section>

            {model.task !== null ? (
              <Card className="vua-overlay__task">
                <p className="vua-overlay__section-label">{copy.taskSectionLabel}</p>
                <h2 className="vua-overlay__task-title">{model.task.title}</h2>
                <p className="vua-overlay__task-meta">
                  {strings.workflowStage[model.task.stage]}
                  {model.task.progress !== null
                    ? ` · ${format(copy.progress, model.task.progress)}`
                    : ""}
                </p>
              </Card>
            ) : null}

            {model.environment.length > 0 ? (
              <section aria-label={copy.environmentSectionLabel}>
                <p className="vua-overlay__section-label">{copy.environmentSectionLabel}</p>
                <ul className="vua-overlay__environment">
                  {model.environment.map((item) => (
                    <li key={item.id} className="vua-overlay__environment-row">
                      <span className="vua-overlay__environment-name">
                        {environmentName(item.id)}
                      </span>
                      <Badge tone={environmentBadgeTone(item.state)}>
                        {copy.environmentStates[item.state]}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {model.hiddenEnvironmentCount > 0 ? (
                  <p className="vua-overlay__more">
                    {format(copy.moreEnvironments, { count: model.hiddenEnvironmentCount })}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="vua-overlay__actions">
              {model.actions.filter((action) => action.visible).map((action) => {
                if (action.action === "request_cancel_task") {
                  const reason = disabledReason(action);
                  return (
                    <p key={action.action} className="vua-overlay__hint">
                      {reason ?? copy.cancelHint}
                    </p>
                  );
                }
                return null;
              })}
              <div className="vua-overlay__actions-row">
                {model.actions
                  .filter((action) => action.visible)
                  .map((action) => {
                    if (action.action === "request_cancel_task") {
                      const reason = disabledReason(action);
                      return (
                        <DelayedButton
                          key={action.action}
                          variant="default"
                          delayMs={CANCEL_DELAY_MS}
                          disabled={!action.availability.enabled}
                          title={reason ?? copy.cancelHint}
                          onClick={() => dispatch("request_cancel_task")}
                        >
                          {copy.actions.requestCancel}
                        </DelayedButton>
                      );
                    }
                    if (action.action === "dismiss") {
                      const reason = disabledReason(action);
                      return (
                        <Button
                          key={action.action}
                          variant={action.primary ? "primary" : "default"}
                          disabled={!action.availability.enabled}
                          title={reason ?? undefined}
                          onClick={closeSurface}
                        >
                          {copy.actions.dismiss}
                        </Button>
                      );
                    }
                    return null;
                  })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
