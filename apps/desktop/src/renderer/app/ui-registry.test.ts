import { describe, expect, it } from "vitest";
import {
  isUiRootAvailable,
  parseUiRootSelection,
} from "./ui-registry.ts";

/* 多套 UI 批 A/D(需求 §2.1/§4 UI-01/UI-05/AC-12):UI 根注册表纯函数——
 * 词表外回落 current(现有 UI 为第一套);森林绿可用性来自构建期变体
 * 发现(D-2),发现为 absent 时如实呈现不可用。 */

describe("ui root registry", () => {
  it("parses the session selection, falling back to current for anything else", () => {
    expect(parseUiRootSelection("forest-green")).toBe("forest-green");
    expect(parseUiRootSelection("current")).toBe("current");
    expect(parseUiRootSelection(null)).toBe("current");
    expect(parseUiRootSelection("")).toBe("current");
    expect(parseUiRootSelection("unknown-ui")).toBe("current");
  });

  it("keeps the current UI available regardless of variant discovery", () => {
    expect(isUiRootAvailable("current", false)).toBe(true);
    expect(isUiRootAvailable("current", true)).toBe(true);
  });

  it("mirrors the discovered forest variant presence honestly", () => {
    // absent(干净检出/变体未就绪)= 不可用
    expect(isUiRootAvailable("forest-green", false)).toBe(false);
    // present(本机放置 gitignored 骨架)= 可用
    expect(isUiRootAvailable("forest-green", true)).toBe(true);
  });
});
