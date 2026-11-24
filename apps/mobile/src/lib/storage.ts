import KvStore from 'expo-sqlite/kv-store';

/**
 * Small synchronous key-value store for on-device state (theme choice, offline queue).
 * Backed by expo-sqlite's kv-store, which works in Expo Go and in builds.
 * Tests use `createMemoryStore` instead.
 */
export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const deviceStore: KeyValueStore = {
  getItem: (key) => KvStore.getItemSync(key),
  setItem: (key, value) => KvStore.setItemSync(key, value),
  removeItem: (key) => {
    KvStore.removeItemSync(key);
  },
};

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
