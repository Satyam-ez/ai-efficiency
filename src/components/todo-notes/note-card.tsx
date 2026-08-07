"use client";

import { useState } from "react";
import { Link2Icon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
import {
  useWorkspaceData,
  useWorkspaceUi,
} from "@/components/todo-notes/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/todo-notes/date";
import type { Note } from "@/lib/todo-notes/types";

export function NoteCard({ note }: { note: Note }) {
  const { linkedTaskCount, deleteNote } = useWorkspaceData();
  const { openNoteEditor } = useWorkspaceUi();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const linkedTasks = linkedTaskCount(note.id);
  const title = note.title.trim() || "Untitled note";
  const edited = note.updatedAt !== note.createdAt;

  function handleDelete() {
    deleteNote(note.id);
    setConfirmOpen(false);
    toast.success("Note deleted", {
      description:
        linkedTasks > 0
          ? `Detached from ${linkedTasks} ${linkedTasks === 1 ? "task" : "tasks"}.`
          : undefined,
    });
  }

  return (
    <div className="group relative rounded-xl bg-card ring-1 ring-foreground/10 transition-colors hover:bg-muted/40">
      <button
        type="button"
        onClick={() => openNoteEditor(note.id)}
        className="flex w-full flex-col items-start gap-1.5 rounded-xl p-3 pr-20 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-3.5 sm:pr-20"
      >
        <span className="line-clamp-1 text-base font-semibold sm:text-lg">{title}</span>
        <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {note.description.trim() || "No description yet."}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground/80 sm:text-sm">
          <span>Created {formatDateTime(note.createdAt)}</span>
          {edited ? <span>Updated {formatDateTime(note.updatedAt)}</span> : null}
        </span>
      </button>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        {linkedTasks > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 tabular-nums">
                <Link2Icon aria-hidden="true" />
                {linkedTasks}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Linked to {linkedTasks} {linkedTasks === 1 ? "task" : "tasks"}
            </TooltipContent>
          </Tooltip>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
            >
              <MoreVerticalIcon aria-hidden="true" />
              <span className="sr-only">Actions for {title}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openNoteEditor(note.id)}>
              <PencilIcon aria-hidden="true" />
              Open note
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash2Icon aria-hidden="true" />
              Delete note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description={
          linkedTasks > 0
            ? `“${title}” is attached to ${linkedTasks} ${
                linkedTasks === 1 ? "task" : "tasks"
              }. Deleting it removes the note and unlinks those tasks. This cannot be undone.`
            : `“${title}” will be permanently removed. This cannot be undone.`
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
