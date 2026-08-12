"use client";

import { useEffect, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MaximizeIcon,
} from "lucide-react";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { ATTACHMENT_ICONS } from "@/components/bug-board/status-badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, formatFileSize } from "@/lib/bug-board/format";
import { personName } from "@/lib/bug-board/data";
import {
  ATTACHMENT_KIND_LABELS,
  isPlayable,
  type Attachment,
} from "@/lib/bug-board/types";

function Media({ attachment }: { attachment: Attachment }) {
  const Icon = ATTACHMENT_ICONS[attachment.kind];

  if (attachment.kind === "image" && attachment.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={attachment.url}
        alt={attachment.name}
        className="max-h-[70dvh] w-full bg-muted object-contain"
      />
    );
  }

  if (isPlayable(attachment.kind) && attachment.url) {
    return (
      <video
        src={attachment.url}
        poster={attachment.thumbnail ?? undefined}
        controls
        autoPlay
        className="max-h-[70dvh] w-full bg-foreground"
      />
    );
  }

  if (isPlayable(attachment.kind) && attachment.thumbnail) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.thumbnail}
          alt={attachment.name}
          className="max-h-[70dvh] w-full bg-muted object-contain"
        />
        <p className="absolute inset-x-0 bottom-0 bg-foreground/80 px-4 py-2 text-center text-xs text-background">
          Poster frame only — the recording itself is not part of the sample data
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 bg-muted px-4 text-center">
      <span className="flex size-8 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium">
        {ATTACHMENT_KIND_LABELS[attachment.kind]} files open outside the preview
      </p>
      <p className="text-xs text-muted-foreground">
        {attachment.name} • {formatFileSize(attachment.size)}
      </p>
    </div>
  );
}

/** Lightbox for images and the in-modal player for recordings. */
export function AttachmentPreviewDialog({
  attachments,
  activeId,
  onSelect,
  onClose,
}: {
  attachments: Attachment[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const index = attachments.findIndex((item) => item.id === activeId);
  const attachment = index >= 0 ? attachments[index] : undefined;

  useEffect(() => {
    if (!attachment) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = attachments[(index + step + attachments.length) % attachments.length];
      if (next) onSelect(next.id);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [attachment, attachments, index, onSelect]);

  if (!attachment) return null;

  const Icon = ATTACHMENT_ICONS[attachment.kind];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-5xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-center gap-3 border-b p-3 pr-12">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col">
            <DialogTitle className="truncate">{attachment.name}</DialogTitle>
            <DialogDescription className="truncate text-xs">
              {ATTACHMENT_KIND_LABELS[attachment.kind]} •{" "}
              {formatFileSize(attachment.size)} • added by{" "}
              {personName(attachment.uploadedById)} on{" "}
              {formatDateTime(attachment.uploadedAt)}
            </DialogDescription>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void mediaRef.current?.requestFullscreen?.()}
              aria-label="Expand to fullscreen"
            >
              <MaximizeIcon aria-hidden="true" />
            </Button>
            {attachment.url ? (
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={attachment.url}
                  download={attachment.name}
                  aria-label={`Download ${attachment.name}`}
                >
                  <DownloadIcon aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div ref={mediaRef} className="relative flex items-center bg-muted">
          <Media attachment={attachment} />
          {attachments.length > 1 ? (
            <>
              <Button
                variant="outline"
                size="icon-sm"
                className="absolute left-2"
                onClick={() =>
                  onSelect(
                    attachments[(index - 1 + attachments.length) % attachments.length].id
                  )
                }
                aria-label="Previous attachment"
              >
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="absolute right-2"
                onClick={() =>
                  onSelect(attachments[(index + 1) % attachments.length].id)
                }
                aria-label="Next attachment"
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {index + 1} of {attachments.length}
          </span>
          <span>Use ← and → to move between files</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Preview driven by the board's own selection, used by the table and drawer. */
export function BoardAttachmentPreview() {
  const { preview, openPreview, closePreview, getBug } = useBugBoard();
  const bug = getBug(preview?.bugId);

  if (!preview || !bug) return null;

  return (
    <AttachmentPreviewDialog
      attachments={bug.attachments}
      activeId={preview.attachmentId}
      onSelect={(attachmentId) => openPreview({ bugId: bug.id, attachmentId })}
      onClose={closePreview}
    />
  );
}
