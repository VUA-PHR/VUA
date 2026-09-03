/**
 * 教程表面契约的渲染层本地镜像(v1)。
 *
 * 来源:g4-overlay-verification.md 记录的教程会话语义(sessionId + 单调
 * revision、四语义动作、四状态、ok/stale/rejected 裁决)。正式版本化契约
 * 随 Electron 教程切片(M5)进入 packages/contracts;此前本镜像是唯一
 * 事实来源,应用层接入时必须以此对齐,不得另造第二套词表。
 */

/** 四个语义动作:教程表面(桌面伴随窗口 / VR Dashboard)只发送这些 */
export type TutorialActionKind = "next" | "back" | "dismiss" | "open_on_desktop";

export type TutorialStatus = "inactive" | "active" | "completed" | "dismissed";

export interface TutorialPresentationV1 {
  readonly locale: string;
  readonly textScale: number;
  readonly reducedMotion: boolean;
  readonly presentationPaletteVersion: string;
}

export interface TutorialSnapshotV1 {
  readonly schemaVersion: 1;
  readonly sessionId: string | null;
  readonly tutorialId: string | null;
  /** 单调递增;动作携带 expectedRevision,不匹配即 stale 并回最新快照 */
  readonly revision: number;
  readonly status: TutorialStatus;
  readonly currentStepId: string | null;
  readonly stepIndex: number;
  readonly stepTotal: number;
  /** 服务端按状态下发的合法动作集合 */
  readonly allowedActions: readonly TutorialActionKind[];
  readonly presentation: TutorialPresentationV1;
}

export type TutorialDispatchResultV1 =
  | { readonly kind: "ok"; readonly snapshot: TutorialSnapshotV1 }
  | { readonly kind: "stale"; readonly snapshot: TutorialSnapshotV1 }
  | {
      readonly kind: "rejected";
      readonly reason: "wrong_session" | "unknown_action" | "action_not_allowed";
      readonly snapshot: TutorialSnapshotV1;
    };

/** 端口侧惯用短名(KIMI 移植文件沿用;与 V1 类型一一对应) */
export type TutorialAction = TutorialActionKind;
export type TutorialSnapshot = TutorialSnapshotV1;
export type DispatchResult = TutorialDispatchResultV1;

/** 教程卡发布载荷(表现参数 + 全量文案;渲染端不持有界面文案的镜像来源) */
export interface TutorialCardContentV1 {
  readonly locale: string;
  readonly textScale: number;
  readonly reducedMotion: boolean;
  readonly progressTemplate: string;
  readonly labels: {
    readonly next: string;
    readonly back: string;
    readonly dismiss: string;
    readonly openOnDesktop: string;
  };
  readonly steps: Readonly<Record<string, { readonly title: string; readonly body: string }>>;
  readonly completed: { readonly title: string; readonly body: string };
  readonly inactive: { readonly title: string; readonly body: string };
}
