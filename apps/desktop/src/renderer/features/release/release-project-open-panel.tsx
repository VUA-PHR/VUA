import { useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { useGateway } from "../../gateway/index.ts";
import { format, strings } from "../../i18n/index.ts";

const copy = strings.release.records.openInUnity;

/**
 * 「在 Unity 中打开以检查/修复」独立动作面板(U19 第二交付,用户裁决
 * 2026-09-21,BOARD U19 行规范源):
 * - 与交棒按钮显式分离:独立组件、独立端口(releaseProjectOpen)、独立
 *   词面组——不与 release.openForHandoff 共享任何呈现状态;
 * - 不按记录状态闸:挂载与否只取决于「构建记录可确认」(裁决①不得禁止
 *   打开工程排错),记录状态分桶呈现与此动作互不影响;
 * - 呈现纪律:动作注记明示「打开编辑器既不是恢复执行也不是上传许可」,
 *   完成事实永不宣称交接;
 * - 能力缺席降级臂:核心座后端 open 检查入口本拍未入库,端口全装配点
 *   结构缺席——点击呈现诚实缺席词面(不预接可用假象、词面不虚构后端
 *   能力,照 HandoffPanel absent 臂先例);核心入口入库后本组件零改动,
 *   仅端口装配点换 live 实现。
 */

type ProjectOpenPhase =
  | { kind: "idle" }
  | { kind: "absent" }
  | { kind: "failed"; code: string | null };

export function ProjectOpenPanel({ buildId }: { buildId: string }) {
  const gateway = useGateway();
  const [phase, setPhase] = useState<ProjectOpenPhase>({ kind: "idle" });

  const submit = () => {
    void gateway.releaseProjectOpen.openForInspection(buildId).then(setPhase);
  };

  const retry = (
    <Button variant="subtle" onClick={submit}>
      {copy.retry}
    </Button>
  );

  if (phase.kind === "idle") {
    return (
      <div className="vua-page__stack" data-testid="project-open-panel">
        <div className="vua-page__actions">
          <Button variant="subtle" onClick={submit}>
            {copy.action}
          </Button>
        </div>
        <p className="vua-caption vua-text-secondary">{copy.actionNote}</p>
      </div>
    );
  }

  if (phase.kind === "absent") {
    return (
      <div className="vua-page__stack" data-testid="project-open-panel" role="note">
        <div className="vua-page__actions">
          <Badge tone="neutral">{copy.absentTitle}</Badge>
          {retry}
        </div>
        <p className="vua-caption vua-text-secondary">{copy.absentNote}</p>
      </div>
    );
  }

  // failed:请求被拒——本端口词表未冻结(核心入口未入库),无专属词面
  // 可对表:一律原码/原词呈现,不猜测映射(诚实纪律;候核心词表冻结后
  // 再按码对表扩充专属词面)
  const face =
    phase.code !== null
      ? format(copy.failedWithCode, { code: phase.code })
      : copy.failedUnknown;
  return (
    <div className="vua-page__stack" data-testid="project-open-panel" role="alert">
      <div className="vua-page__actions">
        <Badge tone="error">{copy.failedTitle}</Badge>
        {retry}
      </div>
      <p className="vua-caption vua-text-secondary">{face}</p>
    </div>
  );
}
