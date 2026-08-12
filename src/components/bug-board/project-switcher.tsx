"use client";

import { useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderPlusIcon,
  LayersIcon,
  SaveIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * The board scope. A tester picks the project they are testing, and every count,
 * filter, export and share below the switcher belongs to that project alone.
 */
export function ProjectSwitcher() {
  const {
    activeProject,
    activeProjectId,
    bugs,
    openProjectDialog,
    projectStats,
    setActiveProject,
  } = useBugBoard();

  const activeStat = projectStats.find(
    (stat) => stat.project.id === activeProjectId
  );
  const openCount = activeStat
    ? activeStat.open
    : projectStats.reduce((total, stat) => total + stat.open, 0);
  const total = activeStat ? activeStat.total : bugs.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto py-1.5"
          title={`${total} bug${total === 1 ? "" : "s"} in this scope`}
        >
          {activeProject ? (
            <FolderIcon data-icon="inline-start" aria-hidden="true" />
          ) : (
            <LayersIcon data-icon="inline-start" aria-hidden="true" />
          )}
          <span className="flex flex-col items-start gap-0.5">
            <span className="text-[0.625rem] leading-none tracking-wide text-muted-foreground uppercase">
              Project
            </span>
            <span className="max-w-52 truncate leading-none font-medium">
              {activeProject?.name ?? "All projects"}
            </span>
          </span>
          <Badge variant="secondary" className="tabular-nums">
            {openCount} open
          </Badge>
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 min-w-80">
        <DropdownMenuLabel>Switch project</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setActiveProject(null)}>
          <LayersIcon aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">All projects</span>
            <span className="truncate text-xs text-muted-foreground">
              Everything on the board, {bugs.length} bugs
            </span>
          </span>
          {activeProjectId === null ? (
            <CheckIcon className="shrink-0" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {projectStats.map((stat) => (
          <DropdownMenuItem
            key={stat.project.id}
            onSelect={() => setActiveProject(stat.project.id)}
          >
            <FolderIcon aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{stat.project.name}</span>
              <span className="truncate text-xs text-muted-foreground tabular-nums">
                {stat.open} open of {stat.total}
                {stat.unassigned > 0 ? ` · ${stat.unassigned} unassigned` : ""}
              </span>
            </span>
            {activeProjectId === stat.project.id ? (
              <CheckIcon className="shrink-0" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openProjectDialog("create")}>
          <FolderPlusIcon aria-hidden="true" />
          New project
        </DropdownMenuItem>
        {activeProject ? (
          <DropdownMenuItem
            onSelect={() => openProjectDialog(activeProject.id)}
          >
            <SettingsIcon aria-hidden="true" />
            Project settings
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Create a project, rename one, or retire one and rehome its bugs. */
export function ProjectDialog() {
  const {
    bugs,
    closeProjectDialog,
    createProject,
    deleteProject,
    getProject,
    openCreate,
    projectDialog,
    projects,
    updateProject,
  } = useBugBoard();

  const editing =
    projectDialog && projectDialog !== "create"
      ? getProject(projectDialog)
      : undefined;
  const open = projectDialog !== null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [moveToId, setMoveToId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reloads the form whenever the dialog opens on a different target.
  const sessionKey = `${open ? "open" : "closed"}:${projectDialog ?? ""}`;
  const [session, setSession] = useState(sessionKey);
  if (session !== sessionKey) {
    setSession(sessionKey);
    setError(null);
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setMoveToId(
      projects.find((project) => project.id !== editing?.id)?.id ?? ""
    );
  }

  const ownedCount = editing
    ? bugs.filter((bug) => bug.projectId === editing.id).length
    : 0;
  const isLastProject = projects.length < 2;

  function handleSubmit() {
    const title = name.trim();
    if (!title) {
      setError("A project needs a title.");
      return;
    }
    const clash = projects.some(
      (project) =>
        project.id !== editing?.id &&
        project.name.toLowerCase() === title.toLowerCase()
    );
    if (clash) {
      setError("Another project already uses that title.");
      return;
    }

    if (editing) {
      updateProject(editing.id, { name: title, description });
      toast.success(`${title} updated`);
    } else {
      createProject({ name: title, description });
      toast.success(`${title} created`, {
        description: "The board is now scoped to it.",
        action: { label: "Add a bug", onClick: openCreate },
      });
    }
    closeProjectDialog();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeProjectDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Project settings` : "New project"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Rename the project, or retire it and rehome its bugs."
                : "Group the bugs one QA workstream files, so the developers on it only see their own queue."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">
                Project title
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSubmit();
                }}
                placeholder="e.g. Checkout Revamp"
                aria-invalid={Boolean(error)}
                autoFocus
              />
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this project covers, and who is testing it."
                className="min-h-20"
              />
            </div>

            {editing ? (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-sm font-medium">Delete project</p>
                {isLastProject ? (
                  <p className="text-xs text-muted-foreground">
                    The board needs at least one project, so this one cannot be
                    deleted.
                  </p>
                ) : ownedCount > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {ownedCount} bug{ownedCount === 1 ? "" : "s"} live here.
                      They move to the project you pick, nothing is deleted.
                    </p>
                    <Select value={moveToId} onValueChange={setMoveToId}>
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue placeholder="Move the bugs to…" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects
                          .filter((project) => project.id !== editing.id)
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This project has no bugs in it.
                  </p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="self-start"
                  disabled={isLastProject || (ownedCount > 0 && !moveToId)}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                  Delete project
                </Button>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeProjectDialog}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              <SaveIcon aria-hidden="true" />
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${editing?.name ?? "this project"}?`}
        description={
          ownedCount > 0
            ? `Its ${ownedCount} bug${ownedCount === 1 ? "" : "s"} move to ${
                projects.find((project) => project.id === moveToId)?.name ?? ""
              }. The project itself is removed from the board.`
            : "The project is removed from the board. This cannot be undone."
        }
        confirmLabel="Delete project"
        onConfirm={() => {
          if (!editing) return;
          deleteProject(editing.id, ownedCount > 0 ? moveToId : null);
          setConfirmOpen(false);
          closeProjectDialog();
          toast.success(`${editing.name} deleted`);
        }}
      />
    </>
  );
}
