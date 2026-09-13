import { describe, expect, it } from "vitest";
import { createSignal } from "./signal.ts";

/**
 * 共享信号根基语义(019 批 D D-5,AC-02「监听数量不累积」的共享层根基):
 * 共享容器层 store(production-chain-store、compose-draft-store)的跨 UI
 * 订阅都建立在本实现上;UI 根切换时组件卸载即退订(useEffect 清理),
 * 这里的用例锚定退订/重复订阅不叠加监听的机制语义。
 */
describe("createSignal (shared-container signal, AC-02 basis)", () => {
  it("unsubscribe removes the listener: later sets are not observed", () => {
    const signal = createSignal<{ n: number }>({ n: 0 });
    const seen: number[] = [];
    const unsubscribe = signal.subscribe((value) => seen.push(value.n));
    signal.set({ n: 1 });
    unsubscribe();
    signal.set({ n: 2 });
    expect(seen).toEqual([1]);
    expect(signal.get()).toEqual({ n: 2 });
  });

  it("re-subscribing with the same callback does not accumulate listeners", () => {
    const signal = createSignal<number>(0);
    let calls = 0;
    const callback = () => {
      calls += 1;
    };
    signal.subscribe(callback);
    signal.subscribe(callback);
    signal.set(7);
    expect(calls).toBe(1);
  });

  it("double unsubscribe is safe (idempotent cleanup)", () => {
    const signal = createSignal<number>(0);
    const seen: number[] = [];
    const unsubscribe = signal.subscribe((value) => seen.push(value));
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
    signal.set(3);
    expect(seen).toEqual([]);
  });

  it("every active listener is notified exactly once per set", () => {
    const signal = createSignal<string>("a");
    const first: string[] = [];
    const second: string[] = [];
    signal.subscribe((value) => first.push(value));
    signal.subscribe((value) => second.push(value));
    signal.set("b");
    expect(first).toEqual(["b"]);
    expect(second).toEqual(["b"]);
  });
});
