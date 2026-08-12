"use client";

import {
  ArrowRightIcon,
  ArrowUpDownIcon,
  BugIcon,
  FolderInputIcon,
  CircleCheckIcon,
  CircleSlashIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PencilIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  UserPlusIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { boardNowMs, personName, personOf } from "@/lib/bug-board/data";
import { formatDateTime, formatRelative, toEpochMs } from "@/lib/bug-board/format";
import type { ActivityEntry, ActivityKind, Bug } from "@/lib/bug-board/types";

const KIND_ICONS: Record<ActivityKind, LucideIcon> = {
  created: BugIcon,
  edited: PencilIcon,
  moved: FolderInputIcon,
  assigned: UserPlusIcon,
  status: ArrowRightIcon,
  severity: TriangleAlertIcon,
  priority: ArrowUpDownIcon,
  comment: MessageSquareIcon,
  attachment: PaperclipIcon,
  fixed: WrenchIcon,
  verified: CircleCheckIcon,
  closed: CircleSlashIcon,
  reopened: RotateCcwIcon,
};

function TimelineRow({ entry }: { entry: ActivityEntry }) {
  const Icon = KIND_ICONS[entry.kind];
  const actor = personOf(entry.actorId);

  return (
    <li className="relative flex gap-3 pb-4 pl-1 last:pb-0">
      <span
        className="absolute top-7 bottom-0 left-4 w-px bg-border"
        aria-hidden="true"
      />
      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-4 ring-popover">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm">
          <span className="font-medium">{personName(entry.actorId)}</span>{" "}
          <span className="text-muted-foreground">{entry.summary}</span>
        </p>
        {entry.from && entry.to ? (
          <p className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-muted-foreground">
              {entry.from}
            </Badge>
            <ArrowRightIcon
              className="size-3 text-muted-foreground"
              aria-hidden="true"
            />
            <Badge variant="secondary">{entry.to}</Badge>
          </p>
        ) : null}
        <p
          className="text-xs text-muted-foreground"
          title={formatDateTime(entry.at)}
        >
          {formatRelative(entry.at, boardNowMs())}
        </p>
      </div>
      {actor ? (
        <Avatar size="sm" className="mt-0.5 shrink-0">
          <AvatarFallback>{actor.initials}</AvatarFallback>
        </Avatar>
      ) : null}
    </li>
  );
}

/** Newest first, the order an auditor reads a history in. */
export function ActivityTimeline({ bug }: { bug: Bug }) {
  const entries = [...bug.activity].sort(
    (a, b) => toEpochMs(b.at) - toEpochMs(a.at)
  );

  return (
    <ol className="flex flex-col">
      {entries.map((entry) => (
        <TimelineRow entry={entry} key={entry.id} />
      ))}
    </ol>
  );
}
