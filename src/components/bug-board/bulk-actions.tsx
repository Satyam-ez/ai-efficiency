"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  DownloadIcon,
  FolderInputIcon,
  Share2Icon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEVELOPERS } from "@/lib/bug-board/data";
import { bugsToCsv, downloadCsv } from "@/lib/bug-board/export";
import {
  DEVELOPER_STATUSES,
  DEVELOPER_STATUS_LABELS,
  PRIORITIES,
  SEVERITIES,
  SEVERITY_LABELS,
  TESTER_STATUSES,
  TESTER_STATUS_LABELS,
} from "@/lib/bug-board/types";

function BulkMenu({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {icon}
          {label}
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 min-w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Appears only while rows are selected, in the strip above the table. */
export function BulkActions() {
  const {
    selectedIds,
    setSelection,
    visibleBugs,
    bugs,
    setTesterStatus,
    setDeveloperStatus,
    setSeverity,
    setPriority,
    assignBugs,
    deleteBugs,
    moveBugsToProject,
    openShare,
    projectName,
    projects,
  } = useBugBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (selectedIds.length === 0) return null;

  const count = selectedIds.length;
  const allVisibleSelected = visibleBugs.every((bug) =>
    selectedIds.includes(bug.id)
  );

  function done(message: string) {
    toast.success(message);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
      <Badge variant="secondary" className="tabular-nums">
        {count} selected
      </Badge>
      {!allVisibleSelected ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelection(visibleBugs.map((bug) => bug.id))}
        >
          Select all {visibleBugs.length} filtered
        </Button>
      ) : null}

      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <BulkMenu
        label="Assign"
        icon={<UserPlusIcon data-icon="inline-start" aria-hidden="true" />}
      >
        {DEVELOPERS.map((person) => (
          <DropdownMenuItem
            key={person.id}
            onSelect={() => {
              assignBugs(selectedIds, person.id);
              done(`Assigned ${count} bug${count === 1 ? "" : "s"} to ${person.name}`);
            }}
          >
            {person.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            assignBugs(selectedIds, null);
            done("Assignee removed");
          }}
        >
          Unassign
        </DropdownMenuItem>
      </BulkMenu>

      <BulkMenu
        label="Move to project"
        icon={<FolderInputIcon data-icon="inline-start" aria-hidden="true" />}
      >
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => {
              moveBugsToProject(selectedIds, project.id);
              done(
                `Moved ${count} bug${count === 1 ? "" : "s"} to ${project.name}`
              );
            }}
          >
            {project.name}
          </DropdownMenuItem>
        ))}
      </BulkMenu>

      <BulkMenu label="Tester status">
        {TESTER_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => {
              setTesterStatus(selectedIds, status);
              done(`Tester status set to ${TESTER_STATUS_LABELS[status]}`);
            }}
          >
            {TESTER_STATUS_LABELS[status]}
          </DropdownMenuItem>
        ))}
      </BulkMenu>

      <BulkMenu label="Developer status">
        {DEVELOPER_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => {
              setDeveloperStatus(selectedIds, status);
              done(`Developer status set to ${DEVELOPER_STATUS_LABELS[status]}`);
            }}
          >
            {DEVELOPER_STATUS_LABELS[status]}
          </DropdownMenuItem>
        ))}
      </BulkMenu>

      <BulkMenu label="Severity">
        {SEVERITIES.map((severity) => (
          <DropdownMenuItem
            key={severity}
            onSelect={() => {
              setSeverity(selectedIds, severity);
              done(`Severity set to ${SEVERITY_LABELS[severity]}`);
            }}
          >
            {SEVERITY_LABELS[severity]}
          </DropdownMenuItem>
        ))}
      </BulkMenu>

      <BulkMenu label="Priority">
        {PRIORITIES.map((priority) => (
          <DropdownMenuItem
            key={priority}
            onSelect={() => {
              setPriority(selectedIds, priority);
              done(`Priority set to ${priority}`);
            }}
          >
            {priority}
          </DropdownMenuItem>
        ))}
      </BulkMenu>

      <Button variant="outline" size="sm" onClick={() => openShare(selectedIds)}>
        <Share2Icon data-icon="inline-start" aria-hidden="true" />
        Share
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const selected = bugs.filter((bug) => selectedIds.includes(bug.id));
          downloadCsv(
            "bug-board-selection.csv",
            bugsToCsv(selected, projectName)
          );
          done(`Exported ${selected.length} bug${selected.length === 1 ? "" : "s"}`);
        }}
      >
        <DownloadIcon data-icon="inline-start" aria-hidden="true" />
        Export
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2Icon data-icon="inline-start" aria-hidden="true" />
        Delete
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="ml-auto"
        onClick={() => setSelection([])}
      >
        <XIcon data-icon="inline-start" aria-hidden="true" />
        Clear selection
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${count} bug${count === 1 ? "" : "s"}?`}
        description="Every selected bug is removed from the board along with its attachments, comments and history. This cannot be undone."
        confirmLabel={`Delete ${count} bug${count === 1 ? "" : "s"}`}
        onConfirm={() => {
          deleteBugs(selectedIds);
          setConfirmOpen(false);
          done(`Deleted ${count} bug${count === 1 ? "" : "s"}`);
        }}
      />
    </div>
  );
}
