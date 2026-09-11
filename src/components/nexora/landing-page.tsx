import { Instrument_Serif, Inter } from "next/font/google";

import { Benefits } from "@/components/nexora/benefits";
import { Capabilities } from "@/components/nexora/capabilities";
import { FinalCta } from "@/components/nexora/cta";
import { Features } from "@/components/nexora/features";
import { Footer } from "@/components/nexora/footer";
import { Hero } from "@/components/nexora/hero";
import { HowItWorks } from "@/components/nexora/how-it-works";
import { NexoraNav } from "@/components/nexora/nav";
import { Showcase } from "@/components/nexora/showcase";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  subsets: ["latin"],
});

/**
 * The whole marketing page, in one component.
 *
 * It lives here rather than in the route file so the page has exactly one
 * definition — `/` renders it, and `/nexora` redirects to `/` (see
 * next.config.ts), so the two can never drift apart.
 */
export function NexoraLanding() {
  return (
    <div className={`${inter.className} flex min-h-dvh flex-col bg-background`}>
      <NexoraNav />
      <main className="flex-1">
        <Hero displayFont={instrumentSerif.className} />
        <Capabilities />
        <Features />
        <Showcase />
        <HowItWorks />
        <Benefits />
        <FinalCta displayFont={instrumentSerif.className} />
      </main>
      <Footer />
    </div>
  );
}
