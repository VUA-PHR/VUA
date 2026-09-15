import type { ReleaseHandoffFactV01 } from "@vua/contracts";

/**
 * release.openForHandoff 消费端口(023 词表行,核心冻结批 2026-09-16 经
 * 第 53 波 c77034f 入库;协议本 release-handoff v0.1):
 * - tasked 命令:受理回执按 taskId 轮询应用任务面(九态单形态,完成判定
 *   = Bridge handshake 到达;succeeded 快照 result 携带交接事实文档);
 * - 实现域(产线进程/窗口面 port＋核心 use case)未接线 = 路由恒答
 *   vua.release_handoff.unavailable 诚实缺席——本端口将其呈现为缺席语义,
 *   绝不以受理假象/合成任务快照伪装(wire 测试钉死「缺席不携带受理形状」);
 * - fixture/empty 实现恒缺席:交接是观察事实命令,DEV 演示不制造合成受理
 *   (productionChain「无模拟替代」纪律同构)。
 */

/** 交接意图结果(release.openForHandoff 受理面):
 * - accepted:受理成立,按 taskId 轮询任务面;
 * - absent:诚实缺席(vua.release_handoff.unavailable 或宿主不可达)——
 *   通道未接线/不可达,绝无受理发生;
 * - failed:请求被拒(code=应用错误码原样透传;null=信封级拒绝,无应用码)。
 * 未知错误码不猜测映射为已知码,原样呈现(诚实纪律)。 */
export type ReleaseHandoffIntent =
  | { readonly kind: "accepted"; readonly taskId: string; readonly correlationId: string }
  | { readonly kind: "absent" }
  | { readonly kind: "failed"; readonly code: string | null };

/** 交接任务视图(task.get 快照投影;九态原词透传,不重列词表):
 * - running:非终态(state 为九态原词;词表外原样呈现,不猜测);
 * - succeeded:succeeded/succeeded_with_warnings 且 result 携带可解释交接
 *   事实(经 contracts isReleaseHandoffFactV01 守卫);
 * - failed:failed 终态(错误事实为任务面 AppErrorV01 数据负载,原样透传
 *   ——任务运行期失败不进 release_handoff 错误码闭集,协议本钉死);
 * - cancelled:用户经任务中心取消;
 * - fact-unexplainable:任务终态成功但交接事实缺失或形状不可解释——如实
 *   呈现,不猜测内容(诚实纪律 1)。 */
export type HandoffTaskView =
  | { readonly kind: "running"; readonly state: string }
  | { readonly kind: "succeeded"; readonly fact: ReleaseHandoffFactV01 }
  | {
      readonly kind: "failed";
      readonly state: string;
      readonly errorCode: string | null;
      readonly messageKey: string | null;
    }
  | { readonly kind: "cancelled" }
  | { readonly kind: "fact-unexplainable" };

export interface ReleaseHandoffPort {
  /** 发起交接(release.openForHandoff;params 闭集单键 {buildId}) */
  openForHandoff(buildId: string): Promise<ReleaseHandoffIntent>;
  /** 按 taskId 取任务权威快照(task.get;投影为交接任务视图)。
   *  null = 本轮读取失败(断连/响应不可解释)——调用方保持上一视图,
   *  绝不猜测任务状态。 */
  taskSnapshot(taskId: string): Promise<HandoffTaskView | null>;
}
