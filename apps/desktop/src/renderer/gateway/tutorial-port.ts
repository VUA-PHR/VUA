/**
 * 教程领域窄端口(M0 TutorialPort):复用 G4 已落地的 TutorialSurfacePort
 * (桌面教程窗口与 SteamVR helper 双表面共用),作为 Gateway 的一面暴露。
 * 实现与类型定义留在 app/tutorial-port.ts,本文件只做端口角色重导出。
 */
export { createInactiveTutorialPort } from "../app/tutorial-port.ts";
export type {
  DispatchResult,
  TutorialAction,
  TutorialSnapshot,
  TutorialSurfacePort as TutorialPort,
} from "../app/tutorial-port.ts";
