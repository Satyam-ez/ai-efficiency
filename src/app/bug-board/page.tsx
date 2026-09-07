import type { Metadata } from "next";

import { BugBoard } from "@/components/bug-board/bug-board";

export const metadata: Metadata = {
  title: "Bug Board",
  description:
    "Track, assign, reproduce, and resolve product issues collaboratively.",
};

export default function BugBoardPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-muted/30">
      <BugBoard />
    </main>
  );
}
