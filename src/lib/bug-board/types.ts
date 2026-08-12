export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** QA-owned side of the workflow. */
export const TESTER_STATUSES = [
  "open",
  "under-review",
  "verified",
  "reopened",
  "closed",
] as const;
export type TesterStatus = (typeof TESTER_STATUSES)[number];

/** Engineering-owned side of the workflow. */
export const DEVELOPER_STATUSES = [
  "backlog",
  "assigned",
  "in-progress",
  "ready-for-qa",
  "fixed",
  "blocked",
] as const;
export type DeveloperStatus = (typeof DEVELOPER_STATUSES)[number];

export const ENVIRONMENTS = ["production", "staging", "development"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const ATTACHMENT_KINDS = [
  "image",
  "video",
  "recording",
  "pdf",
  "archive",
  "log",
  "file",
] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export type PersonRole = "developer" | "tester" | "manager";

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: PersonRole;
}

/**
 * A named bucket of bugs, usually one product or one QA workstream. Every bug
 * belongs to exactly one, so a developer can be handed the slice they own
 * instead of the whole board.
 */
export interface Project {
  id: string;
  /** The title the tester types when they open the project. */
  name: string;
  description: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  /** Size in bytes. */
  size: number;
  /** Object URL for uploads, data URI for seeded evidence, `null` when absent. */
  url: string | null;
  /** Poster image used in cards and as the video frame. */
  thumbnail: string | null;
  uploadedAt: string;
  uploadedById: string;
  /** 0–100 while `status` is `uploading`. */
  progress: number;
  status: "uploading" | "ready" | "error";
}

export const ACTIVITY_KINDS = [
  "created",
  "edited",
  "moved",
  "assigned",
  "status",
  "severity",
  "priority",
  "comment",
  "attachment",
  "fixed",
  "verified",
  "closed",
  "reopened",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  actorId: string;
  at: string;
  /** Plain sentence shown next to the actor, e.g. `changed developer status`. */
  summary: string;
  from?: string;
  to?: string;
}

export interface Reaction {
  emoji: string;
  /** Person ids, so the current user's own reaction can be toggled. */
  byIds: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  at: string;
  body: string;
  /** `null` for top-level comments, otherwise the comment being replied to. */
  parentId: string | null;
  code: string | null;
  attachments: Attachment[];
  reactions: Reaction[];
}

export interface Bug {
  /** Human readable and auto generated, e.g. `BUG-1042`. */
  id: string;
  /** The project this bug is filed under, see {@link Project}. */
  projectId: string;
  title: string;
  description: string;
  module: string;
  component: string;
  severity: Severity;
  priority: Priority;
  testerStatus: TesterStatus;
  developerStatus: DeveloperStatus;
  reporterId: string;
  assigneeId: string | null;
  watcherIds: string[];
  environment: Environment;
  browser: string;
  device: string;
  os: string;
  sprint: string;
  labels: string[];
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  attachments: Attachment[];
  activity: ActivityEntry[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

/** Everything the create form collects. Ids and timestamps are added on save. */
export type BugDraft = Pick<
  Bug,
  | "projectId"
  | "title"
  | "description"
  | "module"
  | "component"
  | "severity"
  | "priority"
  | "sprint"
  | "labels"
  | "environment"
  | "browser"
  | "device"
  | "os"
  | "expectedResult"
  | "actualResult"
  | "watcherIds"
> & {
  stepsToReproduce: string;
  reporterId: string;
  assigneeId: string | null;
  attachments: Attachment[];
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TESTER_STATUS_LABELS: Record<TesterStatus, string> = {
  open: "Open",
  "under-review": "Under Review",
  verified: "Verified",
  reopened: "Reopened",
  closed: "Closed",
};

export const DEVELOPER_STATUS_LABELS: Record<DeveloperStatus, string> = {
  backlog: "Backlog",
  assigned: "Assigned",
  "in-progress": "In Progress",
  "ready-for-qa": "Ready for QA",
  fixed: "Fixed",
  blocked: "Blocked",
};

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  production: "Production",
  staging: "Staging",
  development: "Development",
};

export const ATTACHMENT_KIND_LABELS: Record<AttachmentKind, string> = {
  image: "Image",
  video: "Video",
  recording: "Screen recording",
  pdf: "PDF",
  archive: "Archive",
  log: "Log file",
  file: "File",
};

/** Kinds that play in the preview modal rather than opening as a still image. */
export function isPlayable(kind: AttachmentKind): boolean {
  return kind === "video" || kind === "recording";
}

export function isViewable(kind: AttachmentKind): boolean {
  return kind === "image" || isPlayable(kind);
}
