import type { VuaDesktopApiV1 } from "@vua/contracts";

declare global {
  interface Window {
    readonly vua?: VuaDesktopApiV1;
  }
}

export {};
