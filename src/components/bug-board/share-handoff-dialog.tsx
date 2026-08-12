"use client";

import { useMemo, useState } from "react";
import { ClipboardListIcon, DownloadIcon, LinkIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { copyText } from "@/components/bug-board/bug-row-actions";
import {
  DeveloperStatusBadge,
  PriorityBadge,
  SeverityBadge,
} from "@/components/bug-board/status-badges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEVELOPERS, personName } from "@/lib/bug-board/data";
import {
  bugsToCsv,
  bugsToHandoffText,
  downloadCsv,
} from "@/lib/bug-board/export";
import { isOpen } from "@/lib/bug-board/filters";
import type { Bug } from "@/lib/bug-board/types";

const EVERYONE = "everyone";

/** A file-name safe slug, so two projects never overwrite each other's export. */
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "bugs"
  );
}

/**
 * Builds the link the developer receives. An explicit selection is pinned by id
 * so the list can never drift; otherwise the link stays live, reopening the
 * project (and optionally one developer's slice) as it stands that day.
 */
function handoffLink({
  projectId,
  assigneeId,
  bugIds,
  openOnly,
}: {
  projectId: string | null;
  assigneeId: string | null;
  bugIds: string[] | null;
  openOnly: boolean;
}): string {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (bugIds) {
    params.set("bugs", bugIds.join(","));
  } else {
    if (assigneeId) params.set("assignee", assigneeId);
    if (openOnly) params.set("open", "1");
  }
  const query = params.toString();
  if (typeof window === "undefined") return `?${query}`;
  return `${window.location.origin}${window.location.pathname}${
    query ? `?${query}` : ""
  }`;
}

export function ShareHandoffDialog() {
  const {
    activeProject,
    activeProjectId,
    bugs,
    closeShare,
    projectName,
    shareTarget,
    visibleBugs,
  } = useBugBoard();

  const [assigneeId, setAssigneeId] = useState<string>(EVERYONE);
  const [openOnly, setOpenOnly] = useState(true);

  const open = shareTarget !== undefined;
  const pinnedIds = Array.isArray(shareTarget) ? shareTarget : null;

  // Resets the recipient every time the dialog is opened on a new target.
  const sessionKey = `${open ? "open" : "closed"}:${pinnedIds?.join(",") ?? "view"}`;
  const [session, setSession] = useState(sessionKey);
  if (session !== sessionKey) {
    setSession(sessionKey);
    setAssigneeId(EVERYONE);
    setOpenOnly(true);
  }

  /** The set being handed over, before the recipient filter. */
  const source = useMemo<Bug[]>(
    () =>
      pinnedIds
        ? bugs.filter((bug) => pinnedIds.includes(bug.id))
        : visibleBugs,
    [bugs, pinnedIds, visibleBugs]
  );

  const recipients = useMemo(
    () =>
      DEVELOPERS.map((person) => ({
        person,
        count: source.filter((bug) => bug.assigneeId === person.id).length,
      })).filter((option) => option.count > 0),
    [source]
  );

  const shared = useMemo(
    () =>
      source.filter((bug) => {
        if (assigneeId !== EVERYONE && bug.assigneeId !== assigneeId) {
          return false;
        }
        // A pinned list is already a decision, so it is never trimmed further.
        if (!pinnedIds && openOnly && !isOpen(bug)) return false;
        return true;
      }),
    [assigneeId, openOnly, pinnedIds, source]
  );

  // A pinned selection can span projects; the link only scopes when it is safe.
  const linkProjectId =
    activeProjectId ??
    (shared.length > 0 &&
    shared.every((bug) => bug.projectId === shared[0].projectId)
      ? shared[0].projectId
      : null);

  const link = handoffLink({
    projectId: linkProjectId,
    assigneeId: assigneeId === EVERYONE ? null : assigneeId,
    bugIds: pinnedIds ? shared.map((bug) => bug.id) : null,
    openOnly,
  });

  const scopeName =
    activeProject?.name ??
    (linkProjectId ? projectName(linkProjectId) : "All projects");
  const heading =
    assigneeId === EVERYONE
      ? `${scopeName} — bug hand-off`
      : `${scopeName} — bugs for ${personName(assigneeId)}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeShare();
      }}
    >
      <DialogContent className="max-h-[92dvh] gap-4 overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Share with a developer</DialogTitle>
          <DialogDescription>
            {pinnedIds
              ? "The link pins these exact bugs, so the developer opens the same list you selected."
              : "The link reopens this board scoped to the project, so the developer only sees the bugs they own."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-project">Project</Label>
              <div
                id="share-project"
                className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm"
              >
                <span className="truncate">{scopeName}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-assignee">Developer</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="share-assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EVERYONE}>
                    Everyone on the project
                  </SelectItem>
                  {recipients.map((option) => (
                    <SelectItem key={option.person.id} value={option.person.id}>
                      {option.person.name} · {option.count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pinnedIds ? null : (
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={openOnly}
                onCheckedChange={(checked) => setOpenOnly(checked === true)}
              />
              Only bugs that are still open
            </Label>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                {shared.length} bug{shared.length === 1 ? "" : "s"} in this
                hand-off
              </p>
              {assigneeId !== EVERYONE ? (
                <p className="text-xs text-muted-foreground">
                  Assigned to {personName(assigneeId)}
                </p>
              ) : null}
            </div>
            <ul className="flex max-h-56 flex-col divide-y overflow-y-auto rounded-lg border">
              {shared.map((bug) => (
                <li key={bug.id} className="flex flex-col gap-1 px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{bug.id}</span>
                    <span className="truncate text-sm" title={bug.title}>
                      {bug.title}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={bug.severity} />
                    <PriorityBadge priority={bug.priority} />
                    <DeveloperStatusBadge status={bug.developerStatus} />
                    <span className="text-xs text-muted-foreground">
                      {bug.module} ·{" "}
                      {bug.assigneeId
                        ? personName(bug.assigneeId)
                        : "Unassigned"}
                    </span>
                  </span>
                </li>
              ))}
              {shared.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nothing matches this hand-off yet.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="share-link">Share link</Label>
            <div className="flex gap-1.5">
              <input
                id="share-link"
                readOnly
                value={link}
                onFocus={(event) => event.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-md border bg-muted/40 px-3 font-mono text-xs"
              />
              <Button
                size="sm"
                onClick={() => copyText(link, "Share link copied")}
              >
                <LinkIcon data-icon="inline-start" aria-hidden="true" />
                Copy link
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <span className="mr-auto hidden text-xs text-muted-foreground sm:block">
            <SendIcon
              className="mr-1 inline size-3"
              aria-hidden="true"
            />
            Paste the summary into chat, or send the CSV.
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={shared.length === 0}
            onClick={() =>
              copyText(
                bugsToHandoffText(shared, { heading, link }),
                "Hand-off summary copied"
              )
            }
          >
            <ClipboardListIcon data-icon="inline-start" aria-hidden="true" />
            Copy summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={shared.length === 0}
            onClick={() => {
              downloadCsv(
                `${slugify(scopeName)}-handoff.csv`,
                bugsToCsv(shared, projectName)
              );
              toast.success(
                `Exported ${shared.length} bug${shared.length === 1 ? "" : "s"}`
              );
            }}
          >
            <DownloadIcon data-icon="inline-start" aria-hidden="true" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
