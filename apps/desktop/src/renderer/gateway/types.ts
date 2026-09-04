/**
 * Gateway 共享类型(G3):六个领域窄端口的公共词汇。
 *
 * - DataSource:数据来源标识。fixture 仅 DEV 构建可达,界面必须带"演示数据"
 *   徽标;live 为真实应用层;none 为诚实空态(原则①)。
 * - CapabilityState(美术方案 v0.3.3 §2.6):入口显隐由能力报告决定,
 *   禁止永远返回空值的猜测接口。
 */

export type DataSource = "fixture" | "live" | "none";

/**
 * 能力状态七态(v0.3.3 §2.6 + G3 自审补强):
 * waitingInput 为能力级等待用户操作(典型:检测需先关闭 VRChat)——
 * 区别于页面内表单等待输入;页面内状态不进入本枚举。
 */
export type CapabilityState =
  | "unavailable"
  | "unconfigured"
  | "loading"
  | "ready"
  | "blocked"
  | "waitingInput"
  | "error";

export interface CapabilityReport {
  state: CapabilityState;
  /** 说明文案 key(strings.capability.details);无补充说明时省略 */
  detailKey?: "detectorsMissing" | "taskEngineMissing" | "catalogMissing" | "packagesEngineMissing";
}

/** 七态全集:与 strings.capability.states 一一对应(契约测试与展台共用) */
export const capabilityStates: readonly CapabilityState[] = [
  "unavailable",
  "unconfigured",
  "loading",
  "ready",
  "blocked",
  "waitingInput",
  "error",
];

export type CapabilityDetailKey = NonNullable<CapabilityReport["detailKey"]>;

/** 说明文案键全集:与 strings.capability.details 一一对应 */
export const capabilityDetailKeys: readonly CapabilityDetailKey[] = [
  "detectorsMissing",
  "taskEngineMissing",
  "catalogMissing",
  "packagesEngineMissing",
];

export type Unsubscribe = () => void;
