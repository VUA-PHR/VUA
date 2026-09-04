/**
 * 修复计划模型(C-ENV 修复计划流;Issue #4 分层问诊的呈现侧)。
 * 纯数据、无 IO:计划负载由环境端口注入(版本化 FixPlanV1),执行进度
 * 是页面本地状态;执行只记录用户确认,检测结论只能由 runCheck 重检
 * 改变——用户点了"我已完成"不等于环境就绪(原则①)。
 *
 * Issue #4 纪律:自动识别失败时以 confirm-candidate 步骤要求用户确认
 * 候选,绝不替用户猜测;三种经验分支产出同一种版本化计划,差异只在
 * 引导文案详略(属负载,不在本模型)。
 */

export interface FixStepBase {
  id: string;
  title: string;
  description: string;
}

/** 修复计划步骤:四种类(执行体与安装器 M5 接入,本切片为引导执行) */
export type FixStep =
  /** 自动识别失败:用户确认候选后才可前进,不猜测 */
  | (FixStepBase & { kind: "confirm-candidate"; candidates: string[] })
  /** 打开官方页面(系统浏览器,双轨纪律;不内嵌 WebView) */
  | (FixStepBase & { kind: "external-link"; url: string })
  /** 用户手动操作(如运行官方安装器)后自行确认 */
  | (FixStepBase & { kind: "manual" })
  /** 末尾重检:唯一能让结论发生变化的动作 */
  | (FixStepBase & { kind: "recheck" });

/** 版本化修复计划负载 */
export interface FixPlanV1 {
  schemaVersion: 1;
  planId: string;
  /** 对应的检测项 id(CheckItem.id) */
  checkId: string;
  title: string;
  /** 影响范围说明:动手前明示(与工具合集同一纪律) */
  impact: string;
  steps: FixStep[];
}

/** 当前步骤是否可前进:候选确认步必须先选定候选(Issue #4:不猜测) */
export function canAdvanceStep(step: FixStep, confirmedCandidate: string | null): boolean {
  return step.kind !== "confirm-candidate" || confirmedCandidate !== null;
}
