import { describe, expect, it } from "vitest";
import {
  anyFixturePort,
  parseDevPortSelection,
} from "./dev-port-selection.ts";

/* 开发模式 per-port 选择(018,裁决 13):解析/校验纯函数——生产构建与
 * 词表外输入一律保守回落 {},不猜测。 */

describe("dev port selection", () => {
  it("parses a stored JSON object, keeping only in-vocabulary ports and targets", () => {
    expect(
      parseDevPortSelection(
        JSON.stringify({ acquire: "fixture", task: "live", packages: "fixture" }),
      ),
    ).toEqual({ acquire: "fixture", task: "live", packages: "fixture" });
  });

  it("falls back to empty for malformed or out-of-vocabulary input", () => {
    expect(parseDevPortSelection(null)).toEqual({});
    expect(parseDevPortSelection("")).toEqual({});
    expect(parseDevPortSelection("not json")).toEqual({});
    expect(parseDevPortSelection("[]")).toEqual({});
    expect(parseDevPortSelection("42")).toEqual({});
    // 词表外端口与词表外目标忽略
    expect(parseDevPortSelection(JSON.stringify({ unknownPort: "fixture" }))).toEqual({});
    expect(parseDevPortSelection(JSON.stringify({ acquire: "mock" }))).toEqual({});
    // 部分合法:合法键保留
    expect(parseDevPortSelection(JSON.stringify({ acquire: "fixture", evil: 1 }))).toEqual({
      acquire: "fixture",
    });
  });

  it("aggregate semantics: any fixture port means demo data (principle 1)", () => {
    expect(anyFixturePort({ acquire: "live", task: "live" })).toBe(false);
    expect(anyFixturePort({ acquire: "live", task: "fixture" })).toBe(true);
    expect(anyFixturePort({})).toBe(false);
  });
});
