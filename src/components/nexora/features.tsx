import type { LucideIcon } from "lucide-react";
import {
  CommandIcon,
  FileDownIcon,
  FilterIcon,
  FolderKanbanIcon,
  HistoryIcon,
  Link2Icon,
  ListChecksIcon,
  MessageSquareCodeIcon,
  PaperclipIcon,
  SplitIcon,
} from "lucide-react";

import { Reveal } from "@/components/nexora/reveal";
import { SectionHeading } from "@/components/nexora/section-heading";
import { cn } from "@/lib/utils";

/** The smaller cards: one line each, no visual. */
const SUPPORTING: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: FilterIcon,
    title: "Fourteen ways to narrow it",
    body: "Project, status on either side, severity, priority, assignee, reporter, module, sprint, environment, date range — stack them, then hand the result over.",
  },
  {
    icon: ListChecksIcon,
    title: "Bulk actions, one request",
    body: "Select forty rows and close them, reassign them, or move them to another project in a single action — with an activity entry written for each.",
  },
  {
    icon: FolderKanbanIcon,
    title: "A board per workstream",
    body: "Every bug belongs to one project, so a developer opens the slice they own instead of every tester's output at once.",
  },
  {
    icon: FileDownIcon,
    title: "Export what you filtered",
    body: "Seventeen columns of the current view as CSV — the same rows on screen, ready for a report or a spreadsheet.",
  },
  {
    icon: CommandIcon,
    title: "Built for the keyboard",
    body: "Nine shortcuts covering create, search, filter, export, share and save, so triage never needs the mouse.",
  },
  {
    icon: Link2Icon,
    title: "Hand-off links that hold",
    body: "Share a scoped link and the list cannot drift: pin exact bug ids, or keep it live and filtered to one developer.",
  },
];

function SpotlightCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  children,
  className,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_20px_50px_-30px_rgb(0_0_0_/_0.4)]",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight text-balance">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>

      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}

/** The dual-track visual: the same bug, two independent status columns. */
function DualTrackVisual() {
  const tester = ["Open", "Under Review", "Verified", "Reopened", "Closed"];
  const developer = [
    "Backlog",
    "Assigned",
    "In Progress",
    "Ready for QA",
    "Fixed",
    "Blocked",
  ];

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
      <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          BUG-1042
        </span>
        <span className="truncate text-[11px] font-medium">
          SSO login loops back to sign-in
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Tester track", items: tester, activeIndex: 3 },
          { label: "Developer track", items: developer, activeIndex: 2 },
        ].map((track) => (
          <div key={track.label}>
            <p className="mb-1.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
              {track.label}
            </p>
            <ul className="flex flex-col gap-1">
              {track.items.map((item, index) => (
                <li
                  key={item}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] transition-colors",
                    index === track.activeIndex
                      ? "bg-[var(--brand)] font-medium text-white"
                      : "bg-card text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      index === track.activeIndex ? "bg-white" : "bg-border"
                    )}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The evidence visual: the seven file kinds a report can carry. */
function EvidenceVisual() {
  const files = [
    { name: "sso-redirect-loop.png", kind: "Image", size: "476 KB" },
    { name: "screen-recording.mp4", kind: "Recording", size: "8.2 MB" },
    { name: "gateway-trace.log", kind: "Log file", size: "58 KB" },
  ];

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
      <ul className="flex flex-col gap-1.5">
        {files.map((file, index) => (
          <li
            key={file.name}
            className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-card px-2.5 py-2 transition-transform duration-300 group-hover:translate-x-0.5"
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <PaperclipIcon className="size-3" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium">
                {file.name}
              </span>
              <span className="block text-[9px] text-muted-foreground">
                {file.kind} · {file.size}
              </span>
            </span>
            <span className="rounded-full bg-[var(--brand)]/10 px-1.5 py-0.5 text-[8px] font-medium text-[var(--brand)]">
              Ready
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[10px] text-muted-foreground">
        Images, video, screen recordings, PDFs, archives and logs — attached to
        the bug, or posted inside a comment.
      </p>
    </div>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-border/60 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Features"
          title="Everything a bug needs to get fixed, in one place"
          description="A bug report is only useful if it carries proof, a clear owner, and a history nobody can quietly rewrite. Nexora is built around those three things."
        />

        {/* Two spotlights */}
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <SpotlightCard
              icon={SplitIcon}
              eyebrow="The core idea"
              title="Two status tracks on the same bug"
              body="Most trackers give a bug one status, so QA and engineering end up fighting over it. Here each side owns its own column, and the board shows both at once."
            >
              <DualTrackVisual />
            </SpotlightCard>
          </Reveal>

          <Reveal delay={90}>
            <SpotlightCard
              icon={PaperclipIcon}
              eyebrow="Evidence first"
              title="Proof travels with the report"
              body="Screenshots, screen recordings and logs attach to the bug itself — so the developer who picks it up sees exactly what the tester saw, without asking."
            >
              <EvidenceVisual />
            </SpotlightCard>
          </Reveal>
        </div>

        {/* Two mid cards */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <SpotlightCard
              icon={MessageSquareCodeIcon}
              eyebrow="Collaboration"
              title="Threads that hold the actual fix"
              body="Reply inline, paste a stack trace as a code block, react to settle a question without adding noise, and mention the person who needs to see it."
            >
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <div className="rounded-lg border border-border/70 bg-card p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-4 items-center justify-center rounded-full bg-secondary text-[7px] font-semibold">
                      AM
                    </span>
                    <span className="text-[10px] font-medium">Aarav Mehta</span>
                    <span className="rounded border border-border px-1 text-[8px] text-muted-foreground">
                      Developer
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                    Reproduced on staging. The cookie domain is set from the
                    request host instead of the configured root.
                  </p>
                  <pre className="mt-1.5 overflow-hidden rounded-md bg-muted px-2 py-1.5 font-mono text-[8px] leading-relaxed text-foreground">
                    <code>{`domain: request.headers.host,
// wrong: includes the subdomain`}</code>
                  </pre>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="rounded-full border border-border bg-card px-1.5 py-0.5 text-[9px]">
                      👀 2
                    </span>
                    <span className="rounded-full border border-border bg-card px-1.5 py-0.5 text-[9px]">
                      👍 1
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 ml-5 rounded-lg border border-border/70 bg-card px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-4 items-center justify-center rounded-full bg-secondary text-[7px] font-semibold">
                      IR
                    </span>
                    <span className="text-[10px] font-medium">Ishita Rao</span>
                    <span className="rounded border border-border px-1 text-[8px] text-muted-foreground">
                      Tester
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    That matches the HAR file — Set-Cookie uses the tenant host.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal delay={90}>
            <SpotlightCard
              icon={HistoryIcon}
              eyebrow="Accountability"
              title="A history nobody can forge"
              body="Every status change, reassignment and upload is recorded by the server that applied it — not by the client that asked. Thirteen kinds of entry, with what changed and who changed it."
            >
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <ul className="flex flex-col gap-2">
                  {[
                    {
                      who: "IR",
                      what: "reported this bug",
                      when: "04 Aug",
                      from: null,
                    },
                    {
                      who: "AM",
                      what: "changed developer status",
                      when: "05 Aug",
                      from: "Assigned → In Progress",
                    },
                    {
                      who: "IR",
                      what: "changed tester status",
                      when: "06 Aug",
                      from: "Verified → Reopened",
                    },
                  ].map((entry) => (
                    <li key={entry.what} className="flex items-start gap-2">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[7px] font-semibold">
                        {entry.who}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] text-foreground">
                          {entry.what}
                        </span>
                        {entry.from ? (
                          <span className="block font-mono text-[9px] text-muted-foreground">
                            {entry.from}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {entry.when}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>

        {/* Supporting grid */}
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTING.map((feature, index) => (
            <Reveal as="li" key={feature.title} delay={(index % 3) * 80}>
              <div className="group h-full rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_18px_40px_-28px_rgb(0_0_0_/_0.4)]">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground transition-colors duration-300 group-hover:bg-[var(--brand)] group-hover:text-white">
                  <feature.icon className="size-4.5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
