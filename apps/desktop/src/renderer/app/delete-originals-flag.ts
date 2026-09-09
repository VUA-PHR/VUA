/**
 * 「生成后删除原始素材文件」偏好(W15 重做,示意图 A 第二行):
 * localStorage 为事实来源,自定义事件做同窗口跨页同步。
 *
 * 语义边界(诚实纪律,proposal 008 未决):
 * - 全局自动删除超出已冻结的条目级 deleteOriginals 命令——本偏好当前是
 *   未接线的呈现层意图记录,开启不触发任何服务端行为,UI 恒挂未接线标注;
 * - 开启动作必须经危险确认对话框(示意图 B),本模块不做守卫。
 */
import { useEffect, useState } from "react";
import type { WarehouseArtifactMode } from "../gateway/index.ts";
import { storageKeys } from "./storage-keys.ts";

const CHANGED_EVENT = "vua-delete-originals-after-generate-changed";

/**
 * 裁决 11(2026-09-09 用户裁定,走查 A4 行 2 自动取消):「生成 VPM 包替代」
 * 全局开关写回非 generate_vpm(即主开关关闭)时,「生成后删除原始素材文件」
 * 偏好自动复位为关(清持久偏好——再开主开关时行 2 为关,不恢复旧值)。
 * 两假设(用户确认):复位只清偏好,不溯及已受理的删除任务(服务端独立审计,
 * 已发生的删除不可逆也不回滚);偏好只影响桌面发起时机(008 路径 a)。
 */
export function shouldResetDeleteFlag(globalDefaultMode: WarehouseArtifactMode): boolean {
  return globalDefaultMode !== "generate_vpm";
}

export function loadDeleteOriginalsAfterGenerate(): boolean {
  try {
    return localStorage.getItem(storageKeys.deleteOriginalsAfterGenerate) === "on";
  } catch {
    return false;
  }
}

export function saveDeleteOriginalsAfterGenerate(on: boolean): void {
  try {
    localStorage.setItem(storageKeys.deleteOriginalsAfterGenerate, on ? "on" : "off");
  } catch {
    /* 存储不可用时仅本次会话生效 */
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function useDeleteOriginalsAfterGenerate(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(loadDeleteOriginalsAfterGenerate);
  useEffect(() => {
    const sync = () => setOn(loadDeleteOriginalsAfterGenerate());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const set = (next: boolean) => {
    saveDeleteOriginalsAfterGenerate(next);
  };
  return [on, set];
}
