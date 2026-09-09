import { describe, expect, it } from "vitest";
import {
  anyFixturePort,
  parseDevPortSelection,
} from "./dev-port-selection.ts";

/* 开发模式 per-port 选择(018,裁决 13):解析/校验纯函数——生产构建与
 * 词表外输入一律保守回落全 live(targets 空集),不猜测;fixture 档位
 * 词表外回落 demo-mixed。 */

describe("dev port selection", () => {
  it("parses a stored JSON object into targets plus fixture tier", () => {
    expect(
      parseDevPortSelection(
        JSON.stringify({ acquire: "fixture", task: "live", packages: "fixture" }),
      ),
    ).toEqual({
      targets: { acquire: "fixture", task: "live", packages: "fixture" },
      fixtureTier: "demo-mixed",
    });
    expect(
      parseDevPortSelection(
        JSON.stringify({ acquire: "fixture", fixtureTier: "production-running" }),
      ),
    ).toEqual({
      targets: { acquire: "fixture" },
      fixtureTier: "production-running",
    });
  });

  it("falls back to all-live defaults for malformed or out-of-vocabulary input", () => {
    const fallback = { targets: {}, fixtureTier: "demo-mixed" };
    expect(parseDevPortSelection(null)).toEqual(fallback);
    expect(parseDevPortSelection("")).toEqual(fallback);
    expect(parseDevPortSelection("not json")).toEqual(fallback);
    expect(parseDevPortSelection("[]")).toEqual(fallback);
    expect(parseDevPortSelection("42")).toEqual(fallback);
    // 词表外端口与词表外目标忽略;部分合法:合法键保留
    expect(parseDevPortSelection(JSON.stringify({ unknownPort: "fixture" }))).toEqual(fallback);
    expect(parseDevPortSelection(JSON.stringify({ acquire: "mock" }))).toEqual(fallback);
    expect(
      parseDevPortSelection(JSON.stringify({ acquire: "fixture", evil: 1 })),
    ).toEqual({ targets: { acquire: "fixture" }, fixtureTier: "demo-mixed" });
    // 词表外档位回落 demo-mixed
    expect(
      parseDevPortSelection(JSON.stringify({ acquire: "fixture", fixtureTier: "nope" })),
    ).toEqual({ targets: { acquire: "fixture" }, fixtureTier: "demo-mixed" });
  });

  it("aggregate semantics: any fixture port means demo data (principle 1)", () => {
    expect(anyFixturePort({ acquire: "live", task: "live" })).toBe(false);
    expect(anyFixturePort({ acquire: "live", task: "fixture" })).toBe(true);
    expect(anyFixturePort({})).toBe(false);
  });
});
