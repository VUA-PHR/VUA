import { describe, expect, it } from "vitest";
import { moduleForPage, modules } from "./navigation.js";

describe("legacy presentation navigation", () => {
  it("keeps every page reachable from one module", () => {
    const pages = modules.flatMap((module) => module.pages.map((page) => page.id));
    expect(new Set(pages).size).toBe(pages.length);
    expect(moduleForPage("recipe").id).toBe("production");
  });
});
