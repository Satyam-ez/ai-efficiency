import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  count?: number;
  /** Rendered on the right of the panel heading. */
  actions?: ReactNode;
  /** Rendered under the heading, outside the scroll area (search, filters). */
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({
  title,
  count,
  actions,
  toolbar,
  children,
  className,
}: PanelProps) {
  return (
    <Card
      className={cn(
        "flex min-h-0 flex-col gap-3 overflow-hidden py-3 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight">
            {title}
            {typeof count === "number" ? (
              <Badge variant="secondary" className="font-normal tabular-nums">
                {count}
              </Badge>
            ) : null}
          </h2>
          {actions}
        </div>
        {toolbar}
      </div>
      <Separator />
      <ScrollArea className="h-auto max-h-[65dvh] flex-1 lg:h-full lg:max-h-none">
        <div className="flex flex-col gap-2 px-3 pb-1">{children}</div>
      </ScrollArea>
    </Card>
  );
}
