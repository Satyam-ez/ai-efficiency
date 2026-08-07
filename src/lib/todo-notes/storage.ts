import { nowIso } from "@/lib/todo-notes/date";
import {
  PRIORITIES,
  TODO_STATUSES,
  type Note,
  type Priority,
  type Todo,
  type TodoStatus,
} from "@/lib/todo-notes/types";

export const STORAGE_KEYS = {
  notes: "notes",
  todos: "todos",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readPriority(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : "medium";
}

function readStatus(value: unknown, completed: boolean): TodoStatus {
  if (TODO_STATUSES.includes(value as TodoStatus)) return value as TodoStatus;
  return completed ? "done" : "todo";
}

/**
 * Tolerant parsers: anything without a usable `id` is dropped, everything else
 * is normalised so a hand-edited or older `localStorage` payload cannot crash
 * the app.
 */
export function parseNote(value: unknown): Note | null {
  if (!isRecord(value)) return null;
  const id = readNullableString(value.id);
  if (!id) return null;
  const createdAt = readString(value.createdAt) || nowIso();
  return {
    id,
    title: readString(value.title),
    description: readString(value.description),
    createdAt,
    updatedAt: readString(value.updatedAt) || createdAt,
  };
}

export function parseTodo(value: unknown): Todo | null {
  if (!isRecord(value)) return null;
  const id = readNullableString(value.id);
  if (!id) return null;
  const completed = value.completed === true;
  const createdAt = readString(value.createdAt) || nowIso();
  return {
    id,
    title: readString(value.title),
    completed,
    dueDate: readNullableString(value.dueDate),
    priority: readPriority(value.priority),
    status: readStatus(value.status, completed),
    noteId: readNullableString(value.noteId),
    createdAt,
    updatedAt: readString(value.updatedAt) || createdAt,
  };
}

export function readCollection<T>(
  key: string,
  parse: (value: unknown) => T | null
): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => parse(item))
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}

export function writeCollection<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Quota exceeded or storage disabled — keep the in-memory state usable.
  }
}
