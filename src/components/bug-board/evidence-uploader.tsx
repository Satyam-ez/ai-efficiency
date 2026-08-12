"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CloudUploadIcon } from "lucide-react";
import { toast } from "sonner";

import { AttachmentCard } from "@/components/bug-board/attachment-card";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/hooks/use-evidence-uploads";
import { formatFileSize } from "@/lib/bug-board/format";
import type { Attachment } from "@/lib/bug-board/types";
import { cn } from "@/lib/utils";

const ACCEPT =
  "image/*,video/*,.pdf,.zip,.gz,.tar,.rar,.log,.txt,.har";

/**
 * Drop zone for evidence. Files can be dropped, picked, or pasted straight from
 * the clipboard while `pasteEnabled` is set.
 */
export function EvidenceUploader({
  attachments,
  onAdd,
  onRemove,
  onPreview,
  pasteEnabled = false,
  className,
}: {
  attachments: Attachment[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onPreview?: (attachment: Attachment) => void;
  pasteEnabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!pasteEnabled) return;

    function handlePaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      onAdd(files);
      toast.success(
        files.length === 1
          ? "Screenshot pasted from clipboard"
          : `${files.length} files pasted from clipboard`
      );
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onAdd, pasteEnabled]);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onAdd(files);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors",
          dragging && "border-ring bg-muted/50"
        )}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CloudUploadIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">
            Drag and drop evidence, or paste a screenshot
          </p>
          <p className="text-xs text-muted-foreground">
            Screenshots, images, videos, screen recordings, PDFs, ZIP and log
            files up to {formatFileSize(MAX_UPLOAD_BYTES)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) onAdd(files);
            // Allows re-picking the same file after a remove.
            event.target.value = "";
          }}
        />
      </div>

      {attachments.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onOpen={onPreview ? () => onPreview(attachment) : undefined}
              onRemove={() => onRemove(attachment.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
