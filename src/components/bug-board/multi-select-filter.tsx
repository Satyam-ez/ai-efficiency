"use client";

import { ChevronDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * One facet of the board filter. Selecting a value keeps the menu open so a
 * whole facet can be built in a single visit.
 */
export function MultiSelectFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const count = selected.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={count > 0 ? "secondary" : "outline"} size="sm">
          {label}
          {count > 0 ? (
            <Badge
              variant="outline"
              className="h-4 min-w-4 border-transparent bg-background/70 px-1 tabular-nums"
            >
              {count}
            </Badge>
          ) : null}
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 min-w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
            onSelect={(event) => event.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {count > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onClear}>
              Clear {label.toLowerCase()}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
