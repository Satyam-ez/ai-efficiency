import type { Metadata } from "next";

import { NexoraLanding } from "@/components/nexora/landing-page";

export const metadata: Metadata = {
  title: "Nexora — The bug board built for both sides of the fix",
  description:
    "QA tracks what it has verified, engineering tracks what it has shipped — on the same bug. Evidence, threaded discussion and a server-written audit trail on every report.",
};

export default function HomePage() {
  return <NexoraLanding />;
}
