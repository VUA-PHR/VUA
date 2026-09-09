import { useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Card } from "../../components/primitives/Card.tsx";
import { useEnvironmentView, useGateway } from "../../gateway/index.ts";
import { strings } from "../../i18n/index.ts";
import type { ImportCopyPlanV01, ImportCopyReceiptV01 } from "@vua/contracts";
import {
  bytesText,
  confirmChainDecision,
  receiptLines,
  type ConfirmChainTexts,
  type GuardTextTable,
} from "./project-compat-model.ts";
import "./project-compat.css";

/**
 * F6 项目兼容页(M6 T-C;product-boundary 1.2.0 权威语义,U3 裁决):
 * 对 ALCOM/VCC 管理的项目只读兼容呈现与「导入为 VUA 管理的副本」确认链。
 *
 * 数据源两段(诚实纪律):
 * - 环境状态段:env 引擎 presence 模型(create 辖区版本轨道)先行消费,
 *   恒标注「VUA 侧检测,非 ALCOM/VCC 记录」;
 * - 项目检测段:环境 T-B 检测读面 wire 面随提案 013 待裁——呈现兼容矩阵
 *   1.0.0 的检测项预告,数据获取待裁后接线;
 * - 副本导入确认链(014 语义冻结,已接线):源路径(检测读面接线前为文本
 *   输入,如实标注)→目标表单→plan 要点确认面板→apply→receipt 呈现;
 *   守卫拒绝(七项闭集)按 guard 原样映射文案与 detail。
 *   确认链呈现决策与回执五项投影抽为纯函数(project-compat-model,裁决 1:
 *   B8/B9 两呈现段的测试范围),本组件只做状态迁移与渲染。
 *
 * 写操作交接:呈现 1.2.0 禁止清单要点与「交接给对应管理器」引导;
 * 交接的具体交互形态(外部拉起等)待规格确认,本批不实现。
 */
const copy = strings.projectCompat;

const guardTable: GuardTextTable = {
  target_exists: copy.guardTargetExists,
  target_inside_source: copy.guardTargetInsideSource,
  source_not_registered: copy.guardSourceNotRegistered,
  source_invalid: copy.guardSourceInvalid,
  insufficient_disk_space: copy.guardInsufficientDiskSpace,
  plan_drift: copy.guardPlanDrift,
  execution_failed: copy.guardExecutionFailed,
};

const confirmTexts: ConfirmChainTexts = {
  guardTable,
  guardFallback: copy.guardFallback,
  unavailable: copy.importUnavailable,
};

const receiptLabels = {
  target: copy.importReceiptTarget,
  bytes: copy.importReceiptBytes,
  copied: copy.importReceiptCopied,
  source: copy.importReceiptSource,
  inspect: copy.importReceiptInspect,
};

type Flow =
  | { readonly kind: "idle" }
  | { readonly kind: "form" }
  | { readonly kind: "plan"; readonly plan: ImportCopyPlanV01 }
  | { readonly kind: "receipt"; readonly receipt: ImportCopyReceiptV01 };

export function ProjectCompatPage() {
  const environment = useEnvironmentView();
  const gateway = useGateway();
  const [flow, setFlow] = useState<Flow>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  // 表单草稿(014:源路径在检测读面接线前为文本输入,如实标注)
  const [sourcePath, setSourcePath] = useState("");
  const [parentDir, setParentDir] = useState("");
  const [projectName, setProjectName] = useState("");

  const startForm = () => {
    setFlow({ kind: "form" });
    setErrorFeedback(null);
  };

  const pickParent = () => {
    void window.vua?.dialog.pickWarehouseFolders().then((folders) => {
      if (folders !== null && folders.length > 0) setParentDir(folders[0]!);
    });
  };

  const applyDecision = (outcome: Parameters<typeof confirmChainDecision>[0]): void => {
    const decision = confirmChainDecision(outcome, confirmTexts);
    if (decision.kind === "plan") {
      setFlow({ kind: "plan", plan: decision.plan });
    } else if (decision.kind === "receipt") {
      setFlow({ kind: "receipt", receipt: decision.receipt });
    } else {
      setErrorFeedback(decision.feedback);
    }
  };

  const submitPlan = () => {
    setBusy(true);
    setErrorFeedback(null);
    void gateway.projectOps
      .importCopy({
        phase: "plan",
        sourcePath: sourcePath.trim(),
        targetParentDirectory: parentDir.trim(),
        targetProjectName: projectName.trim(),
      })
      .then((outcome) => {
        setBusy(false);
        applyDecision(outcome);
      });
  };

  const submitApply = (plan: ImportCopyPlanV01) => {
    setBusy(true);
    setErrorFeedback(null);
    void gateway.projectOps
      .importCopy({
        phase: "apply",
        sourcePath: plan.sourcePath,
        targetParentDirectory: parentDir.trim(),
        targetProjectName: projectName.trim(),
        confirmedPlanDigest: plan.planDigest,
      })
      .then((outcome) => {
        setBusy(false);
        applyDecision(outcome);
      });
  };

  return (
    <div className="vua-page">
      <section className="vua-page__hero">
        <h1 className="vua-title">{strings.nav.pages.projectCompat}</h1>
      </section>

      <Card>
        <div className="vua-page__stack">
          <h2 className="vua-title">{copy.title}</h2>
          <p className="vua-caption vua-text-secondary">{copy.subtitle}</p>

          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.readOnlyTitle}</h3>
            <p className="vua-text-secondary">{copy.readOnlyDesc}</p>
          </section>

          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.detectionTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.detectionSource}</p>
            <p className="vua-caption vua-text-secondary">{copy.detectionItemsTitle}</p>
            <ul className="vua-project-compat__specs">
              {copy.detectionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="vua-caption vua-text-secondary" role="note">
              {copy.detectionNotWired}
            </p>
          </section>

          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.envStatusTitle}</h3>
            <p className="vua-caption vua-text-secondary">{copy.envStatusSource}</p>
            {environment.versions.create.length > 0 ? (
              <ul className="vua-project-compat__env-list">
                {environment.versions.create.map((track) => (
                  <li key={track.id}>
                    <strong>{track.title}</strong>{" "}
                    <span className="vua-caption vua-text-secondary">
                      {track.installed ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </Card>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">{copy.handoverTitle}</h3>
            <p className="vua-text-secondary">{copy.handoverDesc}</p>
          </section>
        </div>
      </Card>

      <Card>
        <div className="vua-page__stack">
          <section>
            <h3 className="vua-warehouse-detail__section-title">
              {copy.importTitle} <Badge tone="error">⚠</Badge>
            </h3>
            <p className="vua-text-secondary">{copy.importSpecIntro}</p>
            <ul className="vua-project-compat__specs">
              {copy.importSpecs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          </section>

          {flow.kind === "idle" ? (
            <Button variant="default" onClick={startForm}>
              {copy.importCta}
            </Button>
          ) : null}

          {flow.kind === "form" ? (
            <div className="vua-project-compat__form">
              <label className="vua-project-compat__label">
                <span>{copy.importSourceLabel}</span>
                <input
                  type="text"
                  value={sourcePath}
                  onChange={(event) => setSourcePath(event.target.value)}
                  placeholder={copy.importSourcePlaceholder}
                />
              </label>
              <p className="vua-caption vua-text-secondary">{copy.importSourceNote}</p>
              <label className="vua-project-compat__label">
                <span>{copy.importParentLabel}</span>
                <span className="vua-project-compat__row">
                  <input type="text" value={parentDir} readOnly placeholder="—" />
                  <Button variant="default" onClick={pickParent}>
                    {copy.importParentPick}
                  </Button>
                </span>
              </label>
              <label className="vua-project-compat__label">
                <span>{copy.importNameLabel}</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                />
              </label>
              {errorFeedback !== null ? (
                <p className="vua-caption vua-text-secondary" role="alert">
                  {errorFeedback}
                </p>
              ) : null}
              <div className="vua-project-compat__row">
                <Button
                  variant="default"
                  disabled={busy}
                  onClick={() => setFlow({ kind: "idle" })}
                >
                  {copy.importCancel}
                </Button>
                <Button
                  variant="primary"
                  disabled={busy || sourcePath.trim() === "" || parentDir.trim() === "" || projectName.trim() === ""}
                  onClick={submitPlan}
                >
                  {copy.importPlanCta}
                </Button>
              </div>
            </div>
          ) : null}

          {flow.kind === "plan" ? (
            <div
              className="vua-project-compat__form"
              role="group"
              aria-label={copy.importPlanPanelTitle}
            >
              <h3 className="vua-warehouse-detail__section-title">{copy.importPlanPanelTitle}</h3>
              <ul className="vua-project-compat__specs">
                <li>
                  {copy.importPlanTarget}: {flow.plan.targetPath}
                </li>
                <li>
                  {copy.importPlanBytes}: {bytesText(flow.plan.estimatedBytes)}
                </li>
                <li>
                  {copy.importPlanExcluded}: {flow.plan.excludedEntries.join(", ")}
                </li>
                <li>
                  {copy.importPlanTopLevels}: {flow.plan.sourceTopLevels.join(", ")}
                </li>
                <li>
                  {copy.importPlanDigest}: …{flow.plan.planDigest.slice(-8)}
                </li>
              </ul>
              {errorFeedback !== null ? (
                <p className="vua-caption vua-text-secondary" role="alert">
                  {errorFeedback}
                </p>
              ) : null}
              <div className="vua-project-compat__row">
                <Button
                  variant="default"
                  disabled={busy}
                  onClick={() => setFlow({ kind: "form" })}
                >
                  {copy.importCancel}
                </Button>
                <Button variant="primary" disabled={busy} onClick={() => submitApply(flow.plan)}>
                  {copy.importApplyCta}
                </Button>
              </div>
            </div>
          ) : null}

          {flow.kind === "receipt" ? (
            <div className="vua-project-compat__form" role="status">
              <h3 className="vua-warehouse-detail__section-title">{copy.importReceiptTitle}</h3>
              {/* B8 呈现五项(裁决 1):新项目路径/已复制数据/已复制内容/来源
                  关系已记录/重新检查完成——投影纯函数见 project-compat-model */}
              <ul className="vua-project-compat__specs">
                {receiptLines(flow.receipt, receiptLabels).map((line) => (
                  <li key={line.label}>
                    {line.value === "" ? line.label : `${line.label}: ${line.value}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
