import { describe, expect, it } from "vitest";
import {
  anyFixturePort,
  DEFAULT_FIXTURE_TIER,
  devPortStorageOp,
  devTargetButtonDisabled,
  parseDevPortSelection,
} from "./dev-port-selection.ts";

/* 开发模式 per-port 选择(018,裁决 13):解析/校验纯函数——生产构建与
 * 词表外输入一律保守回落全 live(targets 空集),不猜测;fixture 档位
 * 词表外回落 demo-mixed。
 * W25 走查 D-B 回归钉(2026-09-20):切换单向生效——档位-only 变更必须
 * 落盘(此前空 targets 整键移除,重载恒回 demo-mixed);切换按钮只在
 * 目标态已达成时禁用(此前 live 基线下两按钮双双禁用,切换被锁死)。 */

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

  it("D-B regression: tier-only change persists (storage op keeps the key)", () => {
    // 空 targets + 非默认档位 = 写(此前整键移除,档位变更重载即失)
    const op = devPortStorageOp({ targets: {}, fixtureTier: "demo-all-green" });
    expect(op.kind).toBe("set");
    if (op.kind !== "set") return;
    // 回读(切换单向生效):重载后解析回落所选档位,而非默认 demo-mixed
    expect(parseDevPortSelection(op.value)).toEqual({
      targets: {},
      fixtureTier: "demo-all-green",
    });
  });

  it("storage op: empty selection at the default tier still removes the key (all-live)", () => {
    expect(devPortStorageOp({ targets: {}, fixtureTier: DEFAULT_FIXTURE_TIER })).toEqual({
      kind: "remove",
    });
  });

  it("storage op: targets and tier serialize together; unknown targets dropped", () => {
    const op = devPortStorageOp({
      targets: { acquire: "fixture", task: "live" },
      fixtureTier: "production-running",
    });
    expect(op.kind).toBe("set");
    if (op.kind !== "set") return;
    expect(parseDevPortSelection(op.value)).toEqual({
      targets: { acquire: "fixture", task: "live" },
      fixtureTier: "production-running",
    });
  });

  it("D-B regression: toggle buttons disabled only when the target is already reached", () => {
    // live 基线(默认态):「切到演示 fixture」必须可点(此前双双禁用即锁死)
    expect(devTargetButtonDisabled("live", "fixture")).toBe(false);
    expect(devTargetButtonDisabled("live", "live")).toBe(true);
    // 已是 fixture:「切到演示」禁用,「复位为真实连接」可点
    expect(devTargetButtonDisabled("fixture", "fixture")).toBe(true);
    expect(devTargetButtonDisabled("fixture", "live")).toBe(false);
  });
});
