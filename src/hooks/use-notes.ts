"use client";

import { useCallback, useMemo } from "react";

import { usePersistentCollection } from "@/hooks/use-persistent-collection";
import { createId, nowIso } from "@/lib/todo-notes/date";
import { noteStore } from "@/lib/todo-notes/stores";
import type { Note, NoteDraft } from "@/lib/todo-notes/types";

export interface NotesStore {
  /** Most recently updated first. */
  notes: Note[];
  hydrated: boolean;
  getNote: (id: string | null | undefined) => Note | undefined;
  createNote: (draft: NoteDraft) => Note;
  updateNote: (id: string, patch: Partial<NoteDraft>) => void;
  deleteNote: (id: string) => void;
}

function byUpdatedDesc(a: Note, b: Note): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function useNotes(): NotesStore {
  const { items, mutate, hydrated } = usePersistentCollection(noteStore);

  const notes = useMemo(() => [...items].sort(byUpdatedDesc), [items]);

  const getNote = useCallback(
    (id: string | null | undefined) =>
      id ? items.find((note) => note.id === id) : undefined,
    [items]
  );

  const createNote = useCallback(
    (draft: NoteDraft) => {
      const timestamp = nowIso();
      const note: Note = {
        id: createId("note"),
        title: draft.title,
        description: draft.description,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      mutate((previous) => [note, ...previous]);
      return note;
    },
    [mutate]
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<NoteDraft>) => {
      mutate((previous) =>
        previous.map((note) => {
          if (note.id !== id) return note;
          const next = { ...note, ...patch };
          // A no-op edit must not move `updatedAt`.
          if (next.title === note.title && next.description === note.description) {
            return note;
          }
          return { ...next, updatedAt: nowIso() };
        })
      );
    },
    [mutate]
  );

  const deleteNote = useCallback(
    (id: string) => {
      mutate((previous) => previous.filter((note) => note.id !== id));
    },
    [mutate]
  );

  return { notes, hydrated, getNote, createNote, updateNote, deleteNote };
}
