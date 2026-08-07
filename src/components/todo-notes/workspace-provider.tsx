"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useNotes } from "@/hooks/use-notes";
import { useTodos, type TodoPatch } from "@/hooks/use-todos";
import type { Note, NoteDraft, Todo, TodoDraft } from "@/lib/todo-notes/types";

interface WorkspaceData {
  notes: Note[];
  todos: Todo[];
  hydrated: boolean;
  getNote: (id: string | null | undefined) => Note | undefined;
  getTodo: (id: string | null | undefined) => Todo | undefined;
  /** Number of tasks referencing a note id. */
  linkedTaskCount: (noteId: string) => number;
  createNote: (draft: NoteDraft) => Note;
  updateNote: (id: string, patch: Partial<NoteDraft>) => void;
  deleteNote: (id: string) => void;
  createTodo: (draft: TodoDraft) => Todo;
  updateTodo: (id: string, patch: TodoPatch) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  attachNote: (todoId: string, noteId: string) => void;
  detachNote: (todoId: string) => void;
}

interface DialogState<TTarget> {
  open: boolean;
  target: TTarget;
}

interface WorkspaceUi {
  /** `target` is the note id being edited, or `null` for a new note. */
  noteEditor: DialogState<string | null>;
  openNoteEditor: (noteId?: string | null) => void;
  closeNoteEditor: () => void;
  /** `target` is the task id being edited, or `null` for a new task. */
  taskEditor: DialogState<string | null>;
  openTaskEditor: (todoId?: string | null) => void;
  closeTaskEditor: () => void;
  /** `target` is the task a note is being attached to. */
  attachDialog: DialogState<string | null>;
  openAttachDialog: (todoId: string) => void;
  closeAttachDialog: () => void;
}

const WorkspaceDataContext = createContext<WorkspaceData | null>(null);
const WorkspaceUiContext = createContext<WorkspaceUi | null>(null);

const CLOSED: DialogState<string | null> = { open: false, target: null };

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const {
    notes,
    hydrated: notesHydrated,
    getNote,
    createNote,
    updateNote,
    deleteNote: removeNote,
  } = useNotes();
  const {
    todos,
    hydrated: todosHydrated,
    getTodo,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    detachNoteEverywhere,
  } = useTodos();

  const usageByNoteId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const todo of todos) {
      if (!todo.noteId) continue;
      counts.set(todo.noteId, (counts.get(todo.noteId) ?? 0) + 1);
    }
    return counts;
  }, [todos]);

  const linkedTaskCount = useCallback(
    (noteId: string) => usageByNoteId.get(noteId) ?? 0,
    [usageByNoteId]
  );

  const deleteNote = useCallback(
    (id: string) => {
      removeNote(id);
      detachNoteEverywhere(id);
    },
    [detachNoteEverywhere, removeNote]
  );

  const attachNote = useCallback(
    (todoId: string, noteId: string) => updateTodo(todoId, { noteId }),
    [updateTodo]
  );

  const detachNote = useCallback(
    (todoId: string) => updateTodo(todoId, { noteId: null }),
    [updateTodo]
  );

  const data = useMemo<WorkspaceData>(
    () => ({
      notes,
      todos,
      hydrated: notesHydrated && todosHydrated,
      getNote,
      getTodo,
      linkedTaskCount,
      createNote,
      updateNote,
      deleteNote,
      createTodo,
      updateTodo,
      toggleTodo,
      deleteTodo,
      attachNote,
      detachNote,
    }),
    [
      attachNote,
      createNote,
      createTodo,
      deleteNote,
      deleteTodo,
      detachNote,
      getNote,
      getTodo,
      linkedTaskCount,
      notes,
      notesHydrated,
      todos,
      todosHydrated,
      toggleTodo,
      updateNote,
      updateTodo,
    ]
  );

  const [noteEditor, setNoteEditor] = useState<DialogState<string | null>>(CLOSED);
  const [taskEditor, setTaskEditor] = useState<DialogState<string | null>>(CLOSED);
  const [attachDialog, setAttachDialog] = useState<DialogState<string | null>>(CLOSED);

  const ui = useMemo<WorkspaceUi>(
    () => ({
      noteEditor,
      openNoteEditor: (noteId = null) => setNoteEditor({ open: true, target: noteId }),
      // Only `open` flips on close, so the dialog keeps its content while it
      // animates out.
      closeNoteEditor: () => setNoteEditor((state) => ({ ...state, open: false })),
      taskEditor,
      openTaskEditor: (todoId = null) => setTaskEditor({ open: true, target: todoId }),
      closeTaskEditor: () => setTaskEditor((state) => ({ ...state, open: false })),
      attachDialog,
      openAttachDialog: (todoId: string) =>
        setAttachDialog({ open: true, target: todoId }),
      closeAttachDialog: () =>
        setAttachDialog((state) => ({ ...state, open: false })),
    }),
    [attachDialog, noteEditor, taskEditor]
  );

  return (
    <WorkspaceDataContext.Provider value={data}>
      <WorkspaceUiContext.Provider value={ui}>{children}</WorkspaceUiContext.Provider>
    </WorkspaceDataContext.Provider>
  );
}

export function useWorkspaceData(): WorkspaceData {
  const context = useContext(WorkspaceDataContext);
  if (!context) {
    throw new Error("useWorkspaceData must be used inside a WorkspaceProvider");
  }
  return context;
}

export function useWorkspaceUi(): WorkspaceUi {
  const context = useContext(WorkspaceUiContext);
  if (!context) {
    throw new Error("useWorkspaceUi must be used inside a WorkspaceProvider");
  }
  return context;
}
