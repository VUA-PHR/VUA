/**
 * Overlay 端口实例:Overlay 表面唯一的端口装配点。
 *
 * live 实现(经 Desktop Gateway)接入前恒为 inactive 占位。DEV 构建额外装配
 * 演示端口(本目录 demo/overlay-demo-port.ts),加载守卫与 main.tsx 的
 * PreviewLabPage 同模式:import.meta.env.DEV 折叠 + 动态 import——生产构建中
 * 该分支是死代码,demo chunk 不产出,check-leak 以 fixture 文案指纹把守。
 *
 * 端口是同步取值语义(表面渲染前同步拿到端口对象,与 create.ts 的装配惯例
 * 一致):先返回 inactive 实例;demo 模块就绪后切换内层端口,并向全部订阅者
 * 重发最新快照——从 inactive 空态过渡到演示快照经既有订阅路径生效,无第二套
 * 通知机制。
 */
import {
  createInactiveOverlayPort,
  type OverlaySurfacePort,
  type Unsubscribe,
} from "./overlay-port.ts";
import type { OverlaySnapshot } from "./overlay-contract.ts";

let inner: OverlaySurfacePort = createInactiveOverlayPort();
let innerUnsubscribe: Unsubscribe | null = null;
const listeners = new Set<(snapshot: OverlaySnapshot) => void>();

const fanOut = (snapshot: OverlaySnapshot) => {
  for (const listener of listeners) listener(snapshot);
};

/** 内层订阅随订阅者有无而建立/断开(无订阅者时 demo 端口的推送不空转) */
function bindInner() {
  innerUnsubscribe?.();
  innerUnsubscribe = listeners.size > 0 ? inner.subscribe(fanOut) : null;
}

function activateInner(next: OverlaySurfacePort) {
  inner = next;
  bindInner();
  void inner.snapshot().then(fanOut);
}

export const overlayPort: OverlaySurfacePort = {
  snapshot: () => inner.snapshot(),
  subscribe: (callback) => {
    listeners.add(callback);
    if (innerUnsubscribe === null) bindInner();
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        innerUnsubscribe?.();
        innerUnsubscribe = null;
      }
    };
  },
  dispatch: (action) => inner.dispatch(action),
};

if (import.meta.env.DEV) {
  void import("./demo/overlay-demo-port.ts").then((module) => {
    activateInner(module.createDemoOverlayPort());
  });
}
