import type { StoredGoalsV1 } from "../app/onboarding-model.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * 设置领域窄端口(M0 SettingsPort):目标选择等设置的查询与意图。
 * G3 为薄封装:持久化(localStorage)仍由 App 壳负责,接入 Rust 应用层后
 * 迁移为真实用例,接口不变。
 */
export interface SettingsView {
  schemaVersion: 1;
  goals: StoredGoalsV1 | null;
}

export interface SettingsPort {
  snapshot(): Promise<SettingsView>;
  subscribe(callback: (view: SettingsView) => void): Unsubscribe;
  /** 目标重选意图:更新端口内状态并广播;持久化由调用方(App 壳)负责 */
  setGoals(goals: StoredGoalsV1): Promise<SettingsView>;
  capability(): Promise<CapabilityReport>;
}

/** 进程内 settings 实现:empty / fixture 两个 Gateway 共用。 */
export function createMemorySettingsPort(initialGoals: StoredGoalsV1 | null = null): SettingsPort {
  let view: SettingsView = { schemaVersion: 1, goals: initialGoals };
  const listeners = new Set<(next: SettingsView) => void>();
  return {
    snapshot: () => Promise.resolve(view),
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    setGoals: (goals) => {
      view = { schemaVersion: 1, goals };
      for (const callback of listeners) callback(view);
      return Promise.resolve(view);
    },
    capability: () => Promise.resolve({ state: "ready" }),
  };
}
