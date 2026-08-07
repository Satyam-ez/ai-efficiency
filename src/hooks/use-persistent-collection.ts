"use client";

import { useSyncExternalStore } from "react";

import type { CollectionStore } from "@/lib/todo-notes/collection-store";

interface UsePersistentCollection<T> {
  items: T[];
  /** `false` until `localStorage` has been read on the client. */
  hydrated: boolean;
  mutate: (updater: (items: T[]) => T[]) => void;
}

/** Subscribes to a `localStorage`-backed collection store. */
export function usePersistentCollection<T>(
  store: CollectionStore<T>
): UsePersistentCollection<T> {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return { items: snapshot.items, hydrated: snapshot.hydrated, mutate: store.mutate };
}
