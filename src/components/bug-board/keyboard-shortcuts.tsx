"use client";

import { useEffect } from "react";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "C", action: "Create a bug" },
  { keys: "/", action: "Focus the search field" },
  { keys: "F", action: "Show or hide the filter row" },
  { keys: "E", action: "Export the current view to CSV" },
  { keys: "S", action: "Share this project with a developer" },
  { keys: "Esc", action: "Close the panel, or clear the selection" },
  { keys: "←  →", action: "Move between attachments in the preview" },
  { keys: "⌘/Ctrl + Enter", action: "Save a bug or post a comment" },
  { keys: "?", action: "Open this list" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Board level shortcuts. Anything typed into a field, or pressed while a modal
 * owns the screen, is left alone.
 */
export function useBoardShortcuts({
  onFocusSearch,
  onToggleFilters,
  onExport,
  onShare,
}: {
  onFocusSearch: () => void;
  onToggleFilters: () => void;
  onExport: () => void;
  onShare: () => void;
}) {
  const {
    openCreate,
    createOpen,
    preview,
    detailBugId,
    closeDetail,
    projectDialog,
    selectedIds,
    setSelection,
    shareTarget,
    shortcutsOpen,
    setShortcutsOpen,
  } = useBugBoard();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
        return;
      }

      // Every layer that owns the screen, so the board never steals a keypress.
      const layerOpen =
        createOpen ||
        Boolean(preview) ||
        shortcutsOpen ||
        projectDialog !== null ||
        shareTarget !== undefined;

      if (event.key === "Escape") {
        if (layerOpen) return;
        if (detailBugId) {
          closeDetail();
          return;
        }
        if (selectedIds.length > 0) setSelection([]);
        return;
      }

      // The remaining shortcuts belong to the board behind any open layer.
      if (layerOpen) return;

      switch (event.key.toLowerCase()) {
        case "c":
          event.preventDefault();
          openCreate();
          break;
        case "/":
          event.preventDefault();
          onFocusSearch();
          break;
        case "f":
          event.preventDefault();
          onToggleFilters();
          break;
        case "e":
          event.preventDefault();
          onExport();
          break;
        case "s":
          event.preventDefault();
          onShare();
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    closeDetail,
    createOpen,
    detailBugId,
    onExport,
    onFocusSearch,
    onShare,
    onToggleFilters,
    openCreate,
    preview,
    projectDialog,
    selectedIds.length,
    setSelection,
    setShortcutsOpen,
    shareTarget,
    shortcutsOpen,
  ]);
}

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useBugBoard();

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Triage without leaving the keyboard.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div className="contents" key={shortcut.keys}>
              <dt>
                <kbd
                  data-slot="kbd"
                  className="inline-flex h-5 items-center rounded-md bg-muted px-1.5 font-mono text-xs text-muted-foreground"
                >
                  {shortcut.keys}
                </kbd>
              </dt>
              <dd className="text-sm text-muted-foreground">{shortcut.action}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
