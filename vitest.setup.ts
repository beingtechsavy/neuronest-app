// jsdom 29 no longer exposes `window.localStorage`, and Node 22+ ships its own
// `localStorage` global that is undefined unless the process runs with
// --localstorage-file. Both resolve to `undefined` in tests, so any component
// that persists locally silently no-ops. Install a minimal in-memory Storage.
if (!globalThis.localStorage) {
  const store = new Map<string, string>();
  const storage = {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => store.get(String(key)) ?? null,
    setItem: (key: string, value: string) => {
      store.set(String(key), String(value));
    },
    removeItem: (key: string) => {
      store.delete(String(key));
    },
    clear: () => {
      store.clear();
    },
  } satisfies Storage;

  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  }
}
