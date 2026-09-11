"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getCurrentUserId } from "@/lib/bug-board/data";
import { attachmentKindOf, createId, nowStamp } from "@/lib/bug-board/format";
import type { Attachment } from "@/lib/bug-board/types";

/** Anything larger is rejected up front, with the file named in the message. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export interface UploadResult {
  /** Local previews, for rendering the queue straight away. */
  accepted: Attachment[];
  /** The same files, to hand to the API. */
  acceptedFiles: File[];
  rejected: File[];
}

interface Staged {
  attachment: Attachment;
  file: File;
}

/**
 * Staging queue for evidence the user has picked but not sent yet.
 *
 * It holds the real `File` objects alongside a local preview, because the
 * upload itself belongs to the caller: the create form has no bug to attach to
 * until the bug exists, while the details drawer and the comment box can upload
 * immediately. Previews are object URLs and are revoked on removal.
 */
export function useEvidenceUploads(initial: Attachment[] = []) {
  const [staged, setStaged] = useState<Staged[]>([]);
  // Attachments the bug already has, shown in the queue when editing.
  const [seeded, setSeeded] = useState<Attachment[]>(initial);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const addFiles = useCallback((files: File[]): UploadResult => {
    const accepted: Attachment[] = [];
    const acceptedFiles: File[] = [];
    const rejected: File[] = [];

    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        rejected.push(file);
        continue;
      }
      const kind = attachmentKindOf(file);
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      accepted.push({
        id: createId("staged"),
        name: file.name,
        kind,
        size: file.size,
        url,
        thumbnail: kind === "image" ? url : null,
        uploadedAt: nowStamp(),
        uploadedById: getCurrentUserId() ?? "",
        progress: 100,
        status: "ready",
      });
      acceptedFiles.push(file);
    }

    if (accepted.length > 0) {
      setStaged((previous) => [
        ...previous,
        ...accepted.map((attachment, index) => ({
          attachment,
          file: acceptedFiles[index],
        })),
      ]);
    }

    return { accepted, acceptedFiles, rejected };
  }, []);

  const remove = useCallback((id: string) => {
    setSeeded((previous) => previous.filter((item) => item.id !== id));
    setStaged((previous) => {
      const target = previous.find((entry) => entry.attachment.id === id);
      const url = target?.attachment.url;
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        objectUrls.current.delete(url);
      }
      return previous.filter((entry) => entry.attachment.id !== id);
    });
  }, []);

  const reset = useCallback((next: Attachment[] = []) => {
    setSeeded(next);
    setStaged((previous) => {
      for (const entry of previous) {
        const url = entry.attachment.url;
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
          objectUrls.current.delete(url);
        }
      }
      return [];
    });
  }, []);

  return {
    /** Seeded attachments first, then anything staged in this session. */
    attachments: [...seeded, ...staged.map((entry) => entry.attachment)],
    files: staged.map((entry) => entry.file),
    addFiles,
    remove,
    reset,
  };
}
