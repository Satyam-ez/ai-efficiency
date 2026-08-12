"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import {
  PAGE_SIZES,
  useBugBoard,
} from "@/components/bug-board/bug-board-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TablePagination() {
  const { page, pageCount, pageSize, setPage, setPageSize, visibleBugs } =
    useBugBoard();

  const first = visibleBugs.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, visibleBugs.length);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="bug-page-size" className="text-xs text-muted-foreground">
          Rows per page
        </Label>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => setPageSize(Number(value))}
        >
          <SelectTrigger id="bug-page-size" size="sm" className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {first}–{last} of {visibleBugs.length}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          <ChevronsLeftIcon aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRightIcon aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setPage(pageCount)}
          disabled={page >= pageCount}
          aria-label="Last page"
        >
          <ChevronsRightIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
