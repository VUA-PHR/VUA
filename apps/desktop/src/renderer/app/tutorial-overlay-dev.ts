/**
 * 教程卡发布载荷(G4 P3 的纯函数部分)。
 *
 * Electron 迁移(本切片):Tauri 侧 publish/overlay_start/reset 三个 invoke
 * 未迁移——VR helper、跨进程文案发布随 Electron 教程/Overlay 切片(G7/M5)
 * 重新落地。此处保留纯载荷构建器:VR 表面不持有任何界面文案,一切文字经
 * 此载荷下发;DEV 入口在此期间显式失败(诚实,不静默)。
 *
 * 生产隔离门:本模块唯一调用点在 GuidePage 的 import.meta.env.DEV 分支内,
 * 生产构建 tree-shaking 后整个模块被剔除(check-leak 验证)。
 * 模块不得有顶层副作用(不自动发布文案),否则无法被安全剔除。
 */
import type { TutorialCardContentV1 } from "./tutorial-contract.ts";
import { strings } from "../i18n/index.ts";

/**
 * 从 strings 表构建 helper 渲染所需的全部教程卡文案(纯函数,可测)。
 */
export function buildCardContentPayload(): TutorialCardContentV1 {
  const copy = strings.tutorial;
  return {
    locale: "zh-CN",
    textScale: 1.0,
    reducedMotion:
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    progressTemplate: copy.progress,
    labels: {
      next: copy.next,
      back: copy.back,
      dismiss: copy.dismiss,
      openOnDesktop: copy.openOnDesktop,
    },
    steps: Object.fromEntries(
      Object.entries(copy.steps).map(([id, step]) => [
        id,
        { title: step.title, body: step.body },
      ]),
    ),
    completed: { title: copy.completedTitle, body: copy.completedBody },
    inactive: { title: copy.inactiveTitle, body: copy.inactiveBody },
  };
}

export interface OverlayStartOutcome {
  kind: "started" | "already_running";
}

/**
 * DEV 入口:VR overlay helper 未随 Electron 迁移(G7/M5 排期),显式失败;
 * GuidePage 的 DEV 按钮捕获后进控制台,不伪造启动成功。
 */
export async function startVrTutorial(): Promise<OverlayStartOutcome> {
  throw new Error("vr_overlay_helper_not_migrated");
}

/** DEV 诊断:复位 helper 生命周期;helper 未迁移,显式失败 */
export function resetVrTutorialOverlay(): Promise<void> {
  return Promise.reject(new Error("vr_overlay_helper_not_migrated"));
}
