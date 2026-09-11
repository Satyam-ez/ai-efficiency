import Link from "next/link";
import { ArrowRightIcon, BugIcon } from "lucide-react";

import { Reveal } from "@/components/nexora/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta({ displayFont }: { displayFont?: string }) {
  return (
    <section className="border-t border-border/60 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-[var(--brand)] px-6 py-14 text-center sm:px-12 lg:py-20">
            {/* Decorative wash, kept well under the text contrast. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(40rem 20rem at 50% -10%, rgb(255 255 255 / 0.18), transparent 65%)",
              }}
            />

            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                <BugIcon className="size-5" aria-hidden="true" />
              </span>

              <h2
                className={cn(
                  "mt-6 text-balance text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]",
                  displayFont
                )}
              >
                Put your next bug somewhere it cannot get lost
              </h2>

              <p className="mt-4 text-pretty text-base leading-relaxed text-white/75">
                The board is seeded and ready. Sign in, open a project, and file
                one — the whole loop takes a minute to see.
              </p>

              <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group h-12 w-full rounded-xl bg-white px-6 text-[15px] text-[var(--brand)] hover:bg-white/90 sm:w-auto"
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
                  variant="ghost"
                  className="h-12 w-full rounded-xl px-6 text-[15px] text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <a href="#product">See the product</a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
