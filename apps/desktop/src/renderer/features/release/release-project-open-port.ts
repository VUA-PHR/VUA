/**
 * release「在 Unity 中打开以检查/修复」消费端口(U19 第二交付,用户裁决
 * 2026-09-21,BOARD U19 行规范源):
 * - 与交棒(release.openForHandoff)显式分离的独立路径:打开工程排错不得被
 *   交棒准入闸禁止——打开编辑器既不是恢复执行也不是上传许可;
 * - 不按记录状态闸:任何可确认的构建记录都可发起(与 handoffAdmission
 *   分桶呈现无关,本端口消费不读记录状态);
 * - 完成事实不宣称交接:本动作的回执永远只陈述「编辑器打开/聚焦」类事实,
 *   绝不携带、绝不暗示上传或许可语义(裁决原文纪律);
 * - 实现域(核心座后端 open 检查入口:路由/合同面)本拍未入库 → 本端口
 *   全装配点一律结构缺席(照 createAbsentReleaseHandoffPort 先例):不虚构
 *   路由方法名、不发明受理回执形状(accepted 臂随核心冻结回执形状入库时
 *   再扩,词面不虚构后端能力);缺席降级臂由呈现层如实呈现。
 */

/** 打开意图结果:
 * - absent:能力缺席(实现域未接线)——诚实缺席,绝无打开发生;
 * - failed:请求被拒(code=应用错误码原样透传;null=信封级拒绝)。
 * 词表外错误码不猜测映射,原样呈现(诚实纪律)。 */
export type ReleaseProjectOpenIntent =
  | { readonly kind: "absent" }
  | { readonly kind: "failed"; readonly code: string | null };

export interface ReleaseProjectOpenPort {
  /** 发起「在 Unity 中打开以检查/修复」(核心入口入库后对表冻结词表;
   *  params 形状随核心合同面落位,本拍不预造) */
  openForInspection(buildId: string): Promise<ReleaseProjectOpenIntent>;
}

/** 结构缺席实现(全装配点唯一实现,候核心 open 入口入库后替换为 live) */
export function createAbsentReleaseProjectOpenPort(): ReleaseProjectOpenPort {
  return {
    openForInspection: () => Promise.resolve({ kind: "absent" }),
  };
}
