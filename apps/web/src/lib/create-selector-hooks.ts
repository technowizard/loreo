import type { StoreApi, UseBoundStore } from 'zustand';

type WithHookSelectors<S> = S extends { getState: () => infer T }
  ? S & { [K in keyof T as `use${Capitalize<string & K>}`]: () => T[K] }
  : never;

export const createSelectorHooks = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithHookSelectors<typeof _store>;

  for (const k of Object.keys(store.getState())) {
    const hookName = `use${k.charAt(0).toUpperCase()}${k.slice(1)}`;

    (store as any)[hookName] = () => store((s) => s[k as keyof typeof s]);
  }
  return store;
};
