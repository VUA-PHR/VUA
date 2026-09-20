import { describe, expect, it } from "vitest";
import { dialogCopy, dialogStrings } from "./dialog-i18n.js";
import { localeRegistry } from "../renderer/i18n/locales.ts";

describe("native dialog language boundary", () => {
  it("covers all shipped languages and every native picker", () => {
    expect(Object.keys(dialogCopy).sort()).toEqual(localeRegistry.filter((entry) => entry.available).map((entry) => entry.id).sort());
    for (const locale of Object.keys(dialogCopy) as (keyof typeof dialogCopy)[]) {
      const copy = dialogStrings(locale);
      expect(copy).toBe(dialogCopy[locale]);
      expect(Object.keys(copy).sort()).toEqual(Object.keys(dialogCopy.en).sort());
      for (const value of Object.values(copy)) expect(value.trim().length).toBeGreaterThan(0);
    }
    expect(dialogStrings("ja").warehouse).not.toBe(dialogStrings("en").warehouse);
  });
  it("treats untrusted IPC locale input only as an allowlisted identifier", () => {
    for (const input of [undefined, null, {}, { title: "override" }, "constructor", "__proto__", "toString", "unknown", "ja-JP", 1]) {
      expect(dialogStrings(input)).toBe(dialogCopy.en);
    }
  });
});
