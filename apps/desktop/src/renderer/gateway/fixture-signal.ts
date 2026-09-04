/**
 * fixture 共享信号(仅 DEV 可达):端口快照 + 订阅的最小实现。
 * fixture-gateway 与 fixture-production 共用,避免环形引用。
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
