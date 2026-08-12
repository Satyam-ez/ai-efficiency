"use client";

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { Card } from "@/components/ui/card";
import {
  EMPTY_FILTERS,
  OPEN_TESTER_STATUSES,
  type BugFilters,
} from "@/lib/bug-board/filters";
import { cn } from "@/lib/utils";

/** Each card doubles as a shortcut into the filter set it summarises. */
const CARD_FILTERS: Record<string, Partial<BugFilters>> = {
  total: {},
  open: { testerStatus: OPEN_TESTER_STATUSES },
  critical: { severity: ["critical"] },
  "in-progress": { developerStatus: ["in-progress"] },
  "ready-for-qa": { developerStatus: ["ready-for-qa"] },
  closed: { testerStatus: ["closed"] },
};

export function SummaryCards() {
  const { summary, filters, patchFilters } = useBugBoard();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {summary.map((card) => {
        const patch = CARD_FILTERS[card.id] ?? {};
        const rising = card.delta !== null && card.delta > 0;
        const TrendIcon = rising ? TrendingUpIcon : TrendingDownIcon;
        const trendIsGood = rising === Boolean(card.risingIsGood);

        return (
          <Card key={card.id} size="sm" className="gap-0 py-0">
            <button
              type="button"
              // Replacing the facets keeps the search term the user typed.
              onClick={() =>
                patchFilters({ ...EMPTY_FILTERS, query: filters.query, ...patch })
              }
              className="flex h-full flex-col gap-1 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              title={`Filter the board by ${card.label.toLowerCase()}`}
            >
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <span className="flex items-baseline gap-2">
                <span className="font-heading text-xl leading-tight font-semibold tracking-tight tabular-nums">
                  {card.value}
                </span>
                {card.delta !== null && card.delta !== 0 ? (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs",
                      trendIsGood ? "text-muted-foreground" : "text-destructive"
                    )}
                  >
                    <TrendIcon className="size-3" aria-hidden="true" />
                    {Math.abs(card.delta)}
                    <span className="sr-only">
                      {rising ? "up" : "down"} over the last 7 days
                    </span>
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">{card.hint}</span>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
