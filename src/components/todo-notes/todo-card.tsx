"use client";

import { useState } from "react";
import {
  Link2OffIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  StickyNoteIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
import {
  DueDateBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/todo-notes/task-meta";
import {
  useWorkspaceData,
  useWorkspaceUi,
} from "@/components/todo-notes/workspace-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/todo-notes/date";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TODO_STATUSES,
  type Priority,
  type Todo,
  type TodoStatus,
} from "@/lib/todo-notes/types";
import { cn } from "@/lib/utils";

export function TodoCard({ todo }: { todo: Todo }) {
  const { getNote, toggleTodo, updateTodo, deleteTodo, detachNote } =
    useWorkspaceData();
  const { openNoteEditor, openTaskEditor, openAttachDialog } = useWorkspaceUi();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const note = getNote(todo.noteId);
  const title = todo.title.trim() || "Untitled task";
  const noteTitle = note ? note.title.trim() || "Untitled note" : null;
  const edited = todo.updatedAt !== todo.createdAt;

  function handleDelete() {
    deleteTodo(todo.id);
    setConfirmOpen(false);
    toast.success("Task deleted");
  }

  return (
    <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-2.5">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => toggleTodo(todo.id)}
          className="mt-0.5"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label
            htmlFor={`todo-${todo.id}`}
            className={cn(
              "cursor-pointer text-sm leading-snug font-medium break-words",
              todo.completed && "text-muted-foreground line-through"
            )}
          >
            {title}
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={todo.priority} />
            <StatusBadge status={todo.status} />
            {todo.dueDate ? (
              <DueDateBadge dueDate={todo.dueDate} completed={todo.completed} />
            ) : null}
          </div>

          {note ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => openNoteEditor(note.id)}
                  className="flex w-fit max-w-full items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <StickyNoteIcon className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{noteTitle}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Open attached note</TooltipContent>
            </Tooltip>
          ) : null}

          <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground/80">
            <span>Created {formatDateTime(todo.createdAt)}</span>
            {edited ? <span>Updated {formatDateTime(todo.updatedAt)}</span> : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!note ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => openAttachDialog(todo.id)}
                >
                  <PlusIcon aria-hidden="true" />
                  <span className="sr-only">Attach a note to {title}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach a note</TooltipContent>
            </Tooltip>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <MoreVerticalIcon aria-hidden="true" />
                <span className="sr-only">Actions for {title}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => openTaskEditor(todo.id)}>
                <PencilIcon aria-hidden="true" />
                Edit task
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openAttachDialog(todo.id)}>
                <StickyNoteIcon aria-hidden="true" />
                {note ? "Change attached note" : "Attach a note"}
              </DropdownMenuItem>
              {note ? (
                <DropdownMenuItem
                  onSelect={() => {
                    detachNote(todo.id);
                    toast.success("Note detached", {
                      description: "The note itself was kept.",
                    });
                  }}
                >
                  <Link2OffIcon aria-hidden="true" />
                  Detach note
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground">
                Priority
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={todo.priority}
                onValueChange={(value) =>
                  updateTodo(todo.id, { priority: value as Priority })
                }
              >
                {PRIORITIES.map((priority) => (
                  <DropdownMenuRadioItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground">
                Status
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={todo.status}
                onValueChange={(value) =>
                  updateTodo(todo.id, { status: value as TodoStatus })
                }
              >
                {TODO_STATUSES.map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmOpen(true)}
              >
                <Trash2Icon aria-hidden="true" />
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this task?"
        description={`“${title}” will be permanently removed.${
          note ? " The attached note stays in your notebook." : ""
        } This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
