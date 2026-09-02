import { describe, expect, it } from "vitest";
import { resolveLocale } from "./i18n.js";

describe("locale selection", () => {
  it("uses Chinese for Chinese Windows locales and English otherwise", () => {
    expect(resolveLocale(["zh-HK", "en-US"])).toBe("zh-CN");
    expect(resolveLocale(["ja-JP"])).toBe("en");
  });
});
