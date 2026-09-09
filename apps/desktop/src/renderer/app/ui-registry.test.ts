import { describe, expect, it } from "vitest";
import {
  isUiRootAvailable,
  parseUiRootSelection,
} from "./ui-registry.ts";

/* 多套 UI 批 A(需求 §2.1/§4 UI-01/UI-05):UI 根注册表纯函数——词表外
 * 回落 current(现有 UI 为第一套);森林绿未接入=不可用(诚实呈现)。 */

describe("ui root registry", () => {
  it("parses the session selection, falling back to current for anything else", () => {
    expect(parseUiRootSelection("forest-green")).toBe("forest-green");
    expect(parseUiRootSelection("current")).toBe("current");
    expect(parseUiRootSelection(null)).toBe("current");
    expect(parseUiRootSelection("")).toBe("current");
    expect(parseUiRootSelection("unknown-ui")).toBe("current");
  });

  it("reports availability honestly: forest-green is not wired in batch A", () => {
    expect(isUiRootAvailable("current")).toBe(true);
    expect(isUiRootAvailable("forest-green")).toBe(false);
  });
});
