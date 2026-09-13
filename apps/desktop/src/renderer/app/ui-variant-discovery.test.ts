import { describe, expect, it } from "vitest";
import {
  resolveForestVariant,
  type ForestUiRootProps,
} from "./ui-variant-discovery.ts";

/* 019 批 D D-2(UI-05/AC-12):变体动态发现纯函数——构建期 glob 表注入,
 * 三态语义:absent(无入口=不可用)、未就绪(有杂文件无 root.tsx 仍 absent,
 * 不挑选替身入口)、present(load 透传不吞错)。干净检出的空表即 absent。 */

describe("forest variant discovery (D-2 dynamic discovery)", () => {
  it("reports absent for an empty glob table (clean checkout)", () => {
    const discovery = resolveForestVariant({});
    expect(discovery).toEqual({ status: "absent" });
  });

  it("reports present and passes the loader through when the entry exists", async () => {
    const component = () => ({});
    let called = 0;
    const raw = () => {
      called += 1;
      return Promise.resolve({ ForestUiRoot: component as never });
    };
    const discovery = resolveForestVariant({ "../../ui-variants/forest/root.tsx": raw });
    expect(discovery.status).toBe("present");
    if (discovery.status !== "present") return;
    expect(called).toBe(0);
    const mod = await discovery.load();
    expect(called).toBe(1);
    expect(mod.ForestUiRoot).toBe(component);
  });

  it("treats a half-written variant directory as absent (no stand-in entry)", () => {
    const discovery = resolveForestVariant({
      "../../ui-variants/forest/styles.css": () => Promise.resolve({}),
      "../../ui-variants/forest/notes.ts": () => Promise.resolve({}),
    });
    expect(discovery).toEqual({ status: "absent" });
  });

  it("propagates load failures instead of masking them (honest failure)", async () => {
    const discovery = resolveForestVariant({
      "../../ui-variants/forest/root.tsx": () => Promise.reject(new Error("chunk gone")),
    });
    expect(discovery.status).toBe("present");
    if (discovery.status !== "present") return;
    await expect(discovery.load()).rejects.toThrow("chunk gone");
  });

  it("keeps the loader lazy: absent never holds a callable", () => {
    const absent = resolveForestVariant({});
    expect(absent.status).toBe("absent");
    expect("load" in absent).toBe(false);
  });
});

/* ForestUiRootProps 契约形状:接线层与 gitignored 骨架之间的入库边界,
 * 骨架实现必须兼容(骨架本体不入库,由本机 typecheck 覆盖)。 */
describe("forest ui root contract", () => {
  it("requires exactly the migration-fallback callback", () => {
    const props: ForestUiRootProps = { onBackToCurrent: () => {} };
    expect(typeof props.onBackToCurrent).toBe("function");
  });
});
