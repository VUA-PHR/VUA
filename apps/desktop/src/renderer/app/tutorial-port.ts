/**
 * 教程表面端口(architecture:桌面伴随窗口与 VR Dashboard 共用同一教程进度)。
 * 契约边界:前端只读快照 + 四个语义动作(next/back/dismiss/open_on_desktop),
 * 教程进度的事实来源在应用层,前端存储只做显示缓存。
 *
 * Electron 迁移(本切片):Tauri invoke/listen 实现未迁移;应用层教程会话
 * 服务随 Electron 教程切片(M5)接入,届时经 Desktop Gateway 的教程方法
 * 实现同一端口。当前仅提供 inactive 占位:快照恒为安全空态,dispatch 一律
 * rejected——诚实呈现"教程服务未接入",不伪造会话。
 */
import type {
  DispatchResult,
  TutorialAction,
  TutorialSnapshot,
} from "./tutorial-contract.ts";

export type { TutorialAction, TutorialSnapshot, DispatchResult } from "./tutorial-contract.ts";

export type Unsubscribe = () => void;

export interface TutorialSurfacePort {
  /** 只读快照:渲染前拉取;订阅推送到达前不得把本地缓存当事实来源 */
  snapshot(): Promise<TutorialSnapshot>;
  /** 订阅快照广播(revision 缺口或动作被拒时以全量快照重新同步) */
  subscribe(callback: (snapshot: TutorialSnapshot) => void): Unsubscribe;
  /** 提交语义动作;应用层裁决 ok / stale(回最新快照) / rejected */
  dispatch(action: TutorialAction): Promise<DispatchResult>;
}

const inactiveSnapshot: TutorialSnapshot = {
  schemaVersion: 1,
  sessionId: null,
  tutorialId: null,
  revision: 0,
  status: "inactive",
  currentStepId: null,
  stepIndex: 0,
  stepTotal: 0,
  allowedActions: [],
  presentation: {
    locale: "zh-CN",
    textScale: 1,
    reducedMotion: false,
    presentationPaletteVersion: "vua-tokens-0.6.1",
  },
};

/** 未接入占位实现:永远 inactive,dispatch 一律 rejected(浏览器预览/未接入路径) */
export function createInactiveTutorialPort(): TutorialSurfacePort {
  return {
    snapshot: () => Promise.resolve(inactiveSnapshot),
    subscribe: () => () => {},
    dispatch: () =>
      Promise.resolve({
        kind: "rejected",
        reason: "wrong_session",
        snapshot: inactiveSnapshot,
      }),
  };
}
