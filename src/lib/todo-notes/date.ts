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

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Parses both ISO timestamps and `YYYY-MM-DD` values. Date-only values are
 * anchored to local midnight so they never shift a day across time zones.
 */
function toDate(value: string): Date | null {
  const date = new Date(DATE_ONLY.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** `29 Jul 2026` */
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

/** `29 Jul 2026 • 10:35 AM` */
export function formatDateTime(value: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(value)} • ${formatTime(value)}`;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const date = toDate(dueDate);
  if (!date) return false;
  date.setHours(0, 0, 0, 0);
  return date.getTime() < startOfToday().getTime();
}

export function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const date = toDate(dueDate);
  if (!date) return false;
  date.setHours(0, 0, 0, 0);
  return date.getTime() === startOfToday().getTime();
}

/** `YYYY-MM-DD`, the value shape used by `<input type="date">`. */
export function toDateInputValue(dueDate: string | null): string {
  if (!dueDate) return "";
  const date = toDate(dueDate);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
