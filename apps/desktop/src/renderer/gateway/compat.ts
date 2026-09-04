import type { EntityRef } from "./refs.ts";

/**
 * 兼容性与适配展示类型(G3 自审冻结,对接 BDB L2 与中台 P4)。
 *
 * 边界纪律:
 * - 本文件冻结的是 VUA 领域层枚举,不是 BDB wire DTO——wire 字段名以
 *   BDB 正式契约为准(v0.3 仍为草案,禁止消费草案字段),wire → domain
 *   映射是将来 BDB 适配器的职责;草案漂移只改适配器,不碰页面;
 * - 兼容信息由系统自动给出(识别与兼容质量策略),不需要用户确认,
 *   但来源必须可解释——sourceKind 与 sourceExcerpt 就是"为什么"的证据;
 * - 展示侧不得把 conditional/partial 渲染成 supported(会污染生产决策)。
 */

/** 兼容结论四态;未知/无数据不是本枚举的值——无记录即不渲染,不得猜测 */
export type CompatStatus = "supported" | "unsupported" | "conditional" | "partial";

/** 兼容记录来源:规则 / 辞典词条 / 适用范围扩展 / 模型推断 / 人工录入 */
export type CompatSourceKind = "rule" | "dictionary" | "scope_expansion" | "llm" | "manual";

/**
 * 置信度:展示语义枚举而非数值(与价格纪律同理——UI 只需要分档,
 * 数值分数是 wire 层细节,不进领域模型)。
 */
export type CompatConfidence = "high" | "medium" | "low";

/** 一条兼容记录(领域模型;不可变) */
export interface CompatClaim {
  readonly status: CompatStatus;
  readonly sourceKind: CompatSourceKind;
  readonly confidence: CompatConfidence;
  /** 来源原文摘录:"为什么推荐/判定"的证据展示;识别质量策略下
   *  不需要用户确认,但必须可解释 */
  readonly sourceExcerpt?: string;
}

/** 素体互通适配候选(BDB 作者/系列集合采矿产出,如 "XX対応" 集合):
 *  Recipe 图谱与装配提示的"此衣装可用于你的素体"候选来源——
 *  候选不等于事实,展示时必须带候选性质标识 */
export interface AvatarAdaptationHint {
  readonly source: EntityRef;
  readonly target: EntityRef;
  /** 适用范围辞典词条键(如互通集合名),展示文案经词条查表 */
  readonly scopeTermKey: string;
  /** 互通种类(如 outfit_fit),领域枚举待 BDB 正式契约后收敛 */
  readonly interopKind: string;
}
