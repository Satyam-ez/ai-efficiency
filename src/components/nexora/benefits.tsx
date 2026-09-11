import type { LucideIcon } from "lucide-react";
import {
  ClockIcon,
  EyeIcon,
  LayersIcon,
  ScaleIcon,
  ZapIcon,
} from "lucide-react";

import { Reveal } from "@/components/nexora/reveal";
import { SectionHeading } from "@/components/nexora/section-heading";

const BENEFITS: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
  /** The specific thing in the product that delivers it. */
  because: string;
}> = [
  {
    icon: ClockIcon,
    title: "Stop re-asking for the details",
    body: "The report already carries the steps, the environment and the recording, so the first reply is a fix and not a question.",
    because: "Structured fields + evidence",
  },
  {
    icon: EyeIcon,
    title: "Know where a bug really stands",
    body: "Fixed and verified are different claims, made by different people. Two tracks mean the board never pretends they are the same.",
    because: "Dual status tracks",
  },
  {
    icon: LayersIcon,
    title: "Give everyone one place to look",
    body: "Evidence, discussion, decisions and history live on the bug — not spread across chat threads, drives and screenshots in DMs.",
    because: "Attachments, threads, activity",
  },
  {
    icon: ZapIcon,
    title: "Move forty bugs as fast as one",
    body: "Close a sprint's worth, reassign a departing developer's queue, or move a whole module to another project in one action.",
    because: "Bulk actions",
  },
  {
    icon: ScaleIcon,
    title: "Settle what happened, from the record",
    body: "Who reopened it, when it was reassigned, what the status was before — recorded by the server that applied the change.",
    because: "Server-written audit trail",
  },
];

export function Benefits() {
  return (
    <section
      id="benefits"
      className="scroll-mt-24 border-t border-border/60 bg-muted/25 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why teams use it"
          title="Less chasing. More fixing."
          description="Every one of these comes from something concrete in the product, not from a promise."
        />

        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <Reveal
              as="li"
              key={benefit.title}
              delay={(index % 3) * 80}
              className={index === 0 ? "lg:col-span-2" : undefined}
            >
              <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_18px_40px_-28px_rgb(0_0_0_/_0.4)]">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
                  <benefit.icon className="size-4.5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-balance">
                  {benefit.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {benefit.body}
                </p>
                <span className="mt-4 inline-flex w-fit items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {benefit.because}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
