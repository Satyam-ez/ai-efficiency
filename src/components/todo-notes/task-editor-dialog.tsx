"use client";

import { useState, type KeyboardEvent } from "react";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, toDateInputValue } from "@/lib/todo-notes/date";
import {
  DEFAULT_TODO_DRAFT,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TODO_STATUSES,
  type Priority,
  type TodoDraft,
  type TodoStatus,
} from "@/lib/todo-notes/types";

export function TaskEditorDialog() {
  const { getTodo, createTodo, updateTodo } = useWorkspaceData();
  const { taskEditor, closeTaskEditor } = useWorkspaceUi();
  const { open, target } = taskEditor;

  const [draft, setDraft] = useState<TodoDraft>(DEFAULT_TODO_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const sessionKey = `${open ? "open" : "closed"}:${target ?? "new"}`;
  const [session, setSession] = useState(sessionKey);
  if (session !== sessionKey) {
    const existing = getTodo(target);
    setSession(sessionKey);
    setDraft(
      existing
        ? {
            title: existing.title,
            dueDate: existing.dueDate,
            priority: existing.priority,
            status: existing.status,
          }
        : DEFAULT_TODO_DRAFT
    );
    setError(null);
  }

  const todo = getTodo(target);
  const isEditing = Boolean(todo);

  function update(patch: Partial<TodoDraft>) {
    setDraft((previous) => ({ ...previous, ...patch }));
    setError(null);
  }

  function handleSave() {
    if (!draft.title.trim()) {
      setError("A task needs a name.");
      return;
    }
    if (todo) {
      updateTodo(todo.id, draft);
      toast.success("Task updated");
    } else {
      createTodo(draft);
      toast.success("Task added");
    }
    closeTaskEditor();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeTaskEditor();
      }}
    >
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>
            Due date is optional. Marking the status as done also ticks the checkbox.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Task name</Label>
            <Input
              id="task-title"
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="e.g. Finish the dashboard UI"
              aria-invalid={error !== null}
              aria-describedby={error ? "task-title-error" : undefined}
              autoFocus
            />
            {error ? (
              <p id="task-title-error" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <div className="flex items-center gap-2">
              <Input
                id="task-due"
                type="date"
                value={toDateInputValue(draft.dueDate)}
                onChange={(event) => update({ dueDate: event.target.value || null })}
              />
              {draft.dueDate ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => update({ dueDate: null })}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={draft.priority}
                onValueChange={(value) => update({ priority: value as Priority })}
              >
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value) => update({ status: value as TodoStatus })}
              >
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {todo ? (
            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              <span>Created {formatDateTime(todo.createdAt)}</span>
              <span>Updated {formatDateTime(todo.updatedAt)}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeTaskEditor}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <SaveIcon aria-hidden="true" />
            {isEditing ? "Save changes" : "Add task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
