import { personName } from "@/lib/bug-board/data";
import { formatDate } from "@/lib/bug-board/format";
import {
  DEVELOPER_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  SEVERITY_LABELS,
  TESTER_STATUS_LABELS,
  type Bug,
} from "@/lib/bug-board/types";

const COLUMNS = [
  "Bug ID",
  "Project",
  "Title",
  "Module",
  "Component",
  "Severity",
  "Priority",
  "Tester",
  "Tester Status",
  "Developer Status",
  "Assigned Developer",
  "Environment",
  "Sprint",
  "Labels",
  "Attachments",
  "Created Date",
  "Updated Date",
] as const;

function escapeCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** `projectName` resolves the id, since projects can be created at runtime. */
export function bugsToCsv(
  bugs: Bug[],
  projectName: (projectId: string) => string
): string {
  const rows = bugs.map((bug) =>
    [
      bug.id,
      projectName(bug.projectId),
      bug.title,
      bug.module,
      bug.component,
      SEVERITY_LABELS[bug.severity],
      bug.priority,
      personName(bug.reporterId),
      TESTER_STATUS_LABELS[bug.testerStatus],
      DEVELOPER_STATUS_LABELS[bug.developerStatus],
      bug.assigneeId ? personName(bug.assigneeId) : "Unassigned",
      ENVIRONMENT_LABELS[bug.environment],
      bug.sprint,
      bug.labels.join(" "),
      String(bug.attachments.length),
      formatDate(bug.createdAt),
      formatDate(bug.updatedAt),
    ]
      .map(escapeCell)
      .join(",")
  );
  return [COLUMNS.join(","), ...rows].join("\n");
}

/**
 * A paste-ready hand-off note for chat or email: the project, the link that
 * reopens this exact set, then one line per bug in triage order.
 */
export function bugsToHandoffText(
  bugs: Bug[],
  { heading, link }: { heading: string; link: string }
): string {
  const lines = bugs.map(
    (bug) =>
      `• ${bug.id} · ${SEVERITY_LABELS[bug.severity]} · ${bug.priority} · ` +
      `${bug.module} — ${bug.title} (${DEVELOPER_STATUS_LABELS[bug.developerStatus]}` +
      `${bug.assigneeId ? `, ${personName(bug.assigneeId)}` : ", unassigned"})`
  );
  return [
    heading,
    `${bugs.length} bug${bugs.length === 1 ? "" : "s"} · open the board: ${link}`,
    "",
    ...lines,
  ].join("\n");
}

/** Triggers a client-side download without touching the network. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
