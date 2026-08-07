"use client";

import { useMemo, useState } from "react";
import { NotebookPenIcon, PlusIcon, SearchIcon, SearchXIcon, XIcon } from "lucide-react";

import { EmptyState } from "@/components/todo-notes/empty-state";
import { ListSkeleton } from "@/components/todo-notes/list-skeleton";
import { NoteCard } from "@/components/todo-notes/note-card";
import { Panel } from "@/components/todo-notes/panel";
import {
  useWorkspaceData,
  useWorkspaceUi,
} from "@/components/todo-notes/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NotesPanel() {
  const { notes, hydrated } = useWorkspaceData();
  const { openNoteEditor } = useWorkspaceUi();
  const [query, setQuery] = useState("");

  const visibleNotes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(needle) ||
        note.description.toLowerCase().includes(needle)
    );
  }, [notes, query]);

  return (
    <Panel
      title="Notes"
      count={hydrated ? notes.length : undefined}
      actions={
        <Button size="sm" onClick={() => openNoteEditor(null)}>
          <PlusIcon aria-hidden="true" />
          New Note
        </Button>
      }
      toolbar={
        <div className="relative">
          <Label htmlFor="note-search" className="sr-only">
            Search notes
          </Label>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="note-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes…"
            className="h-9 pr-8 pl-8 text-sm md:text-sm lg:text-base"
          />
          {query ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-1 -translate-y-1/2"
            >
              <XIcon aria-hidden="true" />
              <span className="sr-only">Clear note search</span>
            </Button>
          ) : null}
        </div>
      }
    >
      {!hydrated ? (
        <ListSkeleton rows={3} />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookPenIcon}
          title="No notes yet"
          description="Capture an idea, a meeting summary, or the details behind a task."
          action={
            <Button size="sm" variant="outline" onClick={() => openNoteEditor(null)}>
              <PlusIcon aria-hidden="true" />
              Create your first note
            </Button>
          }
        />
      ) : visibleNotes.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title="No matching notes"
          description={`Nothing matches “${query.trim()}”. Try a different search.`}
        />
      ) : (
        visibleNotes.map((note) => <NoteCard key={note.id} note={note} />)
      )}
    </Panel>
  );
}
