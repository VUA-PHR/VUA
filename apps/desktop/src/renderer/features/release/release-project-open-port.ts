import type { ReleaseInspectionFactV02 } from "@vua/contracts";

/**
 * release「在 Unity 中打开以检查/修复」消费端口(U19 第二交付,用户裁决
 * 2026-09-21,BOARD U19 行规范源;TS 面随核心 v0.2 冻结形状登记对齐):
 * - 与交棒(release.openForHandoff)显式分离的独立路径:打开工程排错不得被
 *   交棒准入闸禁止——打开编辑器既不是恢复执行也不是上传许可;
 * - 不按记录状态闸:任何可确认的构建记录都可发起(与 handoffAdmission
 *   分桶呈现无关,本端口消费不读记录状态;检视路由错误闭集刻意不含两
 *   状态码——RELEASE_INSPECTION_ERROR_CODES_V02 四码);
 * - 完成事实不宣称交接:受理回执照 tasked 形状(ReleaseInspectionAcceptedV02,
 *   schemaVersion "0.2"＋operation 词面钉检视操作);succeeded 快照 result
 *   携带检视事实文档(ReleaseInspectionFactV02 六键闭集=五身份键＋显式
 *   operation 键)——词面由形状钉死,呈现面同律永不宣称交接完成,绝不
 *   携带、绝不暗示上传或许可语义(裁决原文纪律;诚实纪律 1/2 形状钉);
 * - 实现域未接线 = 路由恒答 vua.release_handoff.unavailable 诚实缺席;
 *   fixture/empty 装配恒缺席:检视打开是观察事实命令,DEV 演示不制造合成
 *   受理/合成检视事实(productionChain「无模拟替代」纪律同构)。
 */

/** 打开意图结果(release.openForInspection 受理面):
 * - accepted:受理成立,按 taskId 轮询任务面(v0.2 冻结回执形状入库,
 *   第 154 批缺席降级臂时代的 accepted 臂兑现);
 * - absent:诚实缺席(vua.release_handoff.unavailable 或宿主不可达)——
 *   通道未接线/不可达,绝无受理发生;
 * - failed:请求被拒(code=应用错误码原样透传,检视路由闭集四码——
 *   unavailable 在端口层已呈缺席;null=信封级拒绝,无应用码;params=
 *   AppErrorV01 错误参数防御性透传,缺席=空表)。未知错误码不猜测映射
 *   为已知码,原样呈现(诚实纪律)。 */
export type ReleaseProjectOpenIntent =
  | { readonly kind: "accepted"; readonly taskId: string; readonly correlationId: string }
  | { readonly kind: "absent" }
  | {
      readonly kind: "failed";
      readonly code: string | null;
      readonly params: Readonly<Record<string, string | number | boolean>>;
    };

/** 打开任务视图(task.get 快照投影;九态原词透传,不重列词表):
 * - running:非终态(state 为九态原词;词表外原样呈现,不猜测);
 * - succeeded:succeeded/succeeded_with_warnings 且 result 携带可解释检视
 *   事实(经 contracts isReleaseInspectionFactV02 守卫,六键闭集＋operation
 *   词面;携交接词面/上传状态字段的事实由构造即非法,守卫拒绝);
 * - failed:failed 终态(错误事实为任务面 AppErrorV01 数据负载,原样透传
 *   ——任务运行期失败不进检视错误码闭集,协议本钉死);
 * - cancelled:用户经任务中心取消;
 * - fact-unexplainable:任务终态成功但检视事实缺失或形状不可解释——如实
 *   呈现,不猜测内容(诚实纪律 1)。 */
export type ProjectOpenTaskView =
  | { readonly kind: "running"; readonly state: string }
  | { readonly kind: "succeeded"; readonly fact: ReleaseInspectionFactV02 }
  | {
      readonly kind: "failed";
      readonly state: string;
      readonly errorCode: string | null;
      readonly messageKey: string | null;
    }
  | { readonly kind: "cancelled" }
  | { readonly kind: "fact-unexplainable" };

export interface ReleaseProjectOpenPort {
  /** 发起「在 Unity 中打开以检查/修复」(release.openForInspection;params
   *  闭集单键 {buildId},照核心冻结合同面) */
  openForInspection(buildId: string): Promise<ReleaseProjectOpenIntent>;
  /** 按 taskId 取任务权威快照(task.get;投影为打开任务视图)。
   *  null = 本轮读取失败(断连/响应不可解释)——调用方保持上一视图,
   *  绝不猜测任务状态。 */
  taskSnapshot(taskId: string): Promise<ProjectOpenTaskView | null>;
}

/** 结构缺席实现(empty/fixture 装配点:not-run 诚实缺席/DEV 演示不制造
 *  合成受理——023 交棒端口同律;live 装配点已换 live 实现) */
export function createAbsentReleaseProjectOpenPort(): ReleaseProjectOpenPort {
  return {
    openForInspection: () => Promise.resolve({ kind: "absent" }),
    taskSnapshot: () => Promise.resolve(null),
  };
}
