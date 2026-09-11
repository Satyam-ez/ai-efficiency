"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BugIcon, MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { id: "features", label: "Features" },
  { id: "product", label: "Product" },
  { id: "benefits", label: "Benefits" },
] as const;

/** Height of the floating bar, so anchors do not land underneath it. */
const NAV_OFFSET = 88;

export function NexoraNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlights whichever section currently owns the top of the viewport.
  //
  // Measured on scroll rather than with an IntersectionObserver: the observer
  // only fires when a threshold is crossed, so scrolling back up to the hero
  // left the last section highlighted with nothing to un-highlight it.
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const line = NAV_OFFSET + 24;
      let current = "";
      for (const link of LINKS) {
        const node = document.getElementById(link.id);
        if (node && node.getBoundingClientRect().top <= line) current = link.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // The body scroll lock keeps the page still behind the open mobile sheet.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /**
   * Scrolls with an offset for the floating bar.
   *
   * Done here rather than with a global `scroll-behavior: smooth`, which in
   * Next 16 is no longer overridden during route changes — every navigation in
   * the rest of the app would inherit it.
   */
  const goTo = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET,
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 py-2.5 transition-all duration-300 sm:px-4",
          scrolled
            ? "border border-border/70 bg-background/80 shadow-[0_8px_30px_-12px_rgb(0_0_0_/_0.18)] backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
            <BugIcon className="size-4" aria-hidden="true" />
          </span>
          Nexora
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => goTo(link.id)}
                aria-current={active === link.id ? "true" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === link.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" className="h-9 rounded-xl px-4">
            <Link href="/bug-board">Get started</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl md:hidden"
            aria-expanded={open}
            aria-controls="nexora-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((previous) => !previous)}
          >
            {open ? (
              <XIcon aria-hidden="true" />
            ) : (
              <MenuIcon aria-hidden="true" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        id="nexora-mobile-menu"
        hidden={!open}
        className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-2 shadow-lg backdrop-blur-xl md:hidden"
      >
        <ul className="flex flex-col">
          {LINKS.map((link, index) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  goTo(link.id);
                }}
                style={{ animationDelay: `${index * 50}ms` }}
                className="nx-menu-item w-full rounded-xl px-3 py-3 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
