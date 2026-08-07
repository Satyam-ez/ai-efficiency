"use client";

import { useCallback, useMemo } from "react";

import { usePersistentCollection } from "@/hooks/use-persistent-collection";
import { createId, nowIso } from "@/lib/todo-notes/date";
import { todoStore } from "@/lib/todo-notes/stores";
import { PRIORITIES, type Todo, type TodoDraft } from "@/lib/todo-notes/types";

export type TodoPatch = Partial<TodoDraft & Pick<Todo, "completed" | "noteId">>;

export interface TodosStore {
  todos: Todo[];
  hydrated: boolean;
  getTodo: (id: string | null | undefined) => Todo | undefined;
  createTodo: (draft: TodoDraft) => Todo;
  updateTodo: (id: string, patch: TodoPatch) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  /** Used when a note is deleted, so no task keeps a dangling reference. */
  detachNoteEverywhere: (noteId: string) => void;
}

const PRIORITY_WEIGHT: Record<Todo["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Open tasks first, then soonest due date, then priority, then last edited. */
function bySmartOrder(a: Todo, b: Todo): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  }
  if (a.priority !== b.priority) {
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

function isSameTodo(a: Todo, b: Todo): boolean {
  return (
    a.title === b.title &&
    a.completed === b.completed &&
    a.dueDate === b.dueDate &&
    a.priority === b.priority &&
    a.status === b.status &&
    a.noteId === b.noteId
  );
}

/** Keeps the checkbox and the status field from contradicting each other. */
function reconcile(previous: Todo, next: Todo, patch: TodoPatch): Todo {
  if (patch.status !== undefined && patch.completed === undefined) {
    return { ...next, completed: patch.status === "done" };
  }
  if (patch.completed !== undefined && patch.status === undefined) {
    if (patch.completed) return { ...next, status: "done" };
    return { ...next, status: previous.status === "done" ? "todo" : previous.status };
  }
  return next;
}

export function useTodos(): TodosStore {
  const { items, mutate, hydrated } = usePersistentCollection(todoStore);

  const todos = useMemo(() => [...items].sort(bySmartOrder), [items]);

  const getTodo = useCallback(
    (id: string | null | undefined) =>
      id ? items.find((todo) => todo.id === id) : undefined,
    [items]
  );

  const createTodo = useCallback(
    (draft: TodoDraft) => {
      const timestamp = nowIso();
      const todo: Todo = {
        id: createId("task"),
        title: draft.title,
        completed: draft.status === "done",
        dueDate: draft.dueDate,
        priority: PRIORITIES.includes(draft.priority) ? draft.priority : "medium",
        status: draft.status,
        noteId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      mutate((previous) => [todo, ...previous]);
      return todo;
    },
    [mutate]
  );

  const updateTodo = useCallback(
    (id: string, patch: TodoPatch) => {
      mutate((previous) =>
        previous.map((todo) => {
          if (todo.id !== id) return todo;
          const next = reconcile(todo, { ...todo, ...patch }, patch);
          if (isSameTodo(todo, next)) return todo;
          return { ...next, updatedAt: nowIso() };
        })
      );
    },
    [mutate]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      mutate((previous) =>
        previous.map((todo) => {
          if (todo.id !== id) return todo;
          const completed = !todo.completed;
          return {
            ...todo,
            completed,
            status: completed ? "done" : todo.status === "done" ? "todo" : todo.status,
            updatedAt: nowIso(),
          };
        })
      );
    },
    [mutate]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      mutate((previous) => previous.filter((todo) => todo.id !== id));
    },
    [mutate]
  );

  const detachNoteEverywhere = useCallback(
    (noteId: string) => {
      mutate((previous) =>
        previous.map((todo) =>
          todo.noteId === noteId
            ? { ...todo, noteId: null, updatedAt: nowIso() }
            : todo
        )
      );
    },
    [mutate]
  );

  return {
    todos,
    hydrated,
    getTodo,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    detachNoteEverywhere,
  };
}
