import { Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import NexoraDashboardPreview from "./NexoraDashboardPreview";

type NexoraHeroProps = {
  displayFontClassName?: string;
};

export default function NexoraHero({ displayFontClassName }: NexoraHeroProps) {
  return (
    <section className="relative flex flex-1 overflow-hidden px-5 pb-8 sm:px-8 lg:px-20">
      <div className="nexora-video-fallback absolute inset-0 z-0">
        <video
          autoPlay
          className="size-full object-cover"
          loop
          muted
          playsInline
          preload="auto"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/5 to-background/20" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-6xl flex-col items-center pt-2">
        <div className="nexora-anim-badge mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]">
          <span>Now with GPT-5 support</span>
          <Sparkles className="size-3.5 text-indigo-500" />
        </div>

        <h1
          className={cn(
            "nexora-anim-headline max-w-3xl text-center text-5xl leading-[0.95] tracking-normal text-foreground sm:text-6xl lg:text-[5rem]",
            displayFontClassName,
          )}
        >
          The Future of{" "}
          <em className={cn("italic", displayFontClassName)}>Smarter</em>{" "}
          Automation
        </h1>

        <p className="nexora-anim-sub mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
          Automate your busywork with intelligent agents that learn, adapt, and
          execute, so your team can focus on what matters most.
        </p>

        <div className="nexora-anim-ctas mt-5 flex items-center gap-3">
          <Button className="h-12 rounded-full px-6">Book a demo</Button>
          <Button
            aria-label="Play overview"
            className="size-11 rounded-full bg-background text-foreground shadow-[0_2px_12px_rgb(0_0_0_/_0.08)] hover:bg-background/80"
            size="icon"
            variant="ghost"
          >
            <Play className="size-4 fill-current" />
          </Button>
        </div>

        <div className="nexora-anim-dashboard mt-8 w-full max-w-5xl">
          <NexoraDashboardPreview />
        </div>
      </div>
    </section>
  );
}
