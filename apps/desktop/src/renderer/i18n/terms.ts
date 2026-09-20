import { currentStrings } from "./current-table.ts";

/** Stable domain IDs; user-facing names follow the selected language (user review 2026-09-20). */
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

/** Localized label, falling back to the stable English name for brands/source-language entries. */
export function termLabel(id: TermId): string {
  const note = termNote(id);
  return note === "" ? TERMS[id] : note;
}

/** 阶段序列显示(车间流水线):termLabel 以箭头连接,按当前语言显示 */
export function termSequence(ids: readonly TermId[]): string {
  return ids.map(termLabel).join(" → ");
}
