import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type {
  AcquireEntryDetailView,
  AcquireView,
  WarehouseArtifactFact,
  WarehouseEntry,
  WarehouseEntryDetail,
} from "./acquire-port.ts";

/**
 * Warehouse 条目 fixture 适配(C-ACQUIRE,仅 DEV 可达;F4-6 条目模型裁决后
 * "扫描范围"图册场景退役):
 * - 默认场景:四个素材包条目,覆盖 imported_material / downloaded_material
 *   两种条目路径、pending / clean / quarantined 三种检查状态、
 *   original / generated_vpm 两种副本角色,以及模式覆盖与跟随全局两种
 *   产物模式形态;
 * - demo-acquire-empty:空仓库走查(诚实空态;空态即终态,不虚构条目)。
 * 文件夹名/相对路径/拒绝理由等展示负载集中在 strings.fixtures.zh-CN.ts;
 * 内容身份为合成 sha256(结构性代表,与真实素材无关联);时间取固定值,
 * 走查可复现。
 */

/** 合成内容身份:8 位十六进制种子重复 8 次成 64 位小写十六进制 */
function syntheticSha(seed: string): string {
  return `sha256:${seed.repeat(8)}`;
}

/** 固定演示时刻(ISO;检查完成一律晚于条目落成) */
const CREATED_AT = "2026-09-01T10:20:00+08:00";
const INSPECTED_AT = "2026-09-01T10:21:00+08:00";

/** 下载来源关联演示:结构合规的合成 booth id(非真实商品) */
const DEMO_BOOTH_ID = "booth:1234567";

export function fixtureAcquireEntries(): AcquireView {
  const copy = fixtureStrings.acquire.entries;
  const entries: readonly WarehouseEntry[] = [
    {
      warehouseItemId: "whentry-summer-uniform",
      folderName: copy.summerUniform.folderName,
      displayName: copy.summerUniform.displayName,
      kind: "imported_material",
      createdAt: CREATED_AT,
      // null = 跟随全局默认(生效 use_original_unitypackage)
      artifactMode: null,
      effectiveArtifactMode: "use_original_unitypackage",
      artifacts: [
        {
          artifactSha256: syntheticSha("a1b2c3d4"),
          relativePath: copy.summerUniform.original.relativePath,
          state: "clean",
          sizeBytes: 48_332_800,
          role: "original",
        },
      ],
    },
    {
      warehouseItemId: "whentry-miko-dress",
      folderName: copy.mikoDress.folderName,
      displayName: copy.mikoDress.displayName,
      kind: "downloaded_material",
      createdAt: CREATED_AT,
      // 每条目覆盖 generate_vpm,且生成 VPM 已在场(两 role 同条目)
      artifactMode: "generate_vpm",
      effectiveArtifactMode: "generate_vpm",
      artifacts: [
        {
          artifactSha256: syntheticSha("b2c3d4e5"),
          relativePath: copy.mikoDress.original.relativePath,
          state: "clean",
          sizeBytes: 21_184_512,
          role: "original",
        },
        {
          artifactSha256: syntheticSha("c3d4e5f6"),
          relativePath: copy.mikoDress.generatedVpm.relativePath,
          state: "clean",
          sizeBytes: 18_874_368,
          role: "generated_vpm",
        },
      ],
    },
    {
      warehouseItemId: "whentry-stage-set",
      folderName: copy.stageSet.folderName,
      displayName: copy.stageSet.displayName,
      kind: "imported_material",
      createdAt: CREATED_AT,
      artifactMode: null,
      effectiveArtifactMode: "use_original_unitypackage",
      artifacts: [
        {
          // 待检查:检查未出结论,先检查再使用
          artifactSha256: syntheticSha("d4e5f6a7"),
          relativePath: copy.stageSet.original.relativePath,
          state: "pending",
          sizeBytes: 33_554_432,
          role: "original",
        },
      ],
    },
    {
      warehouseItemId: "whentry-suspicious",
      folderName: copy.suspicious.folderName,
      displayName: copy.suspicious.displayName,
      kind: "downloaded_material",
      createdAt: CREATED_AT,
      artifactMode: null,
      effectiveArtifactMode: "use_original_unitypackage",
      artifacts: [
        {
          // 隔离件:拒绝理由只在条目详情(entryDetail 读取面)如实呈现
          artifactSha256: syntheticSha("e5f6a7b8"),
          relativePath: copy.suspicious.original.relativePath,
          state: "quarantined",
          sizeBytes: 5_242_880,
          role: "original",
        },
      ],
    },
  ];
  return { schemaVersion: 1, kind: "entries", entries };
}

/** demo-acquire-empty:空仓库(诚实空态走查) */
export function fixtureAcquireEmpty(): AcquireView {
  return { schemaVersion: 1, kind: "entries", entries: [] };
}

/** 条目工件 → 检查/来源事实(fixture 负载;词表由代码承载) */
function factsOf(
  entryId: string,
  artifact: WarehouseEntry["artifacts"][number],
): WarehouseArtifactFact {
  const downloaded = entryId === "whentry-miko-dress" || entryId === "whentry-suspicious";
  const quarantined = artifact.state === "quarantined";
  return {
    ...artifact,
    // 隔离件不给建议文件名(不诱导取用);其余取相对路径末段
    suggestedFileName: quarantined ? null : (artifact.relativePath.split("/").pop() ?? null),
    inspectedAt: artifact.state === "pending" ? null : INSPECTED_AT,
    rejectionReason:
      quarantined ? fixtureStrings.acquire.entries.suspicious.original.rejectionReason : null,
    sourceCorrelated: downloaded,
    mappedProductIds: downloaded ? [DEMO_BOOTH_ID] : [],
  };
}

/** 条目详情:条目 + 工件事实;未知条目诚实 not-found */
export function fixtureAcquireEntryDetail(warehouseItemId: string): AcquireEntryDetailView {
  const view = fixtureAcquireEntries();
  if (view.kind !== "entries") return { schemaVersion: 1, kind: "not-connected" };
  const entry = view.entries.find((item) => item.warehouseItemId === warehouseItemId);
  if (entry === undefined) return { schemaVersion: 1, kind: "not-found" };
  const detail: WarehouseEntryDetail = {
    ...entry,
    artifacts: entry.artifacts.map((artifact) => factsOf(entry.warehouseItemId, artifact)),
  };
  return { schemaVersion: 1, kind: "detail", entry: detail };
}
