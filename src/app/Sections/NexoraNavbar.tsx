import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = ["Home", "Pricing", "About", "Contact"];

export default function NexoraNavbar() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-20">
      <a
        href="#"
        className="inline-flex items-center gap-1.5 text-xl font-semibold tracking-tight text-foreground"
      >
        <Sparkles className="size-5 fill-foreground stroke-foreground" />
        Nexora
      </a>

      <ul className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      <Button className="h-10 rounded-full px-5">Get started</Button>
    </nav>
  );
}
