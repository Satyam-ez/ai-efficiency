"use client";

import { useMemo, useState } from "react";
import {
  ListTodoIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";

import { EmptyState } from "@/components/todo-notes/empty-state";
import { ListSkeleton } from "@/components/todo-notes/list-skeleton";
import { Panel } from "@/components/todo-notes/panel";
import { TodoCard } from "@/components/todo-notes/todo-card";
import {
  useWorkspaceData,
  useWorkspaceUi,
} from "@/components/todo-notes/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  type Priority,
} from "@/lib/todo-notes/types";

type CompletionFilter = "all" | "active" | "completed";
type PriorityFilter = "all" | Priority;

const COMPLETION_LABELS: Record<CompletionFilter, string> = {
  all: "All tasks",
  active: "Active only",
  completed: "Completed only",
};

export function TodosPanel() {
  const { todos, hydrated } = useWorkspaceData();
  const { openTaskEditor } = useWorkspaceUi();
  const [query, setQuery] = useState("");
  const [completion, setCompletion] = useState<CompletionFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");

  const filtersApplied = completion !== "all" || priority !== "all";

  const visibleTodos = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return todos.filter((todo) => {
      if (completion === "active" && todo.completed) return false;
      if (completion === "completed" && !todo.completed) return false;
      if (priority !== "all" && todo.priority !== priority) return false;
      if (needle && !todo.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [completion, priority, query, todos]);

  const openCount = todos.filter((todo) => !todo.completed).length;

  return (
    <Panel
      title="Tasks"
      count={hydrated ? todos.length : undefined}
      actions={
        <Button size="sm" onClick={() => openTaskEditor(null)}>
          <PlusIcon aria-hidden="true" />
          Add Task
        </Button>
      }
      toolbar={
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Label htmlFor="todo-search" className="sr-only">
                Search tasks
              </Label>
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="todo-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks…"
                className="pr-8 pl-8"
              />
              {query ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-1 -translate-y-1/2">
                  <XIcon aria-hidden="true" />
                  <span className="sr-only">Clear task search</span>
                </Button>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontalIcon aria-hidden="true" />
                  Filter
                  {filtersApplied ? (
                    <Badge
                      variant="default"
                      className="size-1.5 p-0"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="sr-only">
                    {filtersApplied ? "Filters applied" : "No filters applied"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-muted-foreground">
                  Completion
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={completion}
                  onValueChange={(value) =>
                    setCompletion(value as CompletionFilter)
                  }>
                  {(Object.keys(COMPLETION_LABELS) as CompletionFilter[]).map(
                    (value) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        {COMPLETION_LABELS[value]}
                      </DropdownMenuRadioItem>
                    ),
                  )}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground">
                  Priority
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as PriorityFilter)
                  }>
                  <DropdownMenuRadioItem value="all">
                    Any priority
                  </DropdownMenuRadioItem>
                  {PRIORITIES.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {hydrated && todos.length > 0 ? (
            <p className="text-base text-muted-foreground">
              {openCount} open · {todos.length - openCount} completed
              {filtersApplied || query.trim()
                ? ` · showing ${visibleTodos.length}`
                : null}
            </p>
          ) : null}
        </div>
      }>
      {!hydrated ? (
        <ListSkeleton rows={4} />
      ) : todos.length === 0 ? (
        <EmptyState
          icon={ListTodoIcon}
          title="No tasks yet"
          description="Add your first task, then attach a note to keep the details close by."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => openTaskEditor(null)}>
              <PlusIcon aria-hidden="true" />
              Add your first task
            </Button>
          }
        />
      ) : visibleTodos.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title="No matching tasks"
          description="Try a different search or clear the filters."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setCompletion("all");
                setPriority("all");
              }}>
              Reset filters
            </Button>
          }
        />
      ) : (
        visibleTodos.map((todo) => <TodoCard key={todo.id} todo={todo} />)
      )}
    </Panel>
  );
}
