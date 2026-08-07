import { readCollection, writeCollection } from "@/lib/todo-notes/storage";

export interface CollectionSnapshot<T> {
  items: T[];
  /** `false` before `localStorage` has been read (server render / hydration). */
  hydrated: boolean;
}

export interface CollectionStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => CollectionSnapshot<T>;
  getServerSnapshot: () => CollectionSnapshot<T>;
  mutate: (updater: (items: T[]) => T[]) => void;
}

function sameItems<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * A `localStorage`-backed collection exposed as an external store, so React can
 * read it with `useSyncExternalStore` instead of copying it into state. The
 * server snapshot is always empty, which keeps server markup and the first
 * client render identical; React re-reads the real value right after hydration.
 */
export function createCollectionStore<T>(
  key: string,
  parse: (value: unknown) => T | null
): CollectionStore<T> {
  const serverSnapshot: CollectionSnapshot<T> = { items: [], hydrated: false };
  let snapshot: CollectionSnapshot<T> = serverSnapshot;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function load() {
    snapshot = { items: readCollection(key, parse), hydrated: true };
  }

  function handleStorage(event: StorageEvent) {
    // `key === null` happens on `localStorage.clear()`.
    if (event.key !== null && event.key !== key) return;
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    load();
    emit();
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        window.addEventListener("storage", handleStorage);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", handleStorage);
        }
      };
    },

    getSnapshot() {
      if (typeof window === "undefined") return serverSnapshot;
      // Lazy first read; afterwards the snapshot only changes through
      // `mutate` or a cross-tab storage event, so this stays referentially
      // stable between renders.
      if (!snapshot.hydrated) load();
      return snapshot;
    },

    getServerSnapshot() {
      return serverSnapshot;
    },

    mutate(updater: (items: T[]) => T[]) {
      if (typeof window === "undefined") return;
      if (!snapshot.hydrated) load();
      const next = updater(snapshot.items);
      if (sameItems(next, snapshot.items)) return;
      snapshot = { items: next, hydrated: true };
      writeCollection(key, next);
      emit();
    },
  };
}
