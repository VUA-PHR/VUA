import { currentStrings } from "./current-table.ts";

/**
 * 产品术语常量:不进入翻译流程(i18n 预备规则④)。
 * 术语本身在任何语言下保持原形;显示模式统一为"术语 + 本地注释"
 * (如 "Warehouse 仓储"),注释部分来自当前语言表 strings.terms
 * (C-I18N:经 current-table 按 fallback 链选表)。
 * 组合术语显示一律走本模块的 termLabel / termSequence,业务代码不得
 * 自行拼接术语与注释。
 */
export const TERMS = {
  warehouse: "Warehouse",
  recipe: "Recipe",
  assembly: "Assembly",
  production: "Production",
  inspection: "Inspection",
  release: "Release",
  amf: "AMF",
} as const;

export type TermId = keyof typeof TERMS;

/** 术语的本地注释(可翻译部分);可能为空串(如 AMF 无注释) */
export function termNote(id: TermId): string {
  return currentStrings.terms[id];
}

/** 统一术语显示:"术语 + 本地注释";注释为空时仅显示术语(如 AMF) */
export function termLabel(id: TermId): string {
  const note = termNote(id);
  return note === "" ? TERMS[id] : `${TERMS[id]} ${note}`;
}

/** 阶段序列显示(车间流水线):termLabel 以箭头连接,如 "Assembly 装配 → Production 生产 → …" */
export function termSequence(ids: readonly TermId[]): string {
  return ids.map(termLabel).join(" → ");
}
