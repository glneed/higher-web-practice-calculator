export function createStore<T extends object>(initialState: T) {
  let current = initialState;
  const subscribers = new Set<(state: T) => void>();
 
  const notify = (): void => {
    subscribers.forEach(callback => callback(current));
  };

  const getState = (): T => current;

  const setState = (patch: Partial<T> | ((state: T) => T), replace = false): void => {
    const next = typeof patch === 'function' ? patch(current) : patch;
    current = replace ? (next as T) : { ...current, ...(next as Partial<T>) };
    notify();
  };

  const subscribe = (listener: (state: T) => void): (() => void) => {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  };

  return { getState, setState, subscribe };
}