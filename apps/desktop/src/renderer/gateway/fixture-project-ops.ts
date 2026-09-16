import type { ProjectOpsOutcome, ProjectOpsPort, ProjectImportCopyParams } from "./project-ops-port.ts";

/**
 * project-ops fixture(DEV 演示):两命令恒诚实不可用。
 *
 * setNote 不提供 fixture 演示(D-6 先例):无演示目标——写面结果经 live
 * 读面确认才有意义。
 *
 * importCopy 同此裁定(#22 消费批,proposal 020 授权桌面自决):live 消费
 * 已任务化——命令成功值是任务化受理回执,结果文档随任务终态快照 result
 * 回流。fixture 若继续演示,要么伪造任务引擎(受理了 taskId 而任务中心无
 * 此任务,终态等待永不成真),要么保留一套与 live 不同构的同步结果文档
 * 形状——后者正是 #22 缺口的温床(fixture 走查通过而 live 形状不符)。
 * 复制操作的结果经 live 任务与真实文件系统确认才有意义,fixture 伪造它
 * 违反诚实纪律;确认链 UI 的不可用反馈(B9)与 live 不可用形态同构,
 * DEV 走查仍覆盖反馈路径。恒诚实不可用,与 live 受理失败同形态呈现。
 */

export function createFixtureProjectOps(): ProjectOpsPort {
  return {
    setNote: () =>
      Promise.resolve({ ok: false, error: { kind: "unavailable" } as const }),
    importCopy: (_params: ProjectImportCopyParams): Promise<ProjectOpsOutcome> =>
      Promise.resolve({ ok: false, error: { kind: "unavailable" } as const }),
    // 013 清单读面同裁定:清单由 live 聚合读出才有意义,fixture 不伪造
    // 注册项目行(024 P1 消费批)。
    listProjects: () =>
      Promise.resolve({ ok: false, error: { kind: "unavailable" } as const }),
  };
}
