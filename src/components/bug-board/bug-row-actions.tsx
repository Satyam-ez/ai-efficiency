"use client";

import { useState } from "react";
import {
  CopyIcon,
  CopyPlusIcon,
  EyeIcon,
  HistoryIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bug } from "@/lib/bug-board/types";

export function copyText(value: string, message: string) {
  void navigator.clipboard
    .writeText(value)
    .then(() => toast.success(message))
    .catch(() => toast.error("Clipboard access was blocked"));
}

export function shareLinkFor(bugId: string): string {
  if (typeof window === "undefined") return `?bug=${bugId}`;
  return `${window.location.origin}${window.location.pathname}?bug=${bugId}`;
}

export function BugRowActions({ bug }: { bug: Bug }) {
  const { openDetail, openEdit, duplicateBug, deleteBugs } = useBugBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${bug.id}`}>
            <MoreHorizontalIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 min-w-48">
          <DropdownMenuItem onSelect={() => openDetail(bug.id)}>
            <EyeIcon aria-hidden="true" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openEdit(bug.id)}>
            <PencilIcon aria-hidden="true" />
            Edit bug
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDetail(bug.id, "activity")}>
            <HistoryIcon aria-hidden="true" />
            Audit history
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => copyText(bug.id, `Copied ${bug.id}`)}
          >
            <CopyIcon aria-hidden="true" />
            Copy bug ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => copyText(shareLinkFor(bug.id), "Share link copied")}
          >
            <LinkIcon aria-hidden="true" />
            Copy share link
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              const copy = await duplicateBug(bug.id);
              if (copy) toast.success(`Duplicated as ${copy.id}`);
            }}
          >
            <CopyPlusIcon aria-hidden="true" />
            Duplicate bug
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2Icon aria-hidden="true" />
            Delete bug
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${bug.id}?`}
        description="The bug, its attachments, comments and activity history are removed from the board. This cannot be undone."
        confirmLabel="Delete bug"
        onConfirm={() => {
          deleteBugs([bug.id]);
          setConfirmOpen(false);
          toast.success(`${bug.id} deleted`);
        }}
      />
    </>
  );
}
