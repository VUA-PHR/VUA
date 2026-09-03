/**
 * 调试模式(G8 用户反馈 #1):设置·版本页开关;开启后仓库详情抽屉展示
 * 商品完整领域 JSON(含实体 UUID),供排查"是数据问题还是解析问题"。
 *
 * localStorage 为事实来源,自定义事件做同窗口跨页同步(设置页拨动开关,
 * 已打开的仓库详情立即反映);storage 事件兜底多窗口场景。
 * 仅影响展示,不改变任何数据流——调试视图渲染的是解析后的领域对象
 * (与页面同源),不引入 wire 透出通道。
 */
import { useEffect, useState } from "react";
import { storageKeys } from "./storage-keys.ts";

const CHANGED_EVENT = "vua-debug-mode-changed";

export function loadDebugMode(): boolean {
  try {
    return localStorage.getItem(storageKeys.debugMode) === "1";
  } catch {
    return false;
  }
}

export function saveDebugMode(on: boolean): void {
  try {
    localStorage.setItem(storageKeys.debugMode, on ? "1" : "0");
  } catch {
    /* 存储不可用时仅本次会话生效 */
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function useDebugMode(): boolean {
  const [on, setOn] = useState(loadDebugMode);
  useEffect(() => {
    const sync = () => setOn(loadDebugMode());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return on;
}
