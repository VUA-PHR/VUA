import { describe, expect, it } from "vitest";
import { isAllowedLocalSender, localWindowWebPreferences } from "./security.js";

describe("Electron local window security", () => {
  it("keeps Node and Electron out of the renderer", () => {
    expect(localWindowWebPreferences("C:/vua/preload.js")).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    });
  });

  it("rejects remote callers", () => {
    expect(isAllowedLocalSender("https://booth.pm/", "http://127.0.0.1:5173")).toBe(false);
    expect(isAllowedLocalSender("http://127.0.0.1:5173/", "http://127.0.0.1:5173")).toBe(true);
  });
});
