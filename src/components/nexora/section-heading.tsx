import { Reveal } from "@/components/nexora/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={70}>
        <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={140}>
          <p
            className={cn(
              "mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
