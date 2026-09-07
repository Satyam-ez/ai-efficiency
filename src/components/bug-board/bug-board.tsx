"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BugIcon,
  DownloadIcon,
  FolderPlusIcon,
  KeyboardIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { BoardAttachmentPreview } from "@/components/bug-board/attachment-preview";
import {
  BugBoardProvider,
  useBugBoard,
} from "@/components/bug-board/bug-board-provider";
import { BugDetailsDrawer } from "@/components/bug-board/bug-details-drawer";
import { BugFormDialog } from "@/components/bug-board/bug-form-dialog";
import { BugTable, SelectionSummary } from "@/components/bug-board/bug-table";
import { BulkActions } from "@/components/bug-board/bulk-actions";
import { FilterBar } from "@/components/bug-board/filter-bar";
import {
  ShortcutsDialog,
  useBoardShortcuts,
} from "@/components/bug-board/keyboard-shortcuts";
import {
  ProjectDialog,
  ProjectSwitcher,
} from "@/components/bug-board/project-switcher";
import { ShareHandoffDialog } from "@/components/bug-board/share-handoff-dialog";
import { SummaryCards } from "@/components/bug-board/summary-cards";
import { TablePagination } from "@/components/bug-board/table-pagination";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { bugsToCsv, downloadCsv } from "@/lib/bug-board/export";
import { OPEN_TESTER_STATUSES } from "@/lib/bug-board/filters";

/** Filename-safe, so each project's export lands under its own name. */
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "bug-board"
  );
}

function Board() {
  const {
    activeProject,
    activeProjectId,
    filters,
    setQuery,
    filterCount,
    visibleBugs,
    openCreate,
    openProjectDialog,
    openShare,
    patchFilters,
    projectName,
    setActiveProject,
    setShortcutsOpen,
    detailBugId,
    openDetail,
    getBug,
  } = useBugBoard();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const deepLinkHandled = useRef(false);

  const exportView = useCallback(() => {
    if (visibleBugs.length === 0) {
      toast.error("Nothing to export in this view");
      return;
    }
    downloadCsv(
      `${slugify(activeProject?.name ?? "bug-board")}.csv`,
      bugsToCsv(visibleBugs, projectName),
    );
    toast.success(
      `Exported ${visibleBugs.length} bug${visibleBugs.length === 1 ? "" : "s"} to CSV`,
    );
  }, [activeProject, projectName, visibleBugs]);

  useBoardShortcuts({
    onFocusSearch: () => searchRef.current?.focus(),
    onToggleFilters: () => setFiltersExpanded((previous) => !previous),
    onExport: exportView,
    onShare: () => openShare(),
  });

  // A shared link opens the board exactly as it was handed over: ?bug=BUG-1042
  // for one bug, and ?project / ?assignee / ?bugs / ?open for a hand-off list.
  useEffect(() => {
    if (deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const params = new URLSearchParams(window.location.search);

    const project = params.get("project");
    if (project) setActiveProject(project);

    const assignee = params.get("assignee");
    const pinned = params.get("bugs");
    const patch: Parameters<typeof patchFilters>[0] = {};
    if (assignee) patch.assigneeIds = [assignee];
    if (pinned) patch.bugIds = pinned.split(",").filter(Boolean);
    if (params.get("open") === "1") patch.testerStatus = OPEN_TESTER_STATUSES;
    if (Object.keys(patch).length > 0) patchFilters(patch);

    const requested = params.get("bug");
    if (requested) openDetail(requested);
  }, [openDetail, patchFilters, setActiveProject]);

  // Keeps the address bar in step with the scope and the open bug, so the link
  // in the URL bar always reopens what is on screen. The hand-off parameters
  // are dropped once applied, since they now live in the board's own state.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (detailBugId) {
      url.searchParams.set("bug", detailBugId);
    } else {
      url.searchParams.delete("bug");
    }
    if (activeProjectId) {
      url.searchParams.set("project", activeProjectId);
    } else {
      url.searchParams.delete("project");
    }
    for (const param of ["assignee", "bugs", "open"]) {
      url.searchParams.delete(param);
    }
    window.history.replaceState(null, "", url);
  }, [activeProjectId, detailBugId]);

  const missing = detailBugId && !getBug(detailBugId);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-425 flex-1 flex-col gap-4 p-6 lg:p-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BugIcon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-xl leading-tight font-semibold tracking-tight">
              Bug Board
            </h1>
            <p className="text-sm text-muted-foreground">
              Track, assign, reproduce, and resolve product issues
              collaboratively.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <Label htmlFor="bug-search" className="sr-only">
              Search bugs
            </Label>
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="bug-search"
              ref={searchRef}
              value={filters.query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bugs, modules, people…"
              className="w-56 pl-8 lg:w-72"
            />
            {filters.query ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-1 -translate-y-1/2"
                aria-label="Clear search">
                <XIcon aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <Button
            variant={filtersExpanded ? "secondary" : "outline"}
            onClick={() => setFiltersExpanded((previous) => !previous)}
            aria-expanded={filtersExpanded}>
            <SlidersHorizontalIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Filter
            {filterCount > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {filterCount}
              </Badge>
            ) : null}
          </Button>

          <Button variant="outline" onClick={exportView}>
            <DownloadIcon data-icon="inline-start" aria-hidden="true" />
            Export
          </Button>

          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Create Bug
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)">
            <KeyboardIcon aria-hidden="true" />
          </Button>

          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ProjectSwitcher />
          <p className="hidden min-w-0 truncate text-sm text-muted-foreground lg:block">
            {activeProject
              ? activeProject.description
              : "Every project at once. Pick one so each developer only gets the bugs they own."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openProjectDialog("create")}>
            <FolderPlusIcon data-icon="inline-start" aria-hidden="true" />
            New project
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openShare()}>
            <Share2Icon data-icon="inline-start" aria-hidden="true" />
            Share with developer
          </Button>
        </div>
      </div>

      <SummaryCards />

      <FilterBar expanded={filtersExpanded} />

      {missing ? (
        <p className="text-sm text-muted-foreground">
          The linked bug is no longer on this board.
        </p>
      ) : null}

      <Card className="flex h-[600px] flex-col gap-0 overflow-hidden rounded-md py-0">
        <BulkActions />
        <div className="flex items-center justify-between gap-2 border-b px-3 pt-2.5 pb-3.5">
          <SelectionSummary />
          <span className="text-xs text-muted-foreground">
            Press <kbd className="font-mono">?</kbd> for shortcuts
          </span>
        </div>
        <BugTable />
        <TablePagination />
      </Card>

      <BugFormDialog />
      <BugDetailsDrawer />
      <BoardAttachmentPreview />
      <ProjectDialog />
      <ShareHandoffDialog />
      <ShortcutsDialog />
    </div>
  );
}

export function BugBoard() {
  return (
    <BugBoardProvider>
      <TooltipProvider delayDuration={250}>
        <Board />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </BugBoardProvider>
  );
}
