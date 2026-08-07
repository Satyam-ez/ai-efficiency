export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TODO_STATUSES = ["todo", "in-progress", "done"] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export interface Note {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: Priority;
  status: TodoStatus;
  /** Reference only — note content is never duplicated inside a task. */
  noteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Editable fields of a note. */
export type NoteDraft = Pick<Note, "title" | "description">;

/** Editable fields of a task, excluding its note reference. */
export type TodoDraft = Pick<Todo, "title" | "dueDate" | "priority" | "status">;

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_LABELS: Record<TodoStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export const EMPTY_NOTE_DRAFT: NoteDraft = { title: "", description: "" };

export const DEFAULT_TODO_DRAFT: TodoDraft = {
  title: "",
  dueDate: null,
  priority: "medium",
  status: "todo",
};
