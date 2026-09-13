/**
 * 共享信号最小实现(订阅快照广播;无数据、无演示载荷):
 * - 共享容器层(production-chain-store、compose-draft-store 等 019 批 B/C/D
 *   随生产构建发布的 store)与 DEV fixture 面(fixture-gateway、
 *   fixture-acquire、fixture-production)共用同一实现——基础设施与夹具
 *   数据是两回事:本文件只承载 set/subscribe 机制,不承载任何条目、
 *   快照或演示数据(诚实纪律 4 的泄漏门扫描载荷指纹,对无载荷基础设施
 *   不适用);实现自 fixture-signal.ts 原样提取(D-5 回归走查发现:生产
 *   容器层经 gateway/index.ts 使用 "fixture-" 命名文件,命名与事实漂移)。
 */
export function createSignal<T>(initial: T) {
  let current = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    get: () => current,
    set: (next: T) => {
      current = next;
      for (const callback of listeners) callback(current);
    },
    subscribe: (callback: (value: T) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}
