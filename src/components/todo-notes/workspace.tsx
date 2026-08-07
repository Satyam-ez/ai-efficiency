"use client";

import { NotebookPenIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { AttachNoteDialog } from "@/components/todo-notes/attach-note-dialog";
import { NoteEditorDialog } from "@/components/todo-notes/note-editor-dialog";
import { NotesPanel } from "@/components/todo-notes/notes-panel";
import { TaskEditorDialog } from "@/components/todo-notes/task-editor-dialog";
import { TodosPanel } from "@/components/todo-notes/todos-panel";
import { WorkspaceProvider } from "@/components/todo-notes/workspace-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Workspace() {
  return (
    <WorkspaceProvider>
      <TooltipProvider delayDuration={250}>
        <div className="mx-auto flex w-full  flex-col gap-4 p-8 lg:h-dvh lg:overflow-hidden lg:p-12">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg  bg-primary text-primary-foreground">
                <NotebookPenIcon className="size-8" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-heading text-xl leading-tight font-semibold tracking-tight">
                  Notes &amp; Tasks
                </h1>
                <p className="text-md text-muted-foreground">
                  Notes live on their own and can be linked to any task.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </header>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
            <NotesPanel />
            <TodosPanel />
          </div>
        </div>

        <NoteEditorDialog />
        <TaskEditorDialog />
        <AttachNoteDialog />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </WorkspaceProvider>
  );
}
