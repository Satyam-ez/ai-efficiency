"use client";

import { PlayIcon, XIcon } from "lucide-react";

import { ATTACHMENT_ICONS } from "@/components/bug-board/status-badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/bug-board/format";
import {
  ATTACHMENT_KIND_LABELS,
  isPlayable,
  isViewable,
  type Attachment,
} from "@/lib/bug-board/types";
import { cn } from "@/lib/utils";

export function AttachmentCard({
  attachment,
  onOpen,
  onRemove,
  className,
}: {
  attachment: Attachment;
  onOpen?: () => void;
  onRemove?: () => void;
  className?: string;
}) {
  const Icon = ATTACHMENT_ICONS[attachment.kind];
  const uploading = attachment.status === "uploading";
  const viewable = isViewable(attachment.kind) && !uploading;

  const thumbnail = attachment.thumbnail ? (
    // Generated data URIs and object URLs only, so next/image would add nothing.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={attachment.thumbnail}
      alt=""
      className="size-full object-cover"
      draggable={false}
    />
  ) : (
    <span className="flex size-full items-center justify-center text-muted-foreground">
      <Icon className="size-6" aria-hidden="true" />
    </span>
  );

  return (
    <div
      className={cn(
        "group/attachment relative flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="relative aspect-video bg-muted">
        {viewable && onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="block size-full transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Preview ${attachment.name}`}
          >
            {thumbnail}
          </button>
        ) : (
          thumbnail
        )}

        {isPlayable(attachment.kind) && !uploading ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-foreground/70 text-background">
              <PlayIcon className="size-3.5" aria-hidden="true" />
            </span>
          </span>
        ) : null}

        {onRemove ? (
          <Button
            variant="outline"
            size="icon-xs"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover/attachment:opacity-100 focus-visible:opacity-100"
            aria-label={`Remove ${attachment.name}`}
          >
            <XIcon aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1 px-2.5 py-2">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-sm" title={attachment.name}>
            {attachment.name}
          </span>
        </span>
        {uploading ? (
          <>
            <Progress value={attachment.progress} />
            <span className="text-xs text-muted-foreground tabular-nums">
              Uploading {attachment.progress}%
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            {ATTACHMENT_KIND_LABELS[attachment.kind]} • {formatFileSize(attachment.size)}
          </span>
        )}
      </div>
    </div>
  );
}
