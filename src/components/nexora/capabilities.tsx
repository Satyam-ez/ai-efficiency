import { Reveal } from "@/components/nexora/reveal";

/**
 * A neutral trust strip.
 *
 * These are capabilities of the product, each verifiable in the app itself —
 * deliberately not usage statistics, customer counts or testimonials, which
 * would have to be invented.
 */
const FACTS = [
  { value: "2", label: "status tracks", hint: "QA and engineering, separately" },
  { value: "7", label: "evidence types", hint: "Images, video, logs, PDFs, archives" },
  { value: "14", label: "filters", hint: "Stackable, with live counts" },
  { value: "13", label: "activity kinds", hint: "Every change, attributed" },
  { value: "9", label: "shortcuts", hint: "Triage without the mouse" },
];

export function Capabilities() {
  return (
    <section className="border-t border-border/60 px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
            What is in the box
          </p>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {FACTS.map((fact, index) => (
            <Reveal as="li" key={fact.label} delay={index * 70}>
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  {fact.value}
                </span>
                <span className="mt-1 text-sm font-medium text-foreground">
                  {fact.label}
                </span>
                <span className="mt-1 text-xs leading-snug text-muted-foreground">
                  {fact.hint}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
