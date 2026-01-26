export interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const createStorage = (provider: StorageProvider) => ({
  get<T>(key: string, initialState: T | (() => T)): T {
    const json = provider.getItem(key);
    const ret =
      json === null || json === "undefined"
        ? typeof initialState === "function"
          ? (initialState as () => T)()
          : initialState
        : (JSON.parse(json) as T);
    return ret;
  },
  set<T>(key: string, value: T): void {
    provider.setItem(key, JSON.stringify(value));
  },
});

export default createStorage;
