"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { Link2Icon, SaveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
import {
  useWorkspaceData,
  useWorkspaceUi,
} from "@/components/todo-notes/workspace-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatTime, nowIso } from "@/lib/todo-notes/date";
import { EMPTY_NOTE_DRAFT, type NoteDraft } from "@/lib/todo-notes/types";

const AUTOSAVE_DELAY_MS = 800;

export function NoteEditorDialog() {
  const { getNote, createNote, updateNote, deleteNote, linkedTaskCount } =
    useWorkspaceData();
  const { noteEditor, closeNoteEditor } = useWorkspaceUi();
  const { open, target } = noteEditor;

  const [draft, setDraft] = useState<NoteDraft>(EMPTY_NOTE_DRAFT);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset the form whenever the dialog opens or switches note, without an
  // effect that would fight the autosave writes.
  const sessionKey = `${open ? "open" : "closed"}:${target ?? "new"}`;
  const [session, setSession] = useState(sessionKey);
  if (session !== sessionKey) {
    const existing = getNote(target);
    setSession(sessionKey);
    setDraft(
      existing
        ? { title: existing.title, description: existing.description }
        : EMPTY_NOTE_DRAFT
    );
    setCurrentId(existing?.id ?? null);
    setDirty(false);
    setSavedAt(null);
  }

  const note = getNote(currentId);
  const linkedTasks = note ? linkedTaskCount(note.id) : 0;
  const hasContent =
    draft.title.trim().length > 0 || draft.description.trim().length > 0;

  const persist = useCallback(
    (options?: { silent?: boolean }): boolean => {
      const silent = options?.silent ?? false;
      if (!draft.title.trim() && !draft.description.trim()) {
        if (!silent) {
          toast.error("Nothing to save", {
            description: "Add a title or a description first.",
          });
        }
        return false;
      }
      if (currentId) {
        updateNote(currentId, draft);
      } else {
        setCurrentId(createNote(draft).id);
      }
      setDirty(false);
      setSavedAt(nowIso());
      return true;
    },
    [createNote, currentId, draft, updateNote]
  );

  // Autosave while typing.
  useEffect(() => {
    if (!open || !dirty) return;
    const timer = window.setTimeout(() => persist({ silent: true }), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, open, persist]);

  function update(patch: Partial<NoteDraft>) {
    setDraft((previous) => ({ ...previous, ...patch }));
    setDirty(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    if (dirty) persist({ silent: true });
    closeNoteEditor();
  }

  function handleSaveAndClose() {
    const wasNew = currentId === null;
    if (!persist()) return;
    toast.success(wasNew ? "Note created" : "Note saved");
    closeNoteEditor();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (persist()) toast.success("Note saved");
    }
  }

  function handleDelete() {
    if (!currentId) return;
    deleteNote(currentId);
    setConfirmOpen(false);
    closeNoteEditor();
    toast.success("Note deleted");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{currentId ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>
            Changes save automatically. Press{" "}
            <kbd className="rounded border bg-muted px-1 font-sans text-xs">
              Ctrl
            </kbd>
            {" + "}
            <kbd className="rounded border bg-muted px-1 font-sans text-xs">S</kbd>{" "}
            to save now.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Meeting notes, ideas, anything…"
              autoFocus
              className="h-10 text-base font-medium md:text-base lg:text-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="note-description">Description</Label>
              <span
                className="text-xs text-muted-foreground tabular-nums sm:text-sm"
                aria-live="polite"
              >
                {draft.description.length} characters
              </span>
            </div>
            <Textarea
              id="note-description"
              value={draft.description}
              onChange={(event) => update({ description: event.target.value })}
              placeholder="Write the details here…"
              rows={8}
              className="max-h-[40dvh] text-base leading-relaxed md:text-base"
            />
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:text-sm">
            {note ? (
              <>
                <span>Created {formatDateTime(note.createdAt)}</span>
                <span>Updated {formatDateTime(note.updatedAt)}</span>
              </>
            ) : (
              <span>Not saved yet.</span>
            )}
            {linkedTasks > 0 ? (
              <span className="flex items-center gap-1">
                <Link2Icon className="size-3" aria-hidden="true" />
                Attached to {linkedTasks} {linkedTasks === 1 ? "task" : "tasks"}
              </span>
            ) : null}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={!currentId}
            >
              <Trash2Icon aria-hidden="true" />
              Delete
            </Button>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {dirty ? "Unsaved changes…" : savedAt ? `Saved ${formatTime(savedAt)}` : ""}
            </span>
          </div>
          <Button size="sm" onClick={handleSaveAndClose} disabled={!hasContent}>
            <SaveIcon aria-hidden="true" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description={
          linkedTasks > 0
            ? `This note is attached to ${linkedTasks} ${
                linkedTasks === 1 ? "task" : "tasks"
              }. Deleting it unlinks those tasks. This cannot be undone.`
            : "The note will be permanently removed. This cannot be undone."
        }
        onConfirm={handleDelete}
      />
    </Dialog>
  );
}
