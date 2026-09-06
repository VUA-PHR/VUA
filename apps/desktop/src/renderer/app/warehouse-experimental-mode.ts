/**
 * 产物模式实验开关(proposal 007 路径 b,核心已表态):设置-实验性页的用户偏好,
 * localStorage 为事实来源,自定义事件做同窗口跨页同步,storage 事件兜底多窗口。
 *
 * 语义边界(与核心表态一致):
 * - 只控制条目抽屉中「产物模式编辑 / 条目动作」入口的显隐,是纯表现层偏好,
 *   生产构建合法存在(非 DEV 门控物);入口开启处挂实验性标注;
 * - 命令面仍为已冻结的 bdl-commands v0.1 条目级三命令,全局默认由 provider
 *   运行时配置注入、不进 wire——本开关不读写任何服务端状态。
 */
import { useEffect, useState } from "react";
import { storageKeys } from "./storage-keys.ts";

const CHANGED_EVENT = "vua-warehouse-experimental-mode-changed";

export function loadWarehouseExperimentalMode(): boolean {
  try {
    return localStorage.getItem(storageKeys.warehouseExperimentalMode) === "1";
  } catch {
    return false;
  }
}

export function saveWarehouseExperimentalMode(on: boolean): void {
  try {
    localStorage.setItem(storageKeys.warehouseExperimentalMode, on ? "1" : "0");
  } catch {
    /* 存储不可用时仅本次会话生效 */
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function useWarehouseExperimentalMode(): boolean {
  const [on, setOn] = useState(loadWarehouseExperimentalMode);
  useEffect(() => {
    const sync = () => setOn(loadWarehouseExperimentalMode());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return on;
}
