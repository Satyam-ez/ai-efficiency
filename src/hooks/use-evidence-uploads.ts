"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CURRENT_USER_ID } from "@/lib/bug-board/data";
import {
  attachmentKindOf,
  createId,
  nowStamp,
} from "@/lib/bug-board/format";
import type { Attachment } from "@/lib/bug-board/types";

/** Anything larger is rejected up front, with the file named in the message. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const TICK_MS = 140;

export interface UploadResult {
  accepted: Attachment[];
  rejected: File[];
}

/**
 * Local evidence queue with simulated upload progress. Files never leave the
 * browser: previews are object URLs, so nothing is sent anywhere.
 */
export function useEvidenceUploads(initial: Attachment[] = []) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial);
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());

  const stopTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearInterval(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const running = timers.current;
    return () => {
      for (const timer of running.values()) clearInterval(timer);
      running.clear();
    };
  }, []);

  const track = useCallback(
    (id: string) => {
      const timer = setInterval(() => {
        setAttachments((previous) =>
          previous.map((attachment) => {
            if (attachment.id !== id) return attachment;
            const progress = Math.min(100, attachment.progress + 18);
            if (progress >= 100) {
              stopTimer(id);
              return { ...attachment, progress: 100, status: "ready" };
            }
            return { ...attachment, progress };
          })
        );
      }, TICK_MS);
      timers.current.set(id, timer);
    },
    [stopTimer]
  );

  const addFiles = useCallback(
    (files: File[]): UploadResult => {
      const accepted: Attachment[] = [];
      const rejected: File[] = [];

      for (const file of files) {
        if (file.size > MAX_UPLOAD_BYTES) {
          rejected.push(file);
          continue;
        }
        const kind = attachmentKindOf(file);
        const url = URL.createObjectURL(file);
        accepted.push({
          id: createId("att"),
          name: file.name,
          kind,
          size: file.size,
          url,
          thumbnail: kind === "image" ? url : null,
          uploadedAt: nowStamp(),
          uploadedById: CURRENT_USER_ID,
          progress: 0,
          status: "uploading",
        });
      }

      if (accepted.length > 0) {
        setAttachments((previous) => [...previous, ...accepted]);
        for (const attachment of accepted) track(attachment.id);
      }

      return { accepted, rejected };
    },
    [track]
  );

  const remove = useCallback(
    (id: string) => {
      stopTimer(id);
      setAttachments((previous) => {
        const target = previous.find((attachment) => attachment.id === id);
        // Only object URLs created here are revoked; seeded data URIs are shared.
        if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
        return previous.filter((attachment) => attachment.id !== id);
      });
    },
    [stopTimer]
  );

  const reset = useCallback((next: Attachment[] = []) => {
    for (const timer of timers.current.values()) clearInterval(timer);
    timers.current.clear();
    setAttachments(next);
  }, []);

  return {
    attachments,
    addFiles,
    remove,
    reset,
    uploading: attachments.some((attachment) => attachment.status === "uploading"),
  };
}
