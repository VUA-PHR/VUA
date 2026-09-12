import { describe, expect, it } from "vitest";
import {
  EDITOR_REFUSAL_CODES,
  narrowEditorFinding,
  narrowEditorFindings,
  narrowVerifyEditorResult,
  refusalCodeKey,
} from "./environment-settings-model.js";

/**
 * U10 设置面收窄纯函数测试(向量形状对表;词表外如实原词,不猜测)。
 */

const verifiedVector = {
  verdict: "verified",
  editorRoot: "C:\\Editors\\2022.3.22f1",
  exePath: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe",
  version: "2022.3.22f1",
  classification: "production_target",
  guidanceCode: "vua.env_managers.editor_production_target",
  chinaDistribution: false,
  schemaVersion: "0.1",
};

describe("editor finding narrowing (environmentManagers prefill)", () => {
  it("narrows a well-formed finding and flags closed-set classification", () => {
    const narrowed = narrowEditorFinding({
      version: "2022.3.22f1",
      classification: "production_target",
      chinaDistribution: false,
      guidanceCode: "vua.env_managers.editor_production_target",
      path: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe",
    });
    expect(narrowed).not.toBeNull();
    expect(narrowed?.classificationKnown).toBe(true);
    expect(narrowed?.chinaDistribution).toBe(false);
  });

  it("keeps unknown classification verbatim without guessing", () => {
    const narrowed = narrowEditorFinding({
      version: "9.9.9x9",
      classification: "some_future_class",
      chinaDistribution: false,
      guidanceCode: "vua.env_managers.something",
      path: "C:\\x",
    });
    expect(narrowed?.classification).toBe("some_future_class");
    expect(narrowed?.classificationKnown).toBe(false);
  });

  it("returns null for malformed findings and filters them from lists", () => {
    expect(narrowEditorFinding(null)).toBeNull();
    expect(narrowEditorFinding("editor")).toBeNull();
    expect(narrowEditorFinding({ version: "1" })).toBeNull();
    expect(narrowEditorFindings("nope")).toBeNull();
    expect(narrowEditorFindings([])).toEqual([]);
    // verifyEditor 向量形状 ≠ EditorFinding 形状(后者是 path 字段)——
    // 缺字段即 null,逐项过滤,不猜测
    const finding = {
      version: "2022.3.22f1",
      classification: "production_target",
      chinaDistribution: false,
      guidanceCode: "vua.env_managers.editor_production_target",
      path: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe",
    };
    const list = narrowEditorFindings([finding, { broken: true }]);
    expect(list).toHaveLength(1);
    expect(list?.[0]?.path).toBe("C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe");
  });
});

describe("verifyEditor result narrowing (two-state tagged union)", () => {
  it("narrows the verified branch field by field", () => {
    const narrowed = narrowVerifyEditorResult(verifiedVector);
    expect(narrowed).toEqual({
      kind: "verified",
      editorRoot: "C:\\Editors\\2022.3.22f1",
      exePath: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe",
      version: "2022.3.22f1",
      classification: "production_target",
      classificationKnown: true,
      guidanceCode: "vua.env_managers.editor_production_target",
      chinaDistribution: false,
    });
  });

  it("narrows refusals as findings and keeps unknown codes verbatim (nail 1/2)", () => {
    const refused = narrowVerifyEditorResult({
      verdict: "refused",
      exePath: null,
      code: "vua.editor_verify.target_missing",
      detail: "no such path",
      schemaVersion: "0.1",
    });
    expect(refused).toEqual({
      kind: "refused",
      exePath: null,
      code: "vua.editor_verify.target_missing",
      codeKnown: true,
      detail: "no such path",
    });

    // 词表外码照原词呈现(不猜测映射),detail 原样零加工
    const unknownCode = narrowVerifyEditorResult({
      verdict: "refused",
      exePath: "C:\\x\\Unity.exe",
      code: "vua.editor_verify.something_new",
      detail: 'raw "detail" | text',
      schemaVersion: "0.1",
    });
    if (unknownCode?.kind !== "refused") throw new Error("expected the refused branch");
    expect(unknownCode.codeKnown).toBe(false);
    expect(unknownCode.detail).toBe('raw "detail" | text');
  });

  it("returns null for envelope errors disguised as results or malformed shapes", () => {
    expect(narrowVerifyEditorResult(null)).toBeNull();
    expect(narrowVerifyEditorResult({ verdict: "error" })).toBeNull();
    expect(narrowVerifyEditorResult({ verdict: "refused", code: "", detail: "x" })).toBeNull();
    expect(narrowVerifyEditorResult({
      verdict: "verified", editorRoot: "C:\\x", exePath: "C:\\x", version: "1",
      classification: "production_target", guidanceCode: "g",
    })).toBeNull();
  });
});

describe("refusal code i18n mapping helpers", () => {
  it("exposes the frozen closed set from contracts without private literals", () => {
    expect(EDITOR_REFUSAL_CODES).toEqual([
      "vua.editor_verify.target_missing",
      "vua.editor_verify.exe_missing",
      "vua.editor_verify.identity_unreadable",
      "vua.editor_verify.not_an_editor",
      "vua.editor_verify.unsupported_platform",
    ]);
  });

  it("maps closed-set codes to key suffixes and returns null for unknown codes", () => {
    expect(refusalCodeKey("vua.editor_verify.not_an_editor")).toBe("not_an_editor");
    expect(refusalCodeKey("vua.editor_verify.something_new")).toBeNull();
  });
});
