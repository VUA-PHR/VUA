import type { WebPreferences } from "electron";

export function localWindowWebPreferences(preload: string): WebPreferences {
  return {
    preload,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
  };
}

export function isAllowedLocalSender(url: string, rendererUrl?: string): boolean {
  if (rendererUrl) return url === rendererUrl || url.startsWith(`${rendererUrl}/`);
  try {
    const parsed = new URL(url);
    return parsed.protocol === "file:" && parsed.pathname.replaceAll("\\", "/").endsWith("/dist/renderer/index.html");
  } catch {
    return false;
  }
}
