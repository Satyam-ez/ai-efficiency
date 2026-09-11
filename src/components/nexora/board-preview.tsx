import {
  CircleDashedIcon,
  EyeIcon,
  LoaderIcon,
  PaperclipIcon,
  SearchIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A scaled-down replica of the real board, not a generic dashboard drawing.
 *
 * It uses the product's own language — the deep green table header, the two
 * status columns, severity and priority chips — so the promise the hero makes
 * is the screen the user actually lands on.
 */

type Row = {
  id: string;
  title: string;
  module: string;
  component: string;
  severity: "Critical" | "Medium" | "Low";
  priority: "P0" | "P2" | "P3";
  tester: { initials: string; name: string };
  testerStatus: "Open" | "Under Review" | "Reopened";
  devStatus: "Backlog" | "In Progress" | "Ready for QA";
  assignee: { initials: string; name: string } | null;
  attachments?: number;
};

const ROWS: Row[] = [
  {
    id: "BUG-1042",
    title: "SSO login loops back to sign-in after Okta redirect",
    module: "Authentication",
    component: "SSO Provider",
    severity: "Critical",
    priority: "P0",
    tester: { initials: "IR", name: "Ishita" },
    testerStatus: "Reopened",
    devStatus: "In Progress",
    assignee: { initials: "AM", name: "Aarav" },
    attachments: 3,
  },
  {
    id: "BUG-1041",
    title: "Invoice PDF totals ignore multi-currency tax rounding",
    module: "Billing",
    component: "Invoice PDF",
    severity: "Critical",
    priority: "P0",
    tester: { initials: "TA", name: "Tomás" },
    testerStatus: "Under Review",
    devStatus: "Ready for QA",
    assignee: { initials: "SR", name: "Sofia" },
    attachments: 2,
  },
  {
    id: "BUG-1032",
    title: "Onboarding wizard loses progress when resized",
    module: "Onboarding",
    component: "Setup Wizard",
    severity: "Medium",
    priority: "P2",
    tester: { initials: "NB", name: "Noah" },
    testerStatus: "Open",
    devStatus: "Backlog",
    assignee: null,
  },
  {
    id: "BUG-1026",
    title: "Search highlights ignore diacritics for Latin scripts",
    module: "Search",
    component: "Query Parser",
    severity: "Low",
    priority: "P3",
    tester: { initials: "TA", name: "Tomás" },
    testerStatus: "Open",
    devStatus: "Backlog",
    assignee: null,
  },
];

const SEVERITY_STYLES: Record<Row["severity"], string> = {
  Critical: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-border bg-muted text-muted-foreground",
};

const DEV_STATUS_ICON = {
  Backlog: CircleDashedIcon,
  "In Progress": LoaderIcon,
  "Ready for QA": EyeIcon,
} as const;

function Avatar({ initials, muted }: { initials: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[8px] font-semibold",
        muted ? "bg-muted text-muted-foreground" : "bg-secondary text-foreground"
      )}
    >
      {initials}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-2.5 py-2">
      <p className="text-[8px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base leading-none font-semibold tabular-nums",
          accent && "text-red-600"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[8px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function BoardPreview({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="The Nexora bug board: a filterable table of bugs with separate tester and developer status columns, severity and priority chips, and summary tiles above it."
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_70px_-28px_rgb(0_0_0_/_0.35)]",
        className
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border/80 bg-muted/50 px-3 py-2">
        <div className="flex gap-1">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
        </div>
        <div className="ml-1 flex flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 py-1">
          <SearchIcon className="size-2.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-[9px] text-muted-foreground">
            Atlas Web App · 22 open
          </span>
        </div>
        <span className="hidden rounded-md bg-[var(--brand)] px-2 py-1 text-[9px] font-medium text-white sm:block">
          Create Bug
        </span>
      </div>

      <div className="space-y-2.5 p-2.5">
        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <SummaryTile label="Total" value="26" hint="Across 4 projects" />
          <SummaryTile label="Open" value="22" hint="4 unassigned" />
          <SummaryTile label="Critical" value="4" accent hint="3 on production" />
          <SummaryTile label="Ready for QA" value="4" hint="Oldest waiting 3d" />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border/80">
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 bg-[var(--table-header)] px-2.5 py-1.5 text-[8px] font-semibold tracking-wide text-[var(--table-header-foreground)] uppercase">
            <span>Bug</span>
            <div className="flex items-center gap-2">
              <span className="w-14 text-left sm:w-24">Tester</span>
              <span className="w-16 text-left sm:w-28">Developer</span>
            </div>
          </div>

          <ul className="divide-y divide-border/70">
            {ROWS.map((row) => {
              const DevIcon = DEV_STATUS_ICON[row.devStatus];
              return (
                <li
                  key={row.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 bg-card px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {row.id}
                      </span>
                      <span
                        className={cn(
                          "rounded border px-1 text-[8px] font-medium",
                          SEVERITY_STYLES[row.severity]
                        )}
                      >
                        {row.severity}
                      </span>
                      <span className="rounded bg-foreground px-1 text-[8px] font-medium text-background">
                        {row.priority}
                      </span>
                      {row.attachments ? (
                        <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                          <PaperclipIcon className="size-2" aria-hidden="true" />
                          {row.attachments}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-foreground">
                      {row.title}
                    </p>
                    <p className="truncate text-[8px] text-muted-foreground">
                      {row.module} · {row.component}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tester track */}
                    <div className="flex w-14 items-center gap-1 sm:w-24">
                      <Avatar initials={row.tester.initials} />
                      <span className="truncate text-[8px] text-muted-foreground">
                        {row.testerStatus}
                      </span>
                    </div>
                    {/* Developer track */}
                    <div className="flex w-16 items-center gap-1 sm:w-28">
                      {row.assignee ? (
                        <Avatar initials={row.assignee.initials} />
                      ) : (
                        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                          <UserIcon className="size-2" aria-hidden="true" />
                        </span>
                      )}
                      <span className="flex min-w-0 items-center gap-0.5 text-[8px] text-muted-foreground">
                        <DevIcon className="size-2 shrink-0" aria-hidden="true" />
                        <span className="truncate">{row.devStatus}</span>
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* One slow light pass, so the mockup reads as a live screen. */}
      <div className="nx-sweep pointer-events-none absolute inset-0 overflow-hidden" />
    </div>
  );
}

/** The floating "critical" callout that sits over the hero mockup. */
export function CriticalCallout() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      <span className="relative flex size-2 shrink-0 text-red-500">
        <span className="nx-ping absolute inset-0 rounded-full" />
        <span className="relative size-2 rounded-full bg-red-500" />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold">Critical on production</p>
        <p className="text-[10px] text-muted-foreground">
          Reopened · assigned in one click
        </p>
      </div>
    </div>
  );
}

/** The floating "handoff" callout that sits over the hero mockup. */
export function HandoffCallout() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
        <TriangleAlertIcon className="size-3" aria-hidden="true" />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold">12 bugs handed off</p>
        <p className="text-[10px] text-muted-foreground">One link, scoped to Aarav</p>
      </div>
    </div>
  );
}
