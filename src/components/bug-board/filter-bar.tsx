"use client";

import { useMemo } from "react";
import { CalendarRangeIcon, FilterXIcon, XIcon } from "lucide-react";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import {
  MultiSelectFilter,
  type FilterOption,
} from "@/components/bug-board/multi-select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  boardNowMs,
  DEVELOPERS,
  MODULES,
  SPRINTS,
  SPRINT_DAYS,
  TESTERS,
} from "@/lib/bug-board/data";
import { formatDate } from "@/lib/bug-board/format";
import type { ArrayFilterKey } from "@/lib/bug-board/filters";
import {
  DEVELOPER_STATUSES,
  DEVELOPER_STATUS_LABELS,
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
  PRIORITIES,
  SEVERITIES,
  SEVERITY_LABELS,
  TESTER_STATUSES,
  TESTER_STATUS_LABELS,
} from "@/lib/bug-board/types";

interface Facet {
  key: ArrayFilterKey;
  label: string;
  options: FilterOption[];
}

const BASE_FACETS: Facet[] = [
  {
    key: "testerStatus",
    label: "Tester status",
    options: TESTER_STATUSES.map((status) => ({
      value: status,
      label: TESTER_STATUS_LABELS[status],
    })),
  },
  {
    key: "developerStatus",
    label: "Developer status",
    options: DEVELOPER_STATUSES.map((status) => ({
      value: status,
      label: DEVELOPER_STATUS_LABELS[status],
    })),
  },
  {
    key: "severity",
    label: "Severity",
    options: SEVERITIES.map((severity) => ({
      value: severity,
      label: SEVERITY_LABELS[severity],
    })),
  },
  {
    key: "priority",
    label: "Priority",
    options: PRIORITIES.map((priority) => ({
      value: priority,
      label: priority,
    })),
  },
  {
    key: "assigneeIds",
    label: "Assigned developer",
    options: [
      ...DEVELOPERS.map((person) => ({
        value: person.id,
        label: person.name,
      })),
      { value: "unassigned", label: "Unassigned" },
    ],
  },
  {
    key: "reporterIds",
    label: "Tester",
    options: TESTERS.map((person) => ({
      value: person.id,
      label: person.name,
    })),
  },
  {
    key: "modules",
    label: "Module",
    options: MODULES.map((module) => ({ value: module, label: module })),
  },
  {
    key: "sprints",
    label: "Sprint",
    options: SPRINTS.map((sprint) => ({ value: sprint, label: sprint })),
  },
  {
    key: "environments",
    label: "Environment",
    options: ENVIRONMENTS.map((environment) => ({
      value: environment,
      label: ENVIRONMENT_LABELS[environment],
    })),
  },
];

/**
 * The project facet only appears while the board is unscoped: once a project is
 * active the switcher already answers that question.
 */
function useFacets(): Facet[] {
  const { activeProjectId, projects } = useBugBoard();
  return useMemo(() => {
    if (activeProjectId !== null) return BASE_FACETS;
    return [
      {
        key: "projectIds" as const,
        label: "Project",
        options: projects.map((project) => ({
          value: project.id,
          label: project.name,
        })),
      },
      ...BASE_FACETS,
    ];
  }, [activeProjectId, projects]);
}

function optionLabel(
  facets: Facet[],
  key: ArrayFilterKey,
  value: string
): string {
  const facet = facets.find((item) => item.key === key);
  return facet?.options.find((option) => option.value === value)?.label ?? value;
}

function toDateValue(msFromNow: number): string {
  const date = new Date(boardNowMs() + msFromNow);
  return date.toISOString().slice(0, 10);
}

const DATE_PRESETS: Array<{ label: string; days: number }> = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: SPRINT_DAYS },
  { label: "Last 30 days", days: 30 },
];

function DateRangeFilter() {
  const { filters, patchFilters } = useBugBoard();
  const active = Boolean(filters.createdFrom || filters.createdTo);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={active ? "secondary" : "outline"} size="sm">
          <CalendarRangeIcon data-icon="inline-start" aria-hidden="true" />
          {active
            ? `${filters.createdFrom ? formatDate(filters.createdFrom) : "Any"} – ${
                filters.createdTo ? formatDate(filters.createdTo) : "Any"
              }`
            : "Date range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Created between
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-created-from" className="text-xs">
                From
              </Label>
              <Input
                id="filter-created-from"
                type="date"
                value={filters.createdFrom}
                max={filters.createdTo || undefined}
                onChange={(event) =>
                  patchFilters({ createdFrom: event.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-created-to" className="text-xs">
                To
              </Label>
              <Input
                id="filter-created-to"
                type="date"
                value={filters.createdTo}
                min={filters.createdFrom || undefined}
                onChange={(event) =>
                  patchFilters({ createdTo: event.target.value })
                }
              />
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="xs"
                onClick={() =>
                  patchFilters({
                    createdFrom: toDateValue(-preset.days * 86_400_000),
                    createdTo: toDateValue(0),
                  })
                }
              >
                {preset.label}
              </Button>
            ))}
            {active ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => patchFilters({ createdFrom: "", createdTo: "" })}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ActiveChips() {
  const { filters, toggleFilterValue, patchFilters } = useBugBoard();
  const facets = useFacets();

  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (filters.bugIds.length > 0) {
    chips.push({
      key: "bugIds",
      label: `Shared hand-off: ${filters.bugIds.length} bug${
        filters.bugIds.length === 1 ? "" : "s"
      }`,
      onRemove: () => patchFilters({ bugIds: [] }),
    });
  }

  for (const facet of facets) {
    for (const value of filters[facet.key] as string[]) {
      chips.push({
        key: `${facet.key}:${value}`,
        label: `${facet.label}: ${optionLabel(facets, facet.key, value)}`,
        onRemove: () => toggleFilterValue(facet.key, value),
      });
    }
  }

  if (filters.createdFrom) {
    chips.push({
      key: "createdFrom",
      label: `Created from ${formatDate(filters.createdFrom)}`,
      onRemove: () => patchFilters({ createdFrom: "" }),
    });
  }
  if (filters.createdTo) {
    chips.push({
      key: "createdTo",
      label: `Created to ${formatDate(filters.createdTo)}`,
      onRemove: () => patchFilters({ createdTo: "" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="pr-1">
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Remove filter ${chip.label}`}
          >
            <XIcon className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export function FilterBar({ expanded }: { expanded: boolean }) {
  const {
    filters,
    filterCount,
    toggleFilterValue,
    clearFilterFacet,
    resetFilters,
    visibleBugs,
    scopedBugs,
  } = useBugBoard();
  const facets = useFacets();

  const hasFacets = filterCount > 0;

  if (!expanded && !hasFacets) return null;

  return (
    <div className="flex flex-col gap-2">
      {expanded ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {facets.map((facet) => (
            <MultiSelectFilter
              key={facet.key}
              label={facet.label}
              options={facet.options}
              selected={filters[facet.key] as string[]}
              onToggle={(value) => toggleFilterValue(facet.key, value)}
              onClear={() => clearFilterFacet(facet.key)}
            />
          ))}
          <DateRangeFilter />
          {hasFacets ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <FilterXIcon data-icon="inline-start" aria-hidden="true" />
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}

      {hasFacets ? (
        <div className="flex flex-wrap items-center gap-2">
          <ActiveChips />
          <span className="text-xs text-muted-foreground tabular-nums">
            {visibleBugs.length} of {scopedBugs.length} bugs match
          </span>
        </div>
      ) : null}
    </div>
  );
}
