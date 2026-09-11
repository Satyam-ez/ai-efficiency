import { CheckIcon, CopyIcon, LinkIcon, XIcon } from "lucide-react";

import { Reveal } from "@/components/nexora/reveal";
import { SectionHeading } from "@/components/nexora/section-heading";
import { cn } from "@/lib/utils";

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-34px_rgb(0_0_0_/_0.4)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function Row({
  children,
  reverse,
  eyebrow,
  title,
  body,
  points,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <Reveal className={cn(reverse && "lg:order-2")}>
        <div>
          <span className="text-[11px] font-medium tracking-wide text-[var(--brand)] uppercase">
            {eyebrow}
          </span>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h3>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {body}
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                  <CheckIcon className="size-2.5" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={110} className={cn(reverse && "lg:order-1")}>
        {children}
      </Reveal>
    </div>
  );
}

/** Mockup: the filter row with facets applied. */
function TriageMockup() {
  const facets = [
    { label: "Severity", value: "Critical, High", count: 2 },
    { label: "Tester status", value: "Open, Reopened", count: 2 },
    { label: "Environment", value: "Production", count: 1 },
    { label: "Assignee", value: "Unassigned", count: 1 },
  ];

  return (
    <Frame>
      <div className="border-b border-border/80 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium">Filters</span>
          <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[9px] font-medium text-white">
            6 active
          </span>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {facets.map((facet) => (
          <div
            key={facet.label}
            className="flex items-center justify-between rounded-lg border border-border/80 bg-background px-2.5 py-2"
          >
            <span className="text-[10px] text-muted-foreground">
              {facet.label}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium">{facet.value}</span>
              <span className="flex size-3.5 items-center justify-center rounded-full bg-muted text-[8px] text-muted-foreground">
                {facet.count}
              </span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-2.5 py-2">
          <span className="text-[10px] text-muted-foreground">Created</span>
          <span className="font-mono text-[10px]">01 Aug → 07 Aug</span>
        </div>
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[10px] text-muted-foreground">
            Showing <span className="font-medium text-foreground">7</span> of 26
          </span>
          <span className="text-[10px] text-[var(--brand)]">Reset</span>
        </div>
      </div>
    </Frame>
  );
}

/** Mockup: the details drawer, on its evidence tab. */
function DrawerMockup() {
  return (
    <Frame>
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            BUG-1042
          </span>
          <span className="rounded border border-red-200 bg-red-50 px-1.5 text-[9px] font-medium text-red-700">
            Critical
          </span>
          <span className="rounded bg-foreground px-1.5 text-[9px] font-medium text-background">
            P0
          </span>
        </div>
        <XIcon className="size-3 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="px-4 pt-3">
        <p className="text-[13px] font-semibold">
          SSO login loops back to sign-in after Okta redirect
        </p>
        <div className="mt-2.5 flex gap-4 border-b border-border/80">
          {[
            { label: "Details", active: true },
            { label: "Activity", badge: "12" },
            { label: "Comments", badge: "4" },
          ].map((tab) => (
            <span
              key={tab.label}
              className={cn(
                "flex items-center gap-1 pb-2 text-[11px]",
                tab.active
                  ? "border-b-2 border-foreground font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
              {tab.badge ? (
                <span className="rounded bg-muted px-1 text-[8px]">
                  {tab.badge}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 p-4">
        <div>
          <p className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
            Steps to reproduce
          </p>
          <ol className="mt-1.5 space-y-1">
            {[
              "Open the app with tenant slug northwind, choose Continue with SSO.",
              "Authenticate against Okta with a valid enterprise account.",
              "Observe the return to sign-in instead of the dashboard.",
            ].map((step, index) => (
              <li key={step} className="flex gap-1.5 text-[10px] leading-relaxed">
                <span className="font-mono text-muted-foreground">
                  {index + 1}.
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
            Evidence
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {["Screenshot", "Recording", "HAR log"].map((label) => (
              <div
                key={label}
                className="flex h-12 flex-col items-center justify-center rounded-md border border-border/80 bg-muted/50 text-[8px] text-muted-foreground"
              >
                <span className="mb-0.5 h-3 w-7 rounded-sm bg-border" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border/70 pt-2.5">
          {[
            ["Environment", "Production"],
            ["Browser", "Chrome 141"],
            ["Reporter", "Ishita Rao"],
            ["Assignee", "Aarav Mehta"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[9px] text-muted-foreground">{label}</p>
              <p className="text-[10px] font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Mockup: the share / hand-off dialog. */
function HandoffMockup() {
  return (
    <Frame>
      <div className="border-b border-border/80 px-4 py-2.5">
        <p className="text-[12px] font-semibold">Share with a developer</p>
        <p className="text-[10px] text-muted-foreground">
          They open the board already scoped to their slice.
        </p>
      </div>
      <div className="space-y-2.5 p-3">
        <div className="flex items-center justify-between rounded-lg border border-border/80 bg-background px-2.5 py-2">
          <span className="text-[10px] text-muted-foreground">Assignee</span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-full bg-secondary text-[7px] font-semibold">
              AM
            </span>
            <span className="text-[10px] font-medium">Aarav Mehta</span>
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/80 bg-background px-2.5 py-2">
          <span className="text-[10px] text-muted-foreground">Open bugs only</span>
          <span className="flex h-4 w-7 items-center rounded-full bg-[var(--brand)] px-0.5">
            <span className="ml-auto size-3 rounded-full bg-white" />
          </span>
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/40 p-2.5">
          <div className="flex items-center gap-1.5">
            <LinkIcon className="size-2.5 text-muted-foreground" aria-hidden="true" />
            <span className="truncate font-mono text-[9px] text-muted-foreground">
              /bug-board?project=atlas&amp;assignee=aarav&amp;open=1
            </span>
            <CopyIcon className="ml-auto size-2.5 shrink-0" aria-hidden="true" />
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">12 bugs</span> in this
            hand-off
          </span>
          <span className="rounded-md bg-[var(--brand)] px-2.5 py-1 text-[9px] font-medium text-white">
            Copy link
          </span>
        </div>
      </div>
    </Frame>
  );
}

export function Showcase() {
  return (
    <section
      id="product"
      className="scroll-mt-24 border-t border-border/60 bg-muted/25 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Product"
          title="See how a bug moves through it"
          description="From the moment a tester files it, to the hand-off that puts it on a developer's screen, to the trail that proves what happened."
        />

        <div className="mt-16 flex flex-col gap-20 lg:gap-28">
          <Row
            eyebrow="Triage"
            title="Find the seven bugs that actually matter today"
            body="The board holds every bug across every project. Stack filters until it holds only the ones worth your morning, then sort by the workflow order that matters — critical first, blocked first — not alphabetically."
            points={[
              "Search across id, title, module, component, sprint, people and labels",
              "Filters stack, and the summary tiles above recount as you narrow",
              "Sort by severity, priority, either status, attachments or age",
            ]}
          >
            <TriageMockup />
          </Row>

          <Row
            reverse
            eyebrow="The bug itself"
            title="Everything about one bug, on one screen"
            body="Steps, environment, the evidence the tester captured, the thread where it was worked out, and the full history — as tabs on a single drawer, opened straight from the row."
            points={[
              "Steps, expected and actual result, captured as structured fields",
              "Screenshots and recordings open in a preview, arrow keys to move",
              "Activity and comment counts sit on the tabs, so nothing hides",
            ]}
          >
            <DrawerMockup />
          </Row>

          <Row
            eyebrow="Hand-off"
            title="Give a developer their slice, not your whole board"
            body="Pick the person, decide whether to include what is already closed, and send one link. Pin exact bug ids and the list can never drift; leave it live and it stays current as the sprint moves."
            points={[
              "Scope by project, assignee, open-only, or an explicit list of ids",
              "The link reopens the board exactly as it was handed over",
              "Or export the same rows to CSV, seventeen columns wide",
            ]}
          >
            <HandoffMockup />
          </Row>
        </div>
      </div>
    </section>
  );
}
