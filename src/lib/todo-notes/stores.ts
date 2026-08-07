import { createCollectionStore } from "@/lib/todo-notes/collection-store";
import { parseNote, parseTodo, STORAGE_KEYS } from "@/lib/todo-notes/storage";
import type { Note, Todo } from "@/lib/todo-notes/types";

/**
 * One store per `localStorage` key, shared by every component in the tab.
 * Both stay empty and read-only on the server.
 */
export const noteStore = createCollectionStore<Note>(STORAGE_KEYS.notes, parseNote);
export const todoStore = createCollectionStore<Todo>(STORAGE_KEYS.todos, parseTodo);
