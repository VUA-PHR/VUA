import { useEffect, useState } from "react";
import {
  useGateway,
  useProductionRunView,
  type CapabilityReport,
  type MaterialRef,
  type PlanRiskChoice,
  type ProductionIntentResult,
  type ProductionRejectReason,
  type RecoverDecisionKind,
  type SourceIntake,
} from "../../gateway/index.ts";
import type { PageId } from "../../app/nav-model.ts";
import { productionFlowModel } from "./production-flow-model.ts";
import { ProductionFlowSection, type FlowPending } from "./ProductionFlowSection.tsx";

/**
 * 素材直产链宿主(proposal 029 A6/未决项 1 桌面落形,用户裁决 2026-09-22
 * 操作者第 162 批裁定:发起位退出车间、落位仓储页动作案):素材直产链的
 * 语义起点是素材(pickMaterial),落仓储页与「连续素材获取路径」(§8.3)
 * 同页承接。production-use-case v0.1〔M3 冻结〕wire 面与组件行为零改动——
 * 能力获取与意图接线自车间页原样迁入本宿主,车间页不再承担素材直产链发起。
 *
 * live 可用性门控照旧(诚实不可用,照 029 判决书注记):壳侧
 * VUA_UNITY_EDITOR 注入缺失 ⇒ provider 端 production 服务不装配 ⇒
 * 本段恒诚实不可用(hidden 态整段不渲染,§2.6)。
 *
 * 状态与意图(原则①/§6.3):能力未知(null)或非 ready 时整段隐藏;
 * 读取失败走 EmptyState+重试,重试只重拉能力报告,不修改任何本地数据;
 * 意图拒绝按 reason 行内呈现;交互意图一律经 ModelProductionPort 提交。
 */
export function ProductionFlowSectionHost({
  onNavigate,
}: {
  /** 记录卡「去出厂」链钮透传;与页级流水线同一导航原语 */
  onNavigate?: ((target: PageId) => void) | undefined;
}) {
  const gateway = useGateway();
  const productionRun = useProductionRunView();
  const [productionCap, setProductionCap] = useState<CapabilityReport | null>(null);
  const [flowFailed, setFlowFailed] = useState(false);
  const [flowNonce, setFlowNonce] = useState(0);
  const [flowPending, setFlowPending] = useState<FlowPending | null>(null);
  const [flowRejection, setFlowRejection] = useState<ProductionRejectReason | "unavailable" | null>(
    null,
  );
  const [pickedMaterial, setPickedMaterial] = useState<MaterialRef | null>(null);

  useEffect(() => {
    let alive = true;
    setFlowFailed(false);
    gateway.modelProduction
      .capability()
      .then((report) => {
        if (alive) setProductionCap(report.production);
      })
      .catch(() => {
        if (alive) setFlowFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [gateway, flowNonce]);

  const runFlowIntent = (kind: FlowPending, intent: () => Promise<ProductionIntentResult>) => {
    setFlowPending(kind);
    setFlowRejection(null);
    void intent()
      .then((result) => {
        if (result.kind === "rejected") setFlowRejection(result.reason);
        else if (result.kind === "unavailable") setFlowRejection("unavailable");
      })
      .catch(() => setFlowFailed(true))
      .finally(() => setFlowPending(null));
  };

  return (
    <ProductionFlowSection
      flow={productionFlowModel(productionRun, productionCap)}
      failed={flowFailed}
      pending={flowPending}
      rejection={flowRejection}
      material={pickedMaterial}
      onRetry={() => setFlowNonce((nonce) => nonce + 1)}
      onPickMaterial={(intake: SourceIntake) => {
        setFlowPending("pick");
        setFlowRejection(null);
        void gateway.modelProduction
          .pickMaterial(intake)
          .then((material) => {
            if (material !== null) setPickedMaterial(material);
          })
          .catch(() => setFlowFailed(true))
          .finally(() => setFlowPending(null));
      }}
      onStartInspection={() => {
        if (pickedMaterial === null) return;
        const source = pickedMaterial;
        runFlowIntent("start", () => gateway.modelProduction.startInspection(source));
      }}
      onRequestPlan={() => {
        if (productionRun.kind !== "run" || productionRun.inspection === null) return;
        const inspectionId = productionRun.inspection.inspectionId;
        runFlowIntent("plan", () => gateway.modelProduction.requestPlan(inspectionId));
      }}
      onConfirmPlan={(riskChoice: PlanRiskChoice, rememberForSession: boolean) => {
        if (productionRun.kind !== "run" || productionRun.plan === null) return;
        const { planId, revision } = productionRun.plan;
        // v0.2:确认绑定 revision + 风险决策(必填);rememberForSession 可选
        runFlowIntent("confirm", () =>
          gateway.modelProduction.confirmPlan(planId, revision, riskChoice, rememberForSession));
      }}
      onRecover={(kind: RecoverDecisionKind) => {
        if (productionRun.kind !== "run") return;
        const taskId = productionRun.taskId;
        // 只表达语义选择;用户决定 ID 由 Kernel 受理时生成并绑定
        runFlowIntent("recover", () => gateway.modelProduction.recover(taskId, { kind }));
      }}
      onNavigate={onNavigate}
    />
  );
}
