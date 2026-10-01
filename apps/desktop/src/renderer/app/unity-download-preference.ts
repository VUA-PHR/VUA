/** Desktop preference only. The typed deployment intent carries this choice to the
 * backend; source selection and download execution remain backend responsibilities. */
import { useSyncExternalStore } from "react";
import { storageKeys } from "./storage-keys.ts";

const CHANGED_EVENT = "vua-unity-mirrors-changed";
let sessionOverride: boolean | undefined;

export function readUnityMirrors(): boolean {
  if (sessionOverride !== undefined) return sessionOverride;
  try {
    return localStorage.getItem(storageKeys.unityMirrors) !== "off";
  } catch {
    return true;
  }
}

export function saveUnityMirrors(enabled: boolean): void {
  try {
    localStorage.setItem(storageKeys.unityMirrors, enabled ? "on" : "off");
    sessionOverride = undefined;
  } catch {
    // A blocked storage write still changes plans in this session.
    sessionOverride = enabled;
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useUnityMirrors(): boolean {
  return useSyncExternalStore(subscribe, readUnityMirrors, () => true);
}
