import { describe, expect, it, vi } from "vitest";
import {
  installRemoteContentNavigationPolicy,
  installRemoteContentSessionPolicy,
  isAllowedLocalSender,
  isAllowedRemoteOrigin,
  localWindowWebPreferences,
} from "./security.js";

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

describe("remote content origin allowlist (F4-2)", () => {
  const allowed = ["https://booth.pm"];

  it("admits the allowlisted host and its subdomains over https", () => {
    expect(isAllowedRemoteOrigin("https://booth.pm/items/1", allowed)).toBe(true);
    expect(isAllowedRemoteOrigin("https://shop.booth.pm/", allowed)).toBe(true);
  });

  it("rejects unrelated hosts, plain-http impersonation, and non-web schemes", () => {
    expect(isAllowedRemoteOrigin("https://booth.pm.evil.test/", allowed)).toBe(false);
    expect(isAllowedRemoteOrigin("https://notbooth.pm/", allowed)).toBe(false);
    expect(isAllowedRemoteOrigin("http://booth.pm/", allowed)).toBe(false);
    expect(isAllowedRemoteOrigin("file:///C:/Windows/system32/config.SAM", allowed)).toBe(false);
    expect(isAllowedRemoteOrigin("javascript:alert(1)", allowed)).toBe(false);
    expect(isAllowedRemoteOrigin("not a url", allowed)).toBe(false);
  });

  it("rejects an empty allowlist", () => {
    expect(isAllowedRemoteOrigin("https://booth.pm/", [])).toBe(false);
  });
});

describe("remote content navigation policy (F4-2)", () => {
  function fakeWebContents() {
    let openHandler: ((details: { url: string }) => { action: "deny" | "allow" }) | null = null;
    let navigateHandler: ((event: { preventDefault: () => void }, url: string) => void) | null = null;
    return {
      webContents: {
        setWindowOpenHandler: vi.fn((handler) => {
          openHandler = handler;
        }),
        on: vi.fn((eventName: string, handler: never) => {
          if (eventName === "will-navigate") navigateHandler = handler;
        }),
      },
      open: (url: string) => openHandler!({ url }),
      navigate: (url: string) => {
        const preventDefault = vi.fn();
        navigateHandler!({ preventDefault }, url);
        return preventDefault.mock.calls.length > 0;
      },
    };
  }

  it("denies popups, hands http(s) targets to the system browser, and reports the violation", () => {
    const harness = fakeWebContents();
    const openExternal = vi.fn();
    const onViolation = vi.fn();
    installRemoteContentNavigationPolicy(harness.webContents as never, {
      allowedOrigins: ["https://booth.pm"],
      openExternal,
      onViolation,
    });

    const result = harness.open("https://example.test/checkout");
    expect(result).toEqual({ action: "deny" });
    expect(openExternal).toHaveBeenCalledWith("https://example.test/checkout");
    expect(onViolation).toHaveBeenCalledWith("https://example.test/checkout", "popup_denied");
  });

  it("blocks off-allowlist navigation and lets allowlisted navigation proceed", () => {
    const harness = fakeWebContents();
    const onViolation = vi.fn();
    installRemoteContentNavigationPolicy(harness.webContents as never, {
      allowedOrigins: ["https://booth.pm"],
      openExternal: vi.fn(),
      onViolation,
    });

    // 子域按点后缀语义放行(booth.pm 的合法主机形态);无关域被阻止并上报
    expect(harness.navigate("https://shop.booth.pm/items/2")).toBe(false);
    expect(harness.navigate("https://example.test/items/2")).toBe(true);
    expect(onViolation).toHaveBeenCalledTimes(1);
    expect(onViolation).toHaveBeenCalledWith("https://example.test/items/2", "origin_not_allowed");
    expect(harness.navigate("https://booth.pm/items/3")).toBe(false);
    expect(onViolation).toHaveBeenCalledTimes(1);
  });
});

describe("remote content session policy (F4-2)", () => {
  it("denies every permission request and cancels downloads, reporting both", () => {
    let permissionHandler: ((webContents: unknown, permission: string, callback: (allow: boolean) => void, details: { requestingUrl: string }) => void) | null = null;
    let downloadHandler: ((event: { preventDefault: () => void }, item: { getURL: () => string }) => void) | null = null;
    const fakeSession = {
      setPermissionRequestHandler: vi.fn((handler) => {
        permissionHandler = handler;
      }),
      on: vi.fn((eventName: string, handler: never) => {
        if (eventName === "will-download") downloadHandler = handler;
      }),
    };

    const onViolation = vi.fn();
    installRemoteContentSessionPolicy(fakeSession as never, { onViolation });

    const allow = vi.fn();
    permissionHandler!({}, "media", allow, { requestingUrl: "https://booth.pm/items/1" });
    expect(allow).toHaveBeenCalledWith(false);
    expect(onViolation).toHaveBeenCalledWith("https://booth.pm/items/1", "permission_denied");

    const preventDefault = vi.fn();
    downloadHandler!({ preventDefault }, { getURL: () => "https://booth.pm/file.zip" });
    expect(preventDefault).toHaveBeenCalled();
    expect(onViolation).toHaveBeenCalledWith("https://booth.pm/file.zip", "download_denied");
  });
});
