import { UserIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { personOf } from "@/lib/bug-board/data";
import { cn } from "@/lib/utils";

/** Avatar plus name, the pairing used for every person reference on the board. */
export function PersonChip({
  personId,
  size = "default",
  className,
  showRole = false,
}: {
  personId: string | null | undefined;
  size?: "sm" | "default" | "lg";
  className?: string;
  showRole?: boolean;
}) {
  const person = personOf(personId);

  if (!person) {
    return (
      <span
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          className
        )}
      >
        <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border">
          <UserIcon className="size-3" aria-hidden="true" />
        </span>
        Unassigned
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Avatar size={size}>
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{person.name}</span>
        {showRole ? (
          <span className="truncate text-xs text-muted-foreground capitalize">
            {person.role}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** Overlapping avatars for watcher lists. */
export function PersonStack({
  personIds,
  className,
}: {
  personIds: string[];
  className?: string;
}) {
  if (personIds.length === 0) {
    return <span className="text-muted-foreground">No watchers</span>;
  }

  return (
    <span className={cn("flex items-center", className)}>
      {personIds.map((id) => {
        const person = personOf(id);
        if (!person) return null;
        return (
          <Avatar
            key={id}
            size="sm"
            className="-mr-1.5 ring-2 ring-popover last:mr-0"
            title={person.name}
          >
            <AvatarFallback>{person.initials}</AvatarFallback>
          </Avatar>
        );
      })}
    </span>
  );
}
