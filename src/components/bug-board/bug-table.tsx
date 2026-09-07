"use client";

import { useMemo } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BugIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  FolderIcon,
  SearchXIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { BugRowActions } from "@/components/bug-board/bug-row-actions";
import { PersonChip } from "@/components/bug-board/person-chip";
import {
  ATTACHMENT_ICONS,
  DeveloperStatusBadge,
  PriorityBadge,
  SeverityBadge,
  TesterStatusBadge,
} from "@/components/bug-board/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/bug-board/format";
import type { SortKey } from "@/lib/bug-board/filters";
import {
  DEVELOPER_STATUSES,
  DEVELOPER_STATUS_LABELS,
  TESTER_STATUSES,
  TESTER_STATUS_LABELS,
  type Bug,
} from "@/lib/bug-board/types";
import { cn } from "@/lib/utils";

interface Column {
  key: SortKey | null;
  label: string;
  className?: string;
  /** Hidden below this breakpoint to keep narrow screens readable. */
  hideBelow?: "md" | "lg" | "xl" | "2xl";
  /** Header text carried for screen readers only, e.g. the actions column. */
  labelHidden?: boolean;
}

/** Only meaningful while the board shows more than one project. */
const PROJECT_COLUMN: Column = { key: null, label: "Project", hideBelow: "md" };

const COLUMNS: Column[] = [
  { key: "id", label: "Bug ID" },
  { key: "title", label: "Title", className: "w-[26rem]" },
  { key: "module", label: "Module", hideBelow: "lg" },
  { key: "severity", label: "Severity" },
  { key: "priority", label: "Priority" },
  { key: "reporter", label: "Tester", hideBelow: "xl" },
  { key: "testerStatus", label: "Tester Status" },
  { key: "developerStatus", label: "Developer Status" },
  { key: "assignee", label: "Assigned Developer", hideBelow: "lg" },
  { key: "attachments", label: "Files", hideBelow: "xl" },
  { key: "createdAt", label: "Created", hideBelow: "2xl" },
  { key: "updatedAt", label: "Updated", hideBelow: "md" },
  { key: null, label: "Actions", labelHidden: true },
];

const HIDE_CLASSES: Record<NonNullable<Column["hideBelow"]>, string> = {
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
  "2xl": "hidden 2xl:table-cell",
};

function SortButton({ column }: { column: Column }) {
  const { sort, toggleSort } = useBugBoard();
  if (!column.key) {
    return column.labelHidden ? (
      <span className="sr-only">{column.label}</span>
    ) : (
      <>{column.label}</>
    );
  }

  const active = sort.key === column.key;
  const Icon = !active
    ? ChevronsUpDownIcon
    : sort.direction === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon;

  return (
    <button
      type="button"
      onClick={() => toggleSort(column.key as SortKey)}
      className="group/sort -mx-1 flex h-7 items-center gap-1 rounded-md px-1 transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label={`Sort by ${column.label}`}
    >
      {column.label}
      <Icon
        className={cn(
          "size-3 shrink-0 transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-60"
        )}
        aria-hidden="true"
      />
    </button>
  );
}

function AttachmentsCell({ bug }: { bug: Bug }) {
  const kinds = useMemo(() => {
    const seen: string[] = [];
    for (const attachment of bug.attachments) {
      if (!seen.includes(attachment.kind)) seen.push(attachment.kind);
    }
    return seen.slice(0, 3);
  }, [bug.attachments]);

  if (bug.attachments.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 text-muted-foreground">
          {kinds.map((kind) => {
            const Icon = ATTACHMENT_ICONS[kind as keyof typeof ATTACHMENT_ICONS];
            return <Icon key={kind} className="size-3.5" aria-hidden="true" />;
          })}
          <span className="tabular-nums">{bug.attachments.length}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {bug.attachments.map((attachment) => attachment.name).join(", ")}
      </TooltipContent>
    </Tooltip>
  );
}

/** Inline status editing, the fastest path through a triage session. */
function StatusMenu({
  bug,
  side,
}: {
  bug: Bug;
  side: "tester" | "developer";
}) {
  const { setTesterStatus, setDeveloperStatus } = useBugBoard();
  const isTester = side === "tester";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-4xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={
          isTester
            ? `Change tester status, currently ${TESTER_STATUS_LABELS[bug.testerStatus]}`
            : `Change developer status, currently ${DEVELOPER_STATUS_LABELS[bug.developerStatus]}`
        }
      >
        {isTester ? (
          <TesterStatusBadge status={bug.testerStatus} />
        ) : (
          <DeveloperStatusBadge status={bug.developerStatus} />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 min-w-44">
        <DropdownMenuLabel>
          {isTester ? "Tester status" : "Developer status"}
        </DropdownMenuLabel>
        {isTester
          ? TESTER_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() => setTesterStatus([bug.id], status)}
              >
                {TESTER_STATUS_LABELS[status]}
                {bug.testerStatus === status ? (
                  <CheckIcon className="ml-auto" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            ))
          : DEVELOPER_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() => setDeveloperStatus([bug.id], status)}
              >
                {DEVELOPER_STATUS_LABELS[status]}
                {bug.developerStatus === status ? (
                  <CheckIcon className="ml-auto" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BugRow({ bug, showProject }: { bug: Bug; showProject: boolean }) {
  const { isSelected, toggleSelected, openDetail, projectName } = useBugBoard();
  const selected = isSelected(bug.id);

  function copyId() {
    void navigator.clipboard
      .writeText(bug.id)
      .then(() => toast.success(`Copied ${bug.id}`))
      .catch(() => toast.error("Could not copy the bug id"));
  }

  return (
    <TableRow data-selected={selected} className="cursor-default">
      <TableCell className="pl-4">
        <Checkbox
          checked={selected}
          onCheckedChange={() => toggleSelected(bug.id)}
          aria-label={`Select ${bug.id}`}
        />
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openDetail(bug.id)}
            className="font-medium tabular-nums underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {bug.id}
          </button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={copyId}
            className="opacity-0 transition-opacity group-hover/table-row:opacity-100 focus-visible:opacity-100"
            aria-label={`Copy ${bug.id}`}
          >
            <CopyIcon aria-hidden="true" />
          </Button>
        </span>
      </TableCell>
      {showProject ? (
        <TableCell className={HIDE_CLASSES.md}>
          <Badge variant="outline" className="max-w-40">
            <FolderIcon data-icon="inline-start" aria-hidden="true" />
            <span className="truncate">{projectName(bug.projectId)}</span>
          </Badge>
        </TableCell>
      ) : null}
      <TableCell className="max-w-[26rem]">
        <button
          type="button"
          onClick={() => openDetail(bug.id)}
          className="block w-full truncate text-left underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          title={bug.title}
        >
          {bug.title}
        </button>
      </TableCell>
      <TableCell className={HIDE_CLASSES.lg}>
        <span className="flex flex-col">
          {bug.module}
          <span className="text-[0.8125rem] text-muted-foreground">{bug.component}</span>
        </span>
      </TableCell>
      <TableCell>
        <SeverityBadge severity={bug.severity} />
      </TableCell>
      <TableCell>
        <PriorityBadge priority={bug.priority} />
      </TableCell>
      <TableCell className={HIDE_CLASSES.xl}>
        <PersonChip personId={bug.reporterId} size="sm" />
      </TableCell>
      <TableCell>
        <StatusMenu bug={bug} side="tester" />
      </TableCell>
      <TableCell>
        <StatusMenu bug={bug} side="developer" />
      </TableCell>
      <TableCell className={HIDE_CLASSES.lg}>
        <PersonChip personId={bug.assigneeId} size="sm" />
      </TableCell>
      <TableCell className={HIDE_CLASSES.xl}>
        <AttachmentsCell bug={bug} />
      </TableCell>
      <TableCell className={cn(HIDE_CLASSES["2xl"], "text-muted-foreground")}>
        {formatDate(bug.createdAt)}
      </TableCell>
      <TableCell className={cn(HIDE_CLASSES.md, "text-muted-foreground")}>
        {formatDate(bug.updatedAt)}
      </TableCell>
      <TableCell className="pr-4 text-right">
        <BugRowActions bug={bug} />
      </TableCell>
    </TableRow>
  );
}

export function BugTable() {
  const {
    activeProject,
    activeProjectId,
    openCreate,
    pageBugs,
    scopedBugs,
    visibleBugs,
    selectedIds,
    setSelection,
    resetFilters,
    filterCount,
  } = useBugBoard();

  // Redundant once the board is scoped, essential when it is not.
  const showProject = activeProjectId === null;
  // A brand new project is empty by nature, not because a filter hid something.
  const emptyProject = Boolean(activeProject) && scopedBugs.length === 0;
  const columns = showProject
    ? [COLUMNS[0], PROJECT_COLUMN, ...COLUMNS.slice(1)]
    : COLUMNS;

  const pageIds = pageBugs.map((bug) => bug.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id));
  const headerState =
    selectedOnPage.length === 0
      ? false
      : selectedOnPage.length === pageIds.length
        ? true
        : "indeterminate";

  function toggleAllOnPage() {
    setSelection(
      headerState === true
        ? selectedIds.filter((id) => !pageIds.includes(id))
        : [...new Set([...selectedIds, ...pageIds])]
    );
  }

  return (
    <Table
      className="text-[0.9375rem]"
      containerClassName="no-scrollbar min-h-0 flex-1 overflow-auto"
    >
      <TableHeader className="sticky top-0 z-10 [&_th]:sticky [&_th]:top-0 [&_th]:h-11 [&_th]:bg-table-header [&_th]:text-[0.8125rem] [&_th]:font-semibold [&_th]:text-table-header-foreground">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-9 pl-4">
            <Checkbox
              checked={headerState}
              onCheckedChange={toggleAllOnPage}
              disabled={pageIds.length === 0}
              aria-label="Select all bugs on this page"
            />
          </TableHead>
          {columns.map((column) => (
            <TableHead
              key={column.label}
              className={cn(
                column.className,
                column.hideBelow ? HIDE_CLASSES[column.hideBelow] : undefined,
                column.key === null && "pr-4 text-right"
              )}
            >
              <SortButton column={column} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pageBugs.map((bug) => (
          <BugRow bug={bug} key={bug.id} showProject={showProject} />
        ))}
        {visibleBugs.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length + 1} className="py-12">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {emptyProject ? (
                    <BugIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <SearchXIcon className="size-4" aria-hidden="true" />
                  )}
                </span>
                <p className="font-medium">
                  {emptyProject
                    ? `No bugs in ${activeProject?.name} yet`
                    : "No bugs match this view"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {emptyProject
                    ? "File the first one, and it lands in this project ready to hand over."
                    : "Adjust the search term or widen the filters to see more issues."}
                </p>
                {emptyProject ? (
                  <Button variant="outline" size="sm" onClick={openCreate}>
                    Create bug
                  </Button>
                ) : filterCount > 0 ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

export function SelectionSummary() {
  const { selectedIds, visibleBugs, pageBugs } = useBugBoard();
  const label = `${selectedIds.length} selected`;

  if (selectedIds.length === 0) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        Showing {pageBugs.length} of {visibleBugs.length} bugs
      </span>
    );
  }

  return (
    <Badge variant="secondary" className="tabular-nums">
      {label}
    </Badge>
  );
}
