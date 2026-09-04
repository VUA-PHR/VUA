/**
 * useSceneMode:把 DOM/系统状态(特效开关、HC、forced-colors、reduced-motion、
 * WebGL 支持)聚合成响应式 SceneMode。判定逻辑本身是纯函数,见 scene-mode.ts。
 */
import { useSyncExternalStore } from "react";
import { decideSceneMode, type SceneMode } from "./scene-mode.ts";

const QUERY_FORCED_COLORS = "(forced-colors: active)";
const QUERY_REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

let cachedWebGLSupport: boolean | null = null;

/** WebGL 支持探测:创建临时上下文,结果缓存(进程内不变) */
export function detectWebGLSupport(): boolean {
  if (cachedWebGLSupport !== null) return cachedWebGLSupport;
  try {
    const canvas = document.createElement("canvas");
    cachedWebGLSupport = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    cachedWebGLSupport = false;
  }
  return cachedWebGLSupport;
}

function subscribe(onChange: () => void): () => void {
  const root = document.documentElement;
  const observer = new MutationObserver(onChange);
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["data-effects", "data-hc"],
  });
  const mediaLists = [QUERY_FORCED_COLORS, QUERY_REDUCED_MOTION].map((query) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return mql;
  });
  return () => {
    observer.disconnect();
    for (const mql of mediaLists) mql.removeEventListener("change", onChange);
  };
}

function snapshot(): SceneMode {
  return decideSceneMode({
    effectsEnabled: document.documentElement.dataset.effects !== "off",
    highContrast: document.documentElement.dataset.hc === "on",
    forcedColors: window.matchMedia(QUERY_FORCED_COLORS).matches,
    reducedMotion: window.matchMedia(QUERY_REDUCED_MOTION).matches,
    webglSupported: detectWebGLSupport(),
  });
}

export function useSceneMode(): SceneMode {
  return useSyncExternalStore(subscribe, snapshot);
}
