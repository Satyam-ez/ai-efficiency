import { Reveal } from "@/components/nexora/reveal";
import { SectionHeading } from "@/components/nexora/section-heading";

const STEPS = [
  {
    title: "Open a project",
    body: "One bucket per product or QA workstream. Every bug files into exactly one, so a board never becomes everyone's inbox.",
  },
  {
    title: "File it with proof",
    body: "Steps, expected and actual result, environment and device — plus the screenshot, recording or log that shows it. The bug gets a readable id like BUG-1042.",
  },
  {
    title: "Hand it to engineering",
    body: "Assign it, or share a scoped link. The developer picks it up, moves their own status track, and answers in the thread.",
  },
  {
    title: "Verify and close",
    body: "QA moves the tester track to verified or reopens it. Either way the server writes the entry, so the history matches what actually happened.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border/60 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, and the loop closes itself"
          description="No configuration project, no workflow builder. The workflow is already the one QA teams use."
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 90}>
              <div className="group relative h-full rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_18px_40px_-28px_rgb(0_0_0_/_0.4)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-xl border border-border bg-muted font-mono text-[13px] font-semibold transition-colors duration-300 group-hover:border-transparent group-hover:bg-[var(--brand)] group-hover:text-white">
                    {index + 1}
                  </span>
                  {/* The connector, on wide screens only. */}
                  {index < STEPS.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent lg:block"
                    />
                  ) : null}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
