import { CalendarDaysIcon, CircleDotIcon, FlagIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate, isDueToday, isOverdue } from "@/lib/todo-notes/date";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Priority,
  type TodoStatus,
} from "@/lib/todo-notes/types";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  medium: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  high: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="ghost" className={cn("gap-1", PRIORITY_STYLES[priority])}>
      <FlagIcon aria-hidden="true" />
      <span className="sr-only">Priority: </span>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const STATUS_STYLES: Record<TodoStatus, string> = {
  todo: "text-muted-foreground",
  "in-progress": "bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
};

export function StatusBadge({ status }: { status: TodoStatus }) {
  return (
    <Badge
      variant={status === "todo" ? "outline" : "ghost"}
      className={cn("gap-1", STATUS_STYLES[status])}
    >
      <CircleDotIcon aria-hidden="true" />
      <span className="sr-only">Status: </span>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function DueDateBadge({
  dueDate,
  completed,
}: {
  dueDate: string;
  completed: boolean;
}) {
  const overdue = !completed && isOverdue(dueDate);
  const dueToday = !completed && isDueToday(dueDate);

  return (
    <Badge
      variant={overdue ? "destructive" : "outline"}
      className={cn(
        "gap-1",
        dueToday && "border-amber-500/40 text-amber-700 dark:text-amber-300"
      )}
    >
      <CalendarDaysIcon aria-hidden="true" />
      <span className="sr-only">Due: </span>
      {formatDate(dueDate)}
      {overdue ? " (overdue)" : dueToday ? " (today)" : null}
    </Badge>
  );
}
