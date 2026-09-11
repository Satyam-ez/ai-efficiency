import Link from "next/link";
import { BugIcon } from "lucide-react";

const GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#product" },
      { label: "Benefits", href: "#benefits" },
    ],
  },
  {
    title: "App",
    links: [
      { label: "Bug board", href: "/bug-board" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Notes", href: "/notes" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
                <BugIcon className="size-4" aria-hidden="true" />
              </span>
              Nexora
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The bug board built for both sides of the fix — QA and engineering,
              tracking the same bug without tracking over each other.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
                  {group.title}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="rounded text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nexora
          </p>
        </div>
      </div>
    </footer>
  );
}
