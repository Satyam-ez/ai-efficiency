"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Reveals its children once, the first time they scroll into view.
 *
 * An IntersectionObserver plus a CSS transition rather than an animation
 * library: the page has a lot of these, and each costs one observer and one
 * compositor-only transition. It reveals once on purpose — content that
 * re-animates every time it scrolls past is noise, not polish.
 *
 * Reduced motion is handled entirely by the `motion-reduce:` variants below,
 * which pin the end state, so there is no second code path to keep in step.
 */
export function Reveal({
  children,
  className,
  /** Stagger, in ms. Keep it small — 60–90ms reads as one motion, not a queue. */
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  // A callback ref rather than useRef: it gives the effect a dependency to key
  // off, and one `HTMLElement` signature satisfies every tag `as` allows.
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!node || shown) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      // Fires a little before the element reaches the fold, so the motion has
      // finished by the time it is properly in view.
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, shown]);

  return (
    <Tag
      ref={setNode}
      data-shown={shown ? "" : undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "translate-y-4 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-shown:translate-y-0 data-shown:opacity-100",
        "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        className
      )}
    >
      {children}
    </Tag>
  );
}
