/**
 * VR Overlay 表面(切片五 F7a,激光点按形态;设计规范 v0.6.1 §8.8)。
 * 经 ?surface=overlay-vr 在应用初始化最早阶段分流渲染;与桌面 Overlay 共享
 * 同一 OverlaySnapshot 端口,只回语义动作。
 *
 * 交互规格(触摸/激光):固定 1024×768 设计预算;无 hover 依赖——按下即
 * :active 反馈;操作目标 ≥56px;一层平面面板(不嵌套卡);动作 ≤3 个大按钮;
 * 无滚动长列表(环境摘要在模型侧截断 ≤3)。
 *
 * 取消确认形态的选择:DelayedButton 是"挂载后延迟可点"语义,激光点按下
 * 等待期间无任何反馈会被读作失灵,故 VR 端改用两步确认——点一次进入确认态
 * (confirm/keep 双按钮 + 提示),再点确认;超时(CONFIRM_TIMEOUT_MS)或快照
 * 推进自动还原。
 *
 * 诚实四态与桌面一致;关闭永远可用(后端不可达退化 nativeWindow?.close())。
 * VR 表面不做装饰动画(§8.8 + reduced-motion 纪律)。
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
import { EmptyState } from "../../components/primitives/EmptyState.tsx";
import { Skeleton } from "../../components/primitives/Skeleton.tsx";
import { format, strings } from "../../i18n/index.ts";
import "./overlay.css";

const copy = strings.overlay;

const SNAPSHOT_TIMEOUT_MS = 4000;
const DISMISS_TIMEOUT_MS = 2000;
/** 两步确认的超时还原(点按形态下不留悬挂的确认态) */
const CONFIRM_TIMEOUT_MS = 5000;
const nativeWindow = window.vua?.window;

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

export function VrOverlaySurface() {
  const [snapshot, setSnapshot] = useState<OverlaySnapshot | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [cancelArmed, setCancelArmed] = useState(false);

  const loadSnapshot = useCallback((onFailure: () => void) => {
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

  const dispatch = useCallback((action: OverlayAction) => {
    void overlayPort.dispatch(action).then((result) => setSnapshot(result.snapshot));
  }, []);

  const retrySnapshot = useCallback(() => {
    setLoadFailed(false);
    setSnapshot(null);
    loadSnapshot(() => setLoadFailed(true));
  }, [loadSnapshot]);

  // 快照推进(含取消生效)即解除确认态,不留悬挂
  const revision = snapshot?.revision;
  useEffect(() => {
    setCancelArmed(false);
  }, [revision]);

  // 确认态超时自动还原
  useEffect(() => {
    if (!cancelArmed) return;
    const timer = setTimeout(() => setCancelArmed(false), CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [cancelArmed]);

  const model = snapshot === null ? null : overlayViewModel(snapshot, "vr");

  const actionOf = (action: OverlayAction): OverlayActionView =>
    model?.actions.find((entry) => entry.action === action) ?? {
      action,
      visible: false,
      availability: { enabled: false, reason: "notAllowed" },
      primary: false,
    };

  const cancel = actionOf("request_cancel_task");
  const openOnDesktop = actionOf("open_on_desktop");
  const dismiss = actionOf("dismiss");
  const cancelReason =
    !cancel.availability.enabled && cancel.visible
      ? copy.disabledReasons[cancel.availability.reason]
      : null;

  return (
    <div
      className={[
        "vua-overlay",
        "vua-overlay--vr",
        model?.reducedMotion ? "vua-overlay--reduced-motion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--vua-overlay-text-scale": model?.textScale ?? 1 } as CSSProperties}
    >
      <header className="vua-overlay__titlebar">
        <span className="vua-overlay__title">{copy.surfaceTitle}</span>
        {import.meta.env.DEV ? (
          <Badge tone="warning">{strings.common.fixtureBadge}</Badge>
        ) : null}
        <button
          type="button"
          className="vua-overlay__chrome-button vua-overlay__chrome-button--close"
          aria-label={copy.closeWindow}
          onClick={closeSurface}
        >
          <Icon name="close" size={24} />
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
            <Skeleton height={120} />
            <Skeleton height={64} />
            <Skeleton height={56} width="50%" />
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
              <section className="vua-overlay__task" aria-label={copy.taskSectionLabel}>
                <h2 className="vua-overlay__task-title">{model.task.title}</h2>
                <p className="vua-overlay__task-meta">
                  {strings.workflowStage[model.task.stage]}
                  {model.task.progress !== null
                    ? ` · ${format(copy.progress, model.task.progress)}`
                    : ""}
                </p>
              </section>
            ) : null}

            {model.environment.length > 0 ? (
              <>
                <ul className="vua-overlay__environment" aria-label={copy.environmentSectionLabel}>
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
              </>
            ) : null}

            <div className="vua-overlay__actions">
              <div className="vua-overlay__actions-row">
                {cancel.visible && cancelArmed ? (
                  // 确认态下只留确认/返回两个目标(动作 ≤3,确认语境不混排)
                  <>
                    <Button
                      className="vua-overlay__button--danger"
                      onClick={() => {
                        setCancelArmed(false);
                        dispatch("request_cancel_task");
                      }}
                    >
                      {copy.actions.cancelConfirm}
                    </Button>
                    <Button variant="default" onClick={() => setCancelArmed(false)}>
                      {copy.actions.cancelKeep}
                    </Button>
                  </>
                ) : (
                  <>
                    {openOnDesktop.visible ? (
                      <Button
                        variant={openOnDesktop.primary ? "primary" : "default"}
                        disabled={!openOnDesktop.availability.enabled}
                        onClick={() => dispatch("open_on_desktop")}
                      >
                        {copy.actions.openOnDesktop}
                      </Button>
                    ) : null}
                    {cancel.visible ? (
                      <Button
                        variant="default"
                        disabled={!cancel.availability.enabled}
                        onClick={() => setCancelArmed(true)}
                      >
                        {copy.actions.requestCancel}
                      </Button>
                    ) : null}
                    {dismiss.visible ? (
                      <Button
                        variant={dismiss.primary ? "primary" : "default"}
                        disabled={!dismiss.availability.enabled}
                        onClick={closeSurface}
                      >
                        {copy.actions.dismiss}
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
              {cancelArmed ? (
                <p className="vua-overlay__hint">{copy.cancelArmedHint}</p>
              ) : cancelReason !== null ? (
                <p className="vua-overlay__reason">{cancelReason}</p>
              ) : cancel.visible && cancel.availability.enabled ? (
                <p className="vua-overlay__hint">{copy.cancelHint}</p>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
