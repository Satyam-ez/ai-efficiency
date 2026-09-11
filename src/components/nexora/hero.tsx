import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import {
  BoardPreview,
  CriticalCallout,
  HandoffCallout,
} from "@/components/nexora/board-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROOF = [
  "Evidence on every report",
  "Audit trail, written server-side",
  "Hand off with one link",
];

export function Hero({ displayFont }: { displayFont?: string }) {
  return (
    <section className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:pt-36 lg:pb-24">
      {/* Backdrop: masked grid under a soft brand field. Both decorative.
          Kept at z-0 rather than a negative z-index, which would drop it behind
          the page wrapper's opaque background and paint it out entirely. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="nx-hero-bg absolute inset-0" />
        <div className="nx-grid absolute inset-x-0 top-0 h-[38rem] opacity-70" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <span className="nx-rise nx-rise-1 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-[var(--brand)]" />
            Bug tracking built around QA, not bolted onto it
          </span>

          <h1
            className={cn(
              "nx-rise nx-rise-2 mt-6 max-w-4xl text-balance text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem]",
              displayFont
            )}
          >
            The bug board built for{" "}
            <em className={cn("italic text-[var(--brand)]", displayFont)}>
              both
            </em>{" "}
            sides of the fix
          </h1>

          <p className="nx-rise nx-rise-3 mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Testers track what they have reproduced and verified. Developers
            track what they have picked up and shipped. Same bug, two status
            tracks — so nobody has to ask where it actually stands.
          </p>

          <div className="nx-rise nx-rise-4 mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-12 w-full rounded-xl px-6 text-[15px] sm:w-auto"
            >
              <Link href="/bug-board">
                Get started
                <ArrowRightIcon
                  data-icon="inline-end"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl border-border bg-background/70 px-6 text-[15px] backdrop-blur hover:bg-background sm:w-auto"
            >
              <a href="#features">Explore features</a>
            </Button>
          </div>

          <ul className="nx-rise nx-rise-4 mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {PROOF.map((item) => (
              <li
                key={item}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <CheckIcon
                  className="size-3.5 text-[var(--brand)]"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Product preview */}
        <div className="nx-rise nx-rise-5 relative mx-auto mt-14 max-w-5xl lg:mt-20 lg:mb-12">
          <BoardPreview />

          {/* Callouts sit clear of the frame — above its top edge and below its
              bottom edge — so they annotate the screenshot instead of covering
              the rows they are pointing at. Hidden on narrow screens, where
              there is no room to place them without overlapping. */}
          <div className="nx-float pointer-events-none absolute -top-12 left-2 hidden lg:block">
            <CriticalCallout />
          </div>
          <div className="nx-float-slow pointer-events-none absolute -bottom-12 right-2 hidden lg:block">
            <HandoffCallout />
          </div>
        </div>
      </div>
    </section>
  );
}
