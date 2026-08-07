import type { Metadata } from "next";

import { Workspace } from "@/components/todo-notes/workspace";

export const metadata: Metadata = {
  title: "Notes & Tasks",
  description:
    "A local-first notepad and todo list where notes can be attached to tasks.",
};

export default function NotesPage() {
  return (
    <main className="min-h-dvh bg-muted/30">
      <Workspace />
    </main>
  );
}
