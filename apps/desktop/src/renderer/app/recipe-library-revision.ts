import { useSyncExternalStore } from "react";

// A receipt invalidates read models even if its composing dialog has unmounted.
// This is an invalidation counter, never a substitute for Gateway recipe data.
let revision = 0;
const listeners = new Set<() => void>();
export function recipePersisted(): void {
  revision += 1;
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function useRecipeLibraryRevision(): number {
  return useSyncExternalStore(subscribe, () => revision);
}
