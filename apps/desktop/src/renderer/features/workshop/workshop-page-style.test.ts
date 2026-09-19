import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/* D4(用户实测 2026-09-20)样式断言:车间页根 .vua-workshop 不是 .vua-page,
 * 父链 .vua-shell__main overflow:hidden——缺滚动三件套时内容超出视口即被
 * 截断、不可滚动(#32 .vua-deployer 同类缺陷)。本钉把修法锁进样式表:
 * 与 .vua-page 同构的 flex:1 ＋ min-height:0 ＋ overflow-y:auto,防回归。 */

const css = readFileSync(new URL("./workshop.css", import.meta.url), "utf8");

function rootRule(selector: string): string {
  const match = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  return match?.[1] ?? "";
}

describe("WorkshopPage 页面级滚动(D4;#32 .vua-deployer 先例)", () => {
  it(".vua-workshop 携带滚动三件套 flex:1 ＋ min-height:0 ＋ overflow-y:auto", () => {
    const rule = rootRule("\\.vua-workshop");
    expect(rule).not.toBe("");
    expect(rule).toMatch(/flex:\s*1\s*;/);
    expect(rule).toMatch(/min-height:\s*0\s*;/);
    expect(rule).toMatch(/overflow-y:\s*auto\s*;/);
  });

  it(".vua-page 同构对照(壳层基准三件套在位;先例一致性参照)", () => {
    const shell = readFileSync(
      new URL("../../app-shell.css", import.meta.url),
      "utf8",
    );
    const rule = shell.match(/\.vua-page\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toMatch(/flex:\s*1\s*;/);
    expect(rule).toMatch(/min-height:\s*0\s*;/);
    expect(rule).toMatch(/overflow-y:\s*auto\s*;/);
  });
});
