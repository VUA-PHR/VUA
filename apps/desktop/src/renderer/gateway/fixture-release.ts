import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type { ReleaseWallView } from "./model-production-port.ts";

/**
 * Release 卡片墙 fixture 适配(C-RECIPE-3,仅 DEV 可达):
 * 三个演示项目覆盖 healthy / drifted / missing-deps 与检测通过/未通过/
 * 未检测组合;标题等展示负载集中在 strings.fixtures.zh-CN.ts。
 * 时间戳为固定值,保证演示数据可复现。
 *
 * bakePreview(T2 烘焙转盘,DEV 接线):指向本机 Unity 演示工程的
 * build_preview 产物(Meiyun / NMSS 两工程,见 docs/research/
 * release-avatar-preview-design.md);路径是本机绝对路径,仅 DEV 经
 * vite /@fs/ 读取,正式实现由资产协议替换寻址。
 */
export function fixtureReleaseWall(): ReleaseWallView {
  const copy = fixtureStrings.release.projects;
  return {
    schemaVersion: 1,
    kind: "wall",
    projects: [
      {
        id: "proj-summer",
        title: copy.summer.title,
        recipeId: "019c0000-0000-7000-8000-000000000101",
        recipeTitle: copy.summer.recipeTitle,
        unityVersion: "2022.3.22f1",
        performanceTarget: "good",
        platforms: ["windows", "android"],
        lastInspection: { state: "passed", at: "2026-08-26T15:00:00Z" },
        health: "healthy",
        snapshotCount: 3,
        updatedAt: "2026-08-26T15:30:00Z",
        bakePreview: {
          projectRoot: "C:/Users/AR/Desktop/UP/Meiyun__Tenshi",
          commandId: "preview-demo-01",
        },
      },
      {
        id: "proj-casual",
        title: copy.casual.title,
        recipeId: "019c0000-0000-7000-8000-000000000102",
        recipeTitle: copy.casual.recipeTitle,
        unityVersion: "2022.3.22f1",
        platforms: ["windows"],
        lastInspection: { state: "passed", at: "2026-08-20T09:00:00Z" },
        health: "drifted",
        snapshotCount: 1,
        updatedAt: "2026-08-25T11:00:00Z",
        bakePreview: {
          projectRoot: "C:/Users/AR/Desktop/UP/NMSS_SchoolUniform",
          commandId: "nmss-demo-01",
        },
      },
      {
        id: "proj-legacy",
        title: copy.legacy.title,
        recipeId: "019c0000-0000-7000-8000-000000000103",
        recipeTitle: copy.legacy.recipeTitle,
        platforms: ["windows"],
        lastInspection: { state: "failed", at: "2026-08-18T08:00:00Z" },
        health: "missing-deps",
        snapshotCount: 0,
        updatedAt: "2026-08-18T08:30:00Z",
      },
    ],
  };
}
