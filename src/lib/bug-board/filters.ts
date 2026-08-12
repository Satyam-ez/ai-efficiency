import { boardNowMs, personName, SPRINT_DAYS } from "@/lib/bug-board/data";
import { toEpochMs } from "@/lib/bug-board/format";
import {
  PRIORITIES,
  SEVERITIES,
  type Bug,
  type DeveloperStatus,
  type Environment,
  type Priority,
  type Severity,
  type TesterStatus,
} from "@/lib/bug-board/types";

export interface BugFilters {
  query: string;
  /** Only used while the board is unscoped, i.e. showing every project. */
  projectIds: string[];
  /**
   * An explicit hand-off list, set by a shared link such as
   * `?bugs=BUG-1042,BUG-1051`. Empty means "no id restriction".
   */
  bugIds: string[];
  testerStatus: TesterStatus[];
  developerStatus: DeveloperStatus[];
  severity: Severity[];
  priority: Priority[];
  assigneeIds: string[];
  reporterIds: string[];
  modules: string[];
  sprints: string[];
  environments: Environment[];
  /** `YYYY-MM-DD`, inclusive, matched against the created date. */
  createdFrom: string;
  createdTo: string;
}

/** The facet keys, i.e. every filter whose value is a list of selections. */
export const ARRAY_FILTER_KEYS = [
  "projectIds",
  "testerStatus",
  "developerStatus",
  "severity",
  "priority",
  "assigneeIds",
  "reporterIds",
  "modules",
  "sprints",
  "environments",
] as const;
export type ArrayFilterKey = (typeof ARRAY_FILTER_KEYS)[number];

export const EMPTY_FILTERS: BugFilters = {
  query: "",
  projectIds: [],
  bugIds: [],
  testerStatus: [],
  developerStatus: [],
  severity: [],
  priority: [],
  assigneeIds: [],
  reporterIds: [],
  modules: [],
  sprints: [],
  environments: [],
  createdFrom: "",
  createdTo: "",
};

/** Facets only, so the search field can be shown separately. */
export function activeFilterCount(filters: BugFilters): number {
  return (
    filters.projectIds.length +
    (filters.bugIds.length > 0 ? 1 : 0) +
    filters.testerStatus.length +
    filters.developerStatus.length +
    filters.severity.length +
    filters.priority.length +
    filters.assigneeIds.length +
    filters.reporterIds.length +
    filters.modules.length +
    filters.sprints.length +
    filters.environments.length +
    (filters.createdFrom ? 1 : 0) +
    (filters.createdTo ? 1 : 0)
  );
}

function matchesQuery(bug: Bug, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    bug.id,
    bug.title,
    bug.module,
    bug.component,
    bug.sprint,
    bug.description,
    personName(bug.reporterId),
    bug.assigneeId ? personName(bug.assigneeId) : "unassigned",
    ...bug.labels,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function includedIn<T>(selected: T[], value: T): boolean {
  return selected.length === 0 || selected.includes(value);
}

export function filterBugs(bugs: Bug[], filters: BugFilters): Bug[] {
  const needle = filters.query.trim().toLowerCase();
  const from = filters.createdFrom ? toEpochMs(filters.createdFrom) : null;
  // The end of the day, so a single-day range keeps its own bugs.
  const to = filters.createdTo
    ? toEpochMs(filters.createdTo) + 86_400_000 - 1
    : null;

  return bugs.filter((bug) => {
    if (filters.bugIds.length > 0 && !filters.bugIds.includes(bug.id)) {
      return false;
    }
    if (!matchesQuery(bug, needle)) return false;
    if (!includedIn(filters.projectIds, bug.projectId)) return false;
    if (!includedIn(filters.testerStatus, bug.testerStatus)) return false;
    if (!includedIn(filters.developerStatus, bug.developerStatus)) return false;
    if (!includedIn(filters.severity, bug.severity)) return false;
    if (!includedIn(filters.priority, bug.priority)) return false;
    if (!includedIn(filters.modules, bug.module)) return false;
    if (!includedIn(filters.sprints, bug.sprint)) return false;
    if (!includedIn(filters.environments, bug.environment)) return false;
    if (!includedIn(filters.reporterIds, bug.reporterId)) return false;
    if (
      filters.assigneeIds.length > 0 &&
      !filters.assigneeIds.includes(bug.assigneeId ?? "unassigned")
    ) {
      return false;
    }
    const createdAt = toEpochMs(bug.createdAt);
    if (from !== null && createdAt < from) return false;
    if (to !== null && createdAt > to) return false;
    return true;
  });
}

export const SORT_KEYS = [
  "id",
  "title",
  "module",
  "severity",
  "priority",
  "reporter",
  "testerStatus",
  "developerStatus",
  "assignee",
  "attachments",
  "createdAt",
  "updatedAt",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export interface Sort {
  key: SortKey;
  direction: SortDirection;
}

export const DEFAULT_SORT: Sort = { key: "updatedAt", direction: "desc" };

const SEVERITY_RANK: Record<Severity, number> = Object.fromEntries(
  SEVERITIES.map((severity, index) => [severity, index])
) as Record<Severity, number>;

const PRIORITY_RANK: Record<Priority, number> = Object.fromEntries(
  PRIORITIES.map((priority, index) => [priority, index])
) as Record<Priority, number>;

const TESTER_RANK: Record<TesterStatus, number> = {
  open: 0,
  reopened: 1,
  "under-review": 2,
  verified: 3,
  closed: 4,
};

const DEVELOPER_RANK: Record<DeveloperStatus, number> = {
  blocked: 0,
  backlog: 1,
  assigned: 2,
  "in-progress": 3,
  "ready-for-qa": 4,
  fixed: 5,
};

/** Numbers sort numerically, everything else with a locale compare. */
function compare(a: Bug, b: Bug, key: SortKey): number {
  switch (key) {
    case "id":
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    case "title":
      return a.title.localeCompare(b.title);
    case "module":
      return a.module.localeCompare(b.module);
    case "severity":
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    case "priority":
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "reporter":
      return personName(a.reporterId).localeCompare(personName(b.reporterId));
    case "testerStatus":
      return TESTER_RANK[a.testerStatus] - TESTER_RANK[b.testerStatus];
    case "developerStatus":
      return DEVELOPER_RANK[a.developerStatus] - DEVELOPER_RANK[b.developerStatus];
    case "assignee":
      return personName(a.assigneeId).localeCompare(personName(b.assigneeId));
    case "attachments":
      return a.attachments.length - b.attachments.length;
    case "createdAt":
      return toEpochMs(a.createdAt) - toEpochMs(b.createdAt);
    case "updatedAt":
      return toEpochMs(a.updatedAt) - toEpochMs(b.updatedAt);
  }
}

export function sortBugs(bugs: Bug[], sort: Sort): Bug[] {
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...bugs].sort((a, b) => {
    const result = compare(a, b, sort.key);
    // Ties fall back to the id so pagination stays stable.
    return result !== 0
      ? result * factor
      : a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

export function isOpen(bug: Bug): boolean {
  return bug.testerStatus !== "closed";
}

/** The facet equivalent of {@link isOpen}, for filters and shared links. */
export const OPEN_TESTER_STATUSES: TesterStatus[] = [
  "open",
  "under-review",
  "verified",
  "reopened",
];

export interface SummaryCard {
  id: string;
  label: string;
  value: number;
  hint: string;
  /** Change over the last seven days; `null` when a delta is not meaningful. */
  delta: number | null;
  /** Whether a rising number is a good thing, used to pick the arrow. */
  risingIsGood?: boolean;
}

export function summarize(bugs: Bug[]): SummaryCard[] {
  const now = boardNowMs();
  const week = now - 7 * 86_400_000;
  const sprintStart = now - SPRINT_DAYS * 86_400_000;

  const createdThisWeek = bugs.filter(
    (bug) => toEpochMs(bug.createdAt) >= week
  ).length;
  const open = bugs.filter(isOpen);
  const closedThisSprint = bugs.filter(
    (bug) => bug.testerStatus === "closed" && toEpochMs(bug.updatedAt) >= sprintStart
  );
  const closedThisWeek = bugs.filter(
    (bug) => bug.testerStatus === "closed" && toEpochMs(bug.updatedAt) >= week
  ).length;
  const critical = open.filter((bug) => bug.severity === "critical");
  const inProgress = bugs.filter((bug) => bug.developerStatus === "in-progress");
  const readyForQa = bugs.filter(
    (bug) => bug.developerStatus === "ready-for-qa"
  );
  const blocked = bugs.filter((bug) => bug.developerStatus === "blocked").length;
  const unassigned = open.filter((bug) => !bug.assigneeId).length;
  const criticalInProduction = critical.filter(
    (bug) => bug.environment === "production"
  ).length;
  const oldestReadyForQa = readyForQa.reduce((oldest, bug) => {
    const days = Math.floor((now - toEpochMs(bug.updatedAt)) / 86_400_000);
    return Math.max(oldest, days);
  }, 0);
  const verifiedThisSprint = bugs.filter(
    (bug) =>
      bug.testerStatus === "verified" && toEpochMs(bug.updatedAt) >= sprintStart
  ).length;

  return [
    {
      id: "total",
      label: "Total Bugs",
      value: bugs.length,
      hint: `${createdThisWeek} reported in the last 7 days`,
      delta: createdThisWeek,
      risingIsGood: false,
    },
    {
      id: "open",
      label: "Open Bugs",
      value: open.length,
      hint: `${unassigned} still unassigned`,
      delta: createdThisWeek - closedThisWeek,
      risingIsGood: false,
    },
    {
      id: "critical",
      label: "Critical Bugs",
      value: critical.length,
      hint: `${criticalInProduction} on production`,
      delta: null,
    },
    {
      id: "in-progress",
      label: "Bugs In Progress",
      value: inProgress.length,
      hint: blocked > 0 ? `${blocked} blocked` : "Nothing blocked",
      delta: null,
    },
    {
      id: "ready-for-qa",
      label: "Ready for QA",
      value: readyForQa.length,
      hint:
        readyForQa.length > 0
          ? `Oldest waiting ${oldestReadyForQa}d`
          : "Queue is empty",
      delta: null,
    },
    {
      id: "closed",
      label: "Closed This Sprint",
      value: closedThisSprint.length,
      hint: `${verifiedThisSprint} verified, awaiting close`,
      delta: closedThisWeek,
      risingIsGood: true,
    },
  ];
}
