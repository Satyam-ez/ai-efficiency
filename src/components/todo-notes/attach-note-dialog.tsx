"use client";

import { useMemo, useState } from "react";
import { Link2Icon, NotebookPenIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/todo-notes/empty-state";
import {
  useWorkspaceData,
  useWorkspaceUi,
} from "@/components/todo-notes/workspace-provider";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/todo-notes/date";
import { EMPTY_NOTE_DRAFT, type NoteDraft } from "@/lib/todo-notes/types";

type AttachTab = "existing" | "new";

export function AttachNoteDialog() {
  const { notes, getTodo, createNote, attachNote } = useWorkspaceData();
  const { attachDialog, closeAttachDialog } = useWorkspaceUi();
  const { open, target } = attachDialog;

  const [tab, setTab] = useState<AttachTab>("existing");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_NOTE_DRAFT);

  const sessionKey = `${open ? "open" : "closed"}:${target ?? "none"}`;
  const [session, setSession] = useState(sessionKey);
  if (session !== sessionKey) {
    const todo = getTodo(target);
    setSession(sessionKey);
    setTab(notes.length === 0 ? "new" : "existing");
    setQuery("");
    setSelectedId(todo?.noteId ?? null);
    setDraft(EMPTY_NOTE_DRAFT);
  }

  const todo = getTodo(target);
  const taskTitle = todo ? todo.title.trim() || "Untitled task" : "";

  const visibleNotes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(needle) ||
        note.description.toLowerCase().includes(needle)
    );
  }, [notes, query]);

  function handleAttachExisting() {
    if (!target || !selectedId) return;
    attachNote(target, selectedId);
    closeAttachDialog();
    toast.success("Note attached", { description: `Linked to “${taskTitle}”.` });
  }

  function handleCreateAndAttach() {
    if (!target) return;
    if (!draft.title.trim() && !draft.description.trim()) {
      toast.error("Nothing to save", {
        description: "Add a title or a description first.",
      });
      return;
    }
    const note = createNote(draft);
    attachNote(target, note.id);
    closeAttachDialog();
    toast.success("Note created and attached", {
      description: `Linked to “${taskTitle}”.`,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeAttachDialog();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach a note</DialogTitle>
          <DialogDescription>
            {taskTitle
              ? `Link a note to “${taskTitle}”. The task stores only the note's id.`
              : "Link a note to this task."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as AttachTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="existing">Select existing</TabsTrigger>
            <TabsTrigger value="new">Create new</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="flex flex-col gap-3 pt-1">
            {notes.length === 0 ? (
              <EmptyState
                icon={NotebookPenIcon}
                title="No notes to pick from"
                description="Create one on the “Create new” tab and it will be attached right away."
              />
            ) : (
              <>
                <div className="relative">
                  <Label htmlFor="attach-search" className="sr-only">
                    Search notes
                  </Label>
                  <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="attach-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search notes…"
                    className="pl-8"
                  />
                </div>

                <ScrollArea className="max-h-64">
                  {visibleNotes.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                      No notes match “{query.trim()}”.
                    </p>
                  ) : (
                    <fieldset className="flex flex-col gap-2 pr-2">
                      <legend className="sr-only">Choose a note to attach</legend>
                      {visibleNotes.map((note) => (
                        <label
                          key={note.id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 has-checked:ring-2 has-checked:ring-primary"
                        >
                          <input
                            type="radio"
                            name="attach-note"
                            value={note.id}
                            checked={selectedId === note.id}
                            onChange={() => setSelectedId(note.id)}
                            className="mt-1 size-3.5 shrink-0 accent-primary"
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <span className="line-clamp-1 text-sm font-medium">
                                {note.title.trim() || "Untitled note"}
                              </span>
                              {todo?.noteId === note.id ? (
                                <Badge variant="secondary">Current</Badge>
                              ) : null}
                            </span>
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {note.description.trim() || "No description yet."}
                            </span>
                            <span className="text-[11px] text-muted-foreground/80">
                              Updated {formatDateTime(note.updatedAt)}
                            </span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attach-note-title">Title</Label>
              <Input
                id="attach-note-title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, title: event.target.value }))
                }
                placeholder="Note title"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="attach-note-description">Description</Label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {draft.description.length} characters
                </span>
              </div>
              <Textarea
                id="attach-note-description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="What should this task remember?"
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeAttachDialog}>
            Cancel
          </Button>
          {tab === "existing" ? (
            <Button
              size="sm"
              onClick={handleAttachExisting}
              disabled={!selectedId || notes.length === 0}
            >
              <Link2Icon aria-hidden="true" />
              Attach note
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreateAndAttach}>
              <Link2Icon aria-hidden="true" />
              Create &amp; attach
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
