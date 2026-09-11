import type { ProjectOpsOutcome, ProjectOpsPort, ProjectImportCopyParams } from "./project-ops-port.ts";

/**
 * project-ops fixture(DEV 演示,014 语义走查载体):plan 段返回模拟确认面
 * (固定估算与排除清单=1.2.0 复制范围演示),apply 段按 planDigest 漂移演示
 * plan_drift 拒绝——两段语义与真实 provider 同构;不产生任何文件操作。
 * setNote 不提供 fixture 演示(无演示目标;写面结果经 live 读面确认才有
 * 意义)——恒诚实不可用,与 live 受理失败同形态呈现。
 */

const DEMO_DIGEST = "demo-plan-digest-0f3a";

export function createFixtureProjectOps(): ProjectOpsPort {
  return {
    setNote: () =>
      Promise.resolve({ ok: false, error: { kind: "unavailable" } as const }),
    importCopy: (params: ProjectImportCopyParams): Promise<ProjectOpsOutcome> => {
      const targetPath = `${params.targetParentDirectory.replace(/[\\/]+$/, "")}\\${params.targetProjectName}`;
      if (params.phase === "plan") {
        return Promise.resolve({
          ok: true,
          plan: {
            kind: "plan",
            sourcePath: params.sourcePath,
            targetPath,
            targetProjectName: params.targetProjectName,
            estimatedBytes: 524_288_000,
            excludedEntries: [".vua", "Builds", "Library", "Logs", "Temp", "obj"],
            sourceTopLevels: ["Assets", "Packages", "ProjectSettings"],
            planDigest: DEMO_DIGEST,
          },
        });
      }
      if (params.confirmedPlanDigest !== DEMO_DIGEST) {
        return Promise.resolve({
          ok: true,
          rejected: {
            kind: "rejected",
            guard: "plan_drift",
            code: "vua.project.plan_drift",
            detail: "fixture: plan digest mismatch",
          },
        });
      }
      return Promise.resolve({
        ok: true,
        receipt: {
          kind: "receipt",
          sourcePath: params.sourcePath,
          targetPath,
          targetProjectName: params.targetProjectName,
          copiedTopLevels: ["Assets", "Packages", "ProjectSettings"],
          excludedEntries: [".vua", "Builds", "Library", "Logs", "Temp", "obj"],
          bytesCopied: 521_338_880,
          sourceLink: {
            sourcePath: params.sourcePath,
            sourceAssociations: ["alcom_registered"],
            importedAt: new Date().toISOString(),
            taskCorrelation: `fixture-${params.targetProjectName}`,
          },
          reInspection: {
            unityVersion: "2022.3.22f1",
            unityClassification: "production_target",
            manifestPresent: true,
            manifestSchemaOk: true,
          },
        },
      });
    },
  };
}
