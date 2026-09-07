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
import { storageKeys } from "./storage-keys.ts";

const CHANGED_EVENT = "vua-delete-originals-after-generate-changed";

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
