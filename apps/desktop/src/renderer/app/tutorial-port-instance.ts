/**
 * 教程端口实例:应用内唯一的真实端口装配点。
 * Electron 应用层教程会话服务(M5)接入前恒为 inactive 占位;
 * 打开桌面教程窗口是壳层动作(不属于表面前端),同一切片接入。
 */
import {
  createInactiveTutorialPort,
  type TutorialSurfacePort,
} from "./tutorial-port.ts";
import type { TutorialSnapshotV1 } from "./tutorial-contract.ts";

export const tutorialPort: TutorialSurfacePort = createInactiveTutorialPort();

/** 桌面教程窗口依赖应用层会话服务,未接入前不可用 */
export const tutorialWindowAvailable = false;

/** 打开/聚焦桌面教程窗口(会话非进行中时由应用层启动新会话);
 * tutorialId 指定要开始的教程(游戏引导各页 CTA),缺省继续当前/默认教程。
 * M5 接入前显式失败。原调用方 GuidePage 已随游戏引导 Tab 退役
 * (2026-09-26 裁决,引导内容迁至覆盖层窗口);本端口为 M5 教程切片保留,
 * 接入前无在册调用方。 */
export function openTutorialWindow(tutorialId?: string): Promise<TutorialSnapshotV1> {
  return Promise.reject(new Error(`tutorial_service_unavailable:${tutorialId ?? "default"}`));
}
