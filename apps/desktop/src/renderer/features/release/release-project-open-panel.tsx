import { formatDateTime } from "../../i18n/index.ts";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import type { ReleaseInspectionFactV02 } from "@vua/contracts";
import { useGateway } from "../../gateway/index.ts";
import { format, strings } from "../../i18n/index.ts";
import { taskStateLabelKey } from "./release-handoff-model.ts";

const copy = strings.release.records.openInUnity;

/**
 * 「在 Unity 中打开以检查/修复」独立动作面板(U19 第二交付,用户裁决
 * 2026-09-21,BOARD U19 行规范源;TS 面随核心 v0.2 冻结形状对齐——第 156
 * 批):与交棒按钮显式分离:独立组件、独立端口(releaseProjectOpen)、独立
 * 词面组——不与 release.openForHandoff 共享任何呈现状态;
 * - 不按记录状态闸:挂载与否只取决于「构建记录可确认」(裁决①不得禁止
 *   打开工程排错),记录状态分桶呈现与此动作互不影响;
 * - 经 release.openForInspection(tasked)发起:受理后按 taskId 轮询任务面
 *   九态,完成判定=Bridge handshake 到达(契约语义,呈现层不自行推断完成);
 * - 完成呈现纪律(第 156 批六键闭集对表):succeeded 臂呈现检视事实文档的
 *   身份事实(editor/projectId/occurredAt)＋事实自携的显式 operation 词面
 *   (六键闭集:五身份键＋operation),并明示「检视打开不是交棒完成,也不
 *   授予上传许可」——不宣称交接完成的负例约束在本呈现面同样成立;绝不
 *   渲染上传进度/结果(VUA 侧无此事实——诚实纪律 1/2);
 * - 诚实缺席臂:实现域未接线=路由恒答 vua.release_handoff.unavailable→
 *   absent 呈现,不预接可用假象;empty/fixture 装配点缺席语义同律;
 * - failed 臂:检视路由错误闭集四码(invalid_params/build_unknown/
 *   editor_unresolved)原码透传呈现,不猜测映射(诚实纪律);intent-failed
 *   与 task-failed 两臂区分受理拒绝与任务运行期失败(后者走任务面九态);
 * - 取消不经本面板:取消目标在任务中心任务卡(017 批 2 验收口径一致)。
 */

/** 轮询间隔(ms):任务面权威快照 task.get;非终态继续,终态即停 */
const POLL_MS = 2000;

type ProjectOpenPhase =
  | { kind: "idle" }
  | { kind: "absent" }
  | { kind: "intent-failed"; code: string | null }
  | { kind: "polling"; taskId: string; state: string | null }
  | { kind: "succeeded"; fact: ReleaseInspectionFactV02 }
  | { kind: "task-failed"; errorCode: string | null; messageKey: string | null }
  | { kind: "cancelled" }
  | { kind: "fact-unexplainable" };

export function ProjectOpenPanel({ buildId }: { buildId: string }) {
  const gateway = useGateway();
  const [phase, setPhase] = useState<ProjectOpenPhase>({ kind: "idle" });
  const [readFailed, setReadFailed] = useState(false);
  /* phaseRef:轮询循环读取最新 phase 而不重启 interval 之外的副作用 */
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (phase.kind !== "polling") return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      timer = setTimeout(poll, POLL_MS);
    };
    const poll = () => {
      const current = phaseRef.current;
      if (current.kind !== "polling") return;
      void gateway.releaseProjectOpen.taskSnapshot(current.taskId).then((view) => {
        if (!alive) return;
        if (view === null) {
          // 本轮读取失败(断连/响应不可解释):保持上一视图,继续轮询
          setReadFailed(true);
          schedule();
          return;
        }
        setReadFailed(false);
        if (view.kind === "running") {
          // state 实际变化才更新 phase(更新触发 effect 重启并立即重查);
          // 未变化按固定周期继续,不制造高频轮询
          if (current.state !== view.state) {
            setPhase({ kind: "polling", taskId: current.taskId, state: view.state });
          } else {
            schedule();
          }
          return;
        }
        if (view.kind === "succeeded") setPhase({ kind: "succeeded", fact: view.fact });
        else if (view.kind === "failed") {
          setPhase({ kind: "task-failed", errorCode: view.errorCode, messageKey: view.messageKey });
        } else if (view.kind === "cancelled") setPhase({ kind: "cancelled" });
        else setPhase({ kind: "fact-unexplainable" });
      });
    };
    poll();
    return () => {
      alive = false;
      if (timer !== null) clearTimeout(timer);
    };
  }, [gateway, phase]);

  const submit = () => {
    setReadFailed(false);
    void gateway.releaseProjectOpen.openForInspection(buildId).then((intent) => {
      if (intent.kind === "accepted") {
        // state=null:尚无权威快照,呈现不预置九态文案(不猜测任务态)
        setPhase({ kind: "polling", taskId: intent.taskId, state: null });
      } else if (intent.kind === "absent") {
        setPhase({ kind: "absent" });
      } else {
        setPhase({ kind: "intent-failed", code: intent.code });
      }
    });
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

  if (phase.kind === "intent-failed") {
    // 受理被拒:检视路由错误闭集无专属词面映射(与交棒面板词面组分域),
    // 原码/原词呈现,不猜测映射(诚实纪律)
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

  if (phase.kind === "polling") {
    const labelKey = phase.state !== null ? taskStateLabelKey(phase.state) : null;
    return (
      <div className="vua-page__stack" data-testid="project-open-panel" role="status">
        {/* 有权威快照才渲染状态徽标;词表外原词原样呈现,不猜测 */}
        {labelKey !== null || phase.state !== null ? (
          <div className="vua-page__actions">
            <Badge tone="neutral">
              {labelKey !== null ? strings.taskStatus[labelKey] : phase.state}
            </Badge>
          </div>
        ) : null}
        <p className="vua-caption vua-text-secondary">{copy.runningNote}</p>
        {readFailed ? (
          <p className="vua-caption vua-text-secondary" role="alert">
            {copy.readFailedNote}
          </p>
        ) : null}
        <p className="vua-caption vua-text-secondary">{copy.actionNote}</p>
      </div>
    );
  }

  if (phase.kind === "succeeded") {
    // 完成事实呈现(六键闭集对表):身份事实＋事实自携 operation 词面＋
    // 「不是交棒完成/不授予上传许可」明示——负例约束在呈现面成立
    return (
      <div className="vua-page__stack" data-testid="project-open-panel" role="status">
        <div className="vua-page__actions">
          <Badge tone="neutral">{copy.succeededTitle}</Badge>
        </div>
        <p className="vua-caption vua-text-secondary">
          {format(copy.succeededLine, {
            editorVersion: phase.fact.editor.version,
            occurredAt: formatDateTime(phase.fact.occurredAt),
          })}
        </p>
        <p className="vua-caption vua-text-secondary">
          {format(copy.projectLine, { projectId: phase.fact.projectId })}
        </p>
        <p className="vua-caption vua-text-secondary">
          {format(copy.operationLine, { operation: phase.fact.operation })}
        </p>
      </div>
    );
  }

  if (phase.kind === "task-failed") {
    return (
      <div className="vua-page__stack" data-testid="project-open-panel" role="alert">
        <div className="vua-page__actions">
          <Badge tone="error">{strings.taskStatus.failed}</Badge>
          {retry}
        </div>
        {phase.errorCode !== null ? (
          <p className="vua-caption vua-text-secondary">
            {format(copy.taskErrorLine, { code: phase.errorCode })}
          </p>
        ) : (
          <p className="vua-caption vua-text-secondary">{copy.taskFailedNote}</p>
        )}
      </div>
    );
  }

  if (phase.kind === "cancelled") {
    return (
      <div className="vua-page__stack" data-testid="project-open-panel" role="status">
        <div className="vua-page__actions">
          <Badge tone="neutral">{strings.taskStatus.cancelled}</Badge>
          {retry}
        </div>
        <p className="vua-caption vua-text-secondary">{copy.cancelledNote}</p>
      </div>
    );
  }

  // fact-unexplainable:任务终态成功但事实不可解释——如实呈现,不猜测
  return (
    <div className="vua-page__stack" data-testid="project-open-panel" role="alert">
      <div className="vua-page__actions">
        <Badge tone="error">{copy.factUnexplainableTitle}</Badge>
        {retry}
      </div>
      <p className="vua-caption vua-text-secondary">{copy.factUnexplainable}</p>
    </div>
  );
}
