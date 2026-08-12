import type { AttachmentKind } from "@/lib/bug-board/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: string): Date | null {
  const date = new Date(DATE_ONLY.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** `12 Jul 2026` */
export function formatDate(value: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** `10:35 AM` */
export function formatTime(value: string): string {
  const date = toDate(value);
  if (!date) return "—";
  const hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${pad(hours % 12 || 12)}:${pad(date.getMinutes())} ${suffix}`;
}

/** `12 Jul 2026 • 10:35 AM` */
export function formatDateTime(value: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(value)} • ${formatTime(value)}`;
}

/**
 * Wall-clock timestamps carry no offset, so comparisons read them as UTC. Every
 * value shifts by the same amount, which keeps ordering and elapsed time exact
 * without depending on the runtime timezone.
 */
export function toEpochMs(value: string): number {
  const hasOffset = /[Zz]|[+-]\d{2}:\d{2}$/.test(value);
  const normalized = DATE_ONLY.test(value)
    ? `${value}T00:00:00Z`
    : hasOffset
      ? value
      : `${value}Z`;
  return Date.parse(normalized);
}

/** `3d ago`, falling back to an absolute date beyond a month. */
export function formatRelative(value: string, nowMs: number): string {
  const at = toEpochMs(value);
  if (Number.isNaN(at)) return "—";
  const seconds = Math.round((nowMs - at) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/** `1.4 MB` */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"] as const;
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`;
}

export function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Current time in the same offset-less wall clock shape as the seeded data. */
export function nowStamp(): string {
  const date = new Date();
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const KIND_BY_EXTENSION: Record<string, AttachmentKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  svg: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  mkv: "video",
  pdf: "pdf",
  zip: "archive",
  gz: "archive",
  tar: "archive",
  rar: "archive",
  log: "log",
  txt: "log",
  har: "log",
};

/** Screen recordings are videos, but worth calling out separately in the UI. */
export function attachmentKindOf(file: File): AttachmentKind {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = KIND_BY_EXTENSION[extension];
  if (kind === "video" && /screen|recording|capture/i.test(file.name)) {
    return "recording";
  }
  if (kind) return kind;
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}
