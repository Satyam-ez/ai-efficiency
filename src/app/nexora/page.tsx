import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

import NexoraHero from "@/app/Sections/NexoraHero";
import NexoraNavbar from "@/app/Sections/NexoraNavbar";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora - Smarter Automation",
  description:
    "Automate busywork with intelligent agents that learn, adapt, and execute.",
};

export default function NexoraPage() {
  return (
    <main className={`${inter.className} flex min-h-screen flex-col bg-background`}>
      <NexoraNavbar />
      <NexoraHero displayFontClassName={instrumentSerif.className} />
    </main>
  );
}
