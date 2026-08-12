import {
  recordingPosterDataUri,
  screenshotDataUri,
} from "@/lib/bug-board/thumbnails";
import type {
  ActivityEntry,
  AttachmentKind,
  Bug,
  Comment,
  DeveloperStatus,
  Environment,
  Person,
  Priority,
  Project,
  Reaction,
  Severity,
  TesterStatus,
} from "@/lib/bug-board/types";
import {
  DEVELOPER_STATUS_LABELS,
  TESTER_STATUS_LABELS,
} from "@/lib/bug-board/types";

export const PEOPLE: Person[] = [
  { id: "aarav", name: "Aarav Mehta", initials: "AM", role: "developer" },
  { id: "priya", name: "Priya Nair", initials: "PN", role: "developer" },
  { id: "daniel", name: "Daniel Okafor", initials: "DO", role: "developer" },
  { id: "sofia", name: "Sofia Ricci", initials: "SR", role: "developer" },
  { id: "marcus", name: "Marcus Chen", initials: "MC", role: "developer" },
  { id: "lena", name: "Lena Fischer", initials: "LF", role: "developer" },
  { id: "ishita", name: "Ishita Rao", initials: "IR", role: "tester" },
  { id: "tomas", name: "Tomás Alvarez", initials: "TA", role: "tester" },
  { id: "grace", name: "Grace Park", initials: "GP", role: "tester" },
  { id: "noah", name: "Noah Bennett", initials: "NB", role: "tester" },
  { id: "rhea", name: "Rhea Kapoor", initials: "RK", role: "manager" },
];

const PEOPLE_BY_ID = new Map(PEOPLE.map((person) => [person.id, person]));

export const DEVELOPERS = PEOPLE.filter((p) => p.role === "developer");
export const TESTERS = PEOPLE.filter((p) => p.role === "tester");

/** The signed-in user, used for authored comments, reactions and activity. */
export const CURRENT_USER_ID = "ishita";

/**
 * Everything relative ("3d ago", "closed this sprint") is measured from this
 * anchor rather than the wall clock, so the seeded board renders identically on
 * the server and in the browser.
 */
export const BOARD_NOW = "2026-08-07T09:00:00";

export function boardNowMs(): number {
  return new Date(`${BOARD_NOW}Z`).getTime();
}

export const CURRENT_SPRINT = "Sprint 43";

/** Length of a sprint, used for the "closed this sprint" window. */
export const SPRINT_DAYS = 14;

export function personOf(id: string | null | undefined): Person | undefined {
  return id ? PEOPLE_BY_ID.get(id) : undefined;
}

export function personName(id: string | null | undefined): string {
  return personOf(id)?.name ?? "Unassigned";
}

/**
 * Each QA workstream files into its own project, so a developer opening a
 * shared board sees one product's bugs rather than every tester's output at
 * once.
 */
export const SEED_PROJECTS: Project[] = [
  {
    id: "proj-atlas",
    name: "Atlas Web App",
    description:
      "Customer facing workspace: sign-in, dashboard, onboarding and user administration.",
    createdAt: "2026-05-04T09:00:00",
  },
  {
    id: "proj-billing",
    name: "Billing Platform",
    description:
      "Subscriptions, invoicing, revenue reporting and the audit trail behind them.",
    createdAt: "2026-05-04T09:00:00",
  },
  {
    id: "proj-signals",
    name: "Search & Notifications",
    description:
      "Search, alerting, digests and the file storage both of them read from.",
    createdAt: "2026-06-01T09:00:00",
  },
  {
    id: "proj-integrations",
    name: "Integrations Hub",
    description:
      "Third party connectors, webhook delivery and the public API gateway.",
    createdAt: "2026-06-15T09:00:00",
  },
];

/** The project a new board session starts in. */
export const DEFAULT_PROJECT_ID = SEED_PROJECTS[0].id;

export const MODULES = [
  "Authentication",
  "Billing",
  "Reporting",
  "Notifications",
  "User Management",
  "Search",
  "Integrations",
  "Dashboard",
  "File Storage",
  "Audit Log",
  "Onboarding",
  "API Gateway",
] as const;

export const COMPONENTS = [
  "SSO Provider",
  "Invoice PDF",
  "Chart Renderer",
  "Email Digest",
  "Role Editor",
  "Query Parser",
  "Webhook Delivery",
  "KPI Cards",
  "Upload Service",
  "Event Stream",
  "Setup Wizard",
  "Rate Limiter",
  "Session Store",
  "Export Worker",
] as const;

export const SPRINTS = [
  "Sprint 41",
  "Sprint 42",
  "Sprint 43",
  "Backlog",
] as const;

export const LABELS = [
  "regression",
  "ui",
  "performance",
  "security",
  "data-loss",
  "accessibility",
  "mobile",
  "api",
  "flaky",
  "customer-reported",
  "needs-design",
] as const;

export const BROWSERS = [
  "Chrome 141",
  "Safari 19",
  "Firefox 137",
  "Edge 141",
  "Not applicable",
] as const;

export const DEVICES = [
  'MacBook Pro 16"',
  "Windows Laptop",
  "iPhone 17",
  "Pixel 10",
  "iPad Air",
  "Desktop",
] as const;

export const OPERATING_SYSTEMS = [
  "macOS 16.2",
  "Windows 11",
  "iOS 20",
  "Android 17",
  "Ubuntu 26.04",
] as const;

export const REACTION_EMOJI = ["👍", "🎉", "👀", "🐛", "🙏"] as const;

/** Seeded bugs inherit their project from the module they were filed against. */
const PROJECT_BY_MODULE: Record<string, string> = {
  Authentication: "proj-atlas",
  Dashboard: "proj-atlas",
  Onboarding: "proj-atlas",
  "User Management": "proj-atlas",
  Billing: "proj-billing",
  Reporting: "proj-billing",
  "Audit Log": "proj-billing",
  Search: "proj-signals",
  Notifications: "proj-signals",
  "File Storage": "proj-signals",
  Integrations: "proj-integrations",
  "API Gateway": "proj-integrations",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Timestamps are stored as offset-less wall clock strings so the server and the
 * browser always format them identically. Arithmetic therefore happens in UTC
 * space and is written back in the same shape.
 */
function shiftHours(base: string, hours: number): string {
  const date = new Date(`${base}Z`);
  date.setTime(date.getTime() + Math.round(hours * 3_600_000));
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`
  );
}

interface SeedAttachment {
  name: string;
  kind: AttachmentKind;
  /** Bytes. */
  size: number;
  after: number;
  byId: string;
  /** Caption baked into generated screenshots. */
  label?: string;
  tone?: "neutral" | "error";
}

interface SeedComment {
  byId: string;
  after: number;
  body: string;
  code?: string;
  reactions?: Array<[string, string[]]>;
  /** Index of the comment in this list that is being replied to. */
  replyTo?: number;
  attachments?: SeedAttachment[];
}

interface SeedBug {
  id: string;
  title: string;
  module: string;
  component: string;
  severity: Severity;
  priority: Priority;
  testerStatus: TesterStatus;
  developerStatus: DeveloperStatus;
  reporterId: string;
  assigneeId?: string | null;
  watcherIds?: string[];
  environment: Environment;
  browser: string;
  device: string;
  os: string;
  sprint: string;
  labels: string[];
  createdAt: string;
  /** Hours between creation and the last update. */
  age: number;
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  attachments?: SeedAttachment[];
  comments?: SeedComment[];
}

const SEED: SeedBug[] = [
  {
    id: "BUG-1042",
    title: "SSO login loops back to sign-in after successful Okta redirect",
    module: "Authentication",
    component: "SSO Provider",
    severity: "critical",
    priority: "P0",
    testerStatus: "reopened",
    developerStatus: "in-progress",
    reporterId: "ishita",
    assigneeId: "aarav",
    watcherIds: ["rhea", "priya"],
    environment: "production",
    browser: "Chrome 141",
    device: 'MacBook Pro 16"',
    os: "macOS 16.2",
    sprint: "Sprint 43",
    labels: ["regression", "security", "customer-reported"],
    createdAt: "2026-08-04T09:12:00",
    age: 51,
    description:
      "Enterprise tenants using Okta are returned to the sign-in screen after the identity provider redirect completes. The session cookie is issued but immediately discarded because the callback handler rewrites the domain attribute. Three tenants have reported full lockout.",
    steps: [
      "Open the app with tenant slug `northwind` and choose Continue with SSO.",
      "Authenticate against Okta with a valid enterprise account.",
      "Wait for the callback redirect to /auth/callback to finish.",
      "Observe that the app returns to the sign-in screen instead of the dashboard.",
    ],
    expected:
      "The user lands on the dashboard with an active session that survives a page reload.",
    actual:
      "The callback sets a cookie scoped to the wrong domain, the session is dropped, and the sign-in screen is shown again in a loop.",
    attachments: [
      {
        name: "sso-redirect-loop.png",
        kind: "image",
        size: 486_912,
        after: 0.2,
        byId: "ishita",
        label: "Session expired — please sign in again",
        tone: "error",
      },
      {
        name: "screen-recording-sso-loop.mp4",
        kind: "recording",
        size: 14_680_064,
        after: 0.4,
        byId: "ishita",
        label: "Full redirect loop, 0:42",
      },
      {
        name: "auth-service.log",
        kind: "log",
        size: 92_160,
        after: 1.5,
        byId: "aarav",
      },
    ],
    comments: [
      {
        byId: "aarav",
        after: 2,
        body: "Reproduced on staging with the same tenant. The cookie domain is being set from the request host instead of the configured root domain.",
        code: 'res.cookies.set("sid", token, {\n  domain: request.headers.host, // wrong: includes the tenant subdomain\n  sameSite: "lax",\n})',
        reactions: [["👀", ["ishita", "rhea"]]],
      },
      {
        byId: "ishita",
        after: 4,
        replyTo: 0,
        body: "@Aarav Mehta that matches what I see in the HAR file — the Set-Cookie header uses the tenant host on every callback.",
        reactions: [["👍", ["aarav"]]],
      },
      {
        byId: "rhea",
        after: 26,
        body: "Flagging this as the release blocker for 4.18. @Priya Nair please pair with Aarav after standup.",
        reactions: [["🙏", ["priya"]]],
      },
    ],
  },
  {
    id: "BUG-1041",
    title: "Invoice PDF totals ignore multi-currency tax rounding",
    module: "Billing",
    component: "Invoice PDF",
    severity: "critical",
    priority: "P0",
    testerStatus: "under-review",
    developerStatus: "ready-for-qa",
    reporterId: "tomas",
    assigneeId: "sofia",
    watcherIds: ["rhea"],
    environment: "production",
    browser: "Firefox 137",
    device: "Windows Laptop",
    os: "Windows 11",
    sprint: "Sprint 43",
    labels: ["data-loss", "customer-reported"],
    createdAt: "2026-08-03T14:40:00",
    age: 72,
    description:
      "Invoices that mix EUR line items with USD credits round tax per line instead of per invoice, so the PDF total differs from the amount charged by up to 0.4%.",
    steps: [
      "Create an invoice with three EUR line items and one USD credit note.",
      "Apply the 19% German VAT tax profile.",
      "Download the invoice PDF from the billing detail page.",
      "Compare the PDF total against the charged amount in the payments table.",
    ],
    expected:
      "Tax is calculated once on the invoice subtotal and the PDF total matches the charged amount exactly.",
    actual:
      "Tax is rounded on each line, producing a total that is 0.31 EUR higher than the amount charged.",
    attachments: [
      {
        name: "invoice-total-mismatch.png",
        kind: "image",
        size: 331_776,
        after: 0.3,
        byId: "tomas",
        label: "Total 1,204.31 EUR vs charged 1,204.00 EUR",
        tone: "error",
      },
      {
        name: "invoice-8842.pdf",
        kind: "pdf",
        size: 214_016,
        after: 0.5,
        byId: "tomas",
      },
    ],
    comments: [
      {
        byId: "sofia",
        after: 6,
        body: "Fix moves rounding to the invoice aggregate. Ready for QA on staging — please re-check the credit note case as well.",
        reactions: [["👍", ["tomas", "rhea"]]],
      },
    ],
  },
  {
    id: "BUG-1040",
    title: "Report export worker times out on datasets above 50k rows",
    module: "Reporting",
    component: "Export Worker",
    severity: "high",
    priority: "P1",
    testerStatus: "open",
    developerStatus: "in-progress",
    reporterId: "grace",
    assigneeId: "marcus",
    watcherIds: ["daniel"],
    environment: "staging",
    browser: "Chrome 141",
    device: "Desktop",
    os: "Ubuntu 26.04",
    sprint: "Sprint 43",
    labels: ["performance", "api"],
    createdAt: "2026-08-02T11:05:00",
    age: 96,
    description:
      "Scheduled CSV exports fail silently once a report crosses roughly 50,000 rows. The worker hits the 30 second gateway timeout and the user is never told the export failed.",
    steps: [
      "Open Reporting and select the Quarterly Activity report.",
      "Set the range to the last 12 months so the result exceeds 50k rows.",
      "Trigger Export to CSV and wait for the email.",
      "Check the worker logs for the queued job.",
    ],
    expected:
      "The export streams to storage and the user receives a download link, regardless of row count.",
    actual:
      "The worker is killed at 30 seconds, the job is marked complete, and no email or error is delivered.",
    attachments: [
      {
        name: "export-worker-timeout.log",
        kind: "log",
        size: 1_258_291,
        after: 0.6,
        byId: "grace",
      },
      {
        name: "timeout-trace.png",
        kind: "image",
        size: 402_432,
        after: 0.8,
        byId: "grace",
        label: "504 Gateway Timeout — /api/reports/export",
        tone: "error",
      },
    ],
    comments: [
      {
        byId: "marcus",
        after: 20,
        body: "Switching the worker to a streaming cursor and moving it off the request path. Rough shape of the change:",
        code: "for await (const chunk of cursor.stream({ batchSize: 5_000 })) {\n  await sink.write(chunk)\n}",
        reactions: [["🎉", ["grace"]]],
      },
    ],
  },
  {
    id: "BUG-1039",
    title: "Daily digest email sends twice for users in UTC+13",
    module: "Notifications",
    component: "Email Digest",
    severity: "medium",
    priority: "P2",
    testerStatus: "verified",
    developerStatus: "fixed",
    reporterId: "noah",
    assigneeId: "lena",
    watcherIds: ["grace"],
    environment: "production",
    browser: "Not applicable",
    device: "Desktop",
    os: "Ubuntu 26.04",
    sprint: "Sprint 42",
    labels: ["regression"],
    createdAt: "2026-07-28T08:20:00",
    age: 168,
    description:
      "The digest scheduler buckets users by UTC offset. Offsets greater than +12 wrap to a negative bucket, so those users are enqueued in two windows and receive the digest twice.",
    steps: [
      "Set a test user's timezone to Pacific/Auckland during daylight saving.",
      "Enable the daily digest for that user.",
      "Wait for the 08:00 local scheduler window.",
      "Check the delivery log for that recipient.",
    ],
    expected: "Exactly one digest per user per day.",
    actual: "Two digests are delivered 60 minutes apart.",
    attachments: [
      {
        name: "duplicate-digest.png",
        kind: "image",
        size: 275_456,
        after: 0.4,
        byId: "noah",
        label: "2 identical digests received at 08:00 and 09:00",
      },
    ],
    comments: [
      {
        byId: "lena",
        after: 30,
        body: "Bucketing now uses the IANA zone instead of the raw offset, which also removes the DST edge case.",
        reactions: [["👍", ["noah", "grace"]]],
      },
      {
        byId: "noah",
        after: 140,
        replyTo: 0,
        body: "Verified on production for three UTC+13 accounts across two days. No duplicates.",
      },
    ],
  },
  {
    id: "BUG-1038",
    title: "Role editor lets an admin remove their own last admin role",
    module: "User Management",
    component: "Role Editor",
    severity: "high",
    priority: "P1",
    testerStatus: "open",
    developerStatus: "assigned",
    reporterId: "ishita",
    assigneeId: "priya",
    watcherIds: ["rhea"],
    environment: "staging",
    browser: "Edge 141",
    device: "Windows Laptop",
    os: "Windows 11",
    sprint: "Sprint 43",
    labels: ["security"],
    createdAt: "2026-08-05T10:02:00",
    age: 26,
    description:
      "The role editor validates role removal on the client only. An org's last administrator can strip their own admin role and lock the whole workspace out of settings.",
    steps: [
      "Sign in as the only administrator of a workspace.",
      "Open User Management and edit your own roles.",
      "Remove the Administrator role and save.",
      "Reload the settings page.",
    ],
    expected:
      "The save is rejected with an explanation that a workspace must keep at least one administrator.",
    actual:
      "The change is accepted and settings become unreachable for every member of the workspace.",
    attachments: [
      {
        name: "last-admin-removed.png",
        kind: "image",
        size: 358_400,
        after: 0.3,
        byId: "ishita",
        label: "You do not have permission to view settings",
        tone: "error",
      },
    ],
    comments: [
      {
        byId: "priya",
        after: 8,
        body: "Adding the invariant to the server handler as well, the client guard alone is not enough.",
      },
    ],
  },
  {
    id: "BUG-1037",
    title: "Search returns stale results after a saved filter is renamed",
    module: "Search",
    component: "Query Parser",
    severity: "medium",
    priority: "P2",
    testerStatus: "under-review",
    developerStatus: "ready-for-qa",
    reporterId: "grace",
    assigneeId: "daniel",
    environment: "staging",
    browser: "Chrome 141",
    device: "Desktop",
    os: "macOS 16.2",
    sprint: "Sprint 42",
    labels: ["ui"],
    createdAt: "2026-07-30T13:26:00",
    age: 120,
    description:
      "Renaming a saved filter does not invalidate the cached query key, so the results panel keeps rendering the previous filter's hits until a hard refresh.",
    steps: [
      "Save a search filter named `Open critical`.",
      "Rename it to `Open blockers`.",
      "Run the renamed filter from the sidebar.",
      "Compare the result count with a fresh page load.",
    ],
    expected: "The renamed filter runs and returns current results.",
    actual: "The panel shows results cached under the old filter name.",
    attachments: [
      {
        name: "stale-results.png",
        kind: "image",
        size: 244_736,
        after: 0.5,
        byId: "grace",
        label: "Showing 12 results for a filter that returns 4",
      },
    ],
  },
  {
    id: "BUG-1036",
    title: "Webhook retries fire without exponential backoff",
    module: "Integrations",
    component: "Webhook Delivery",
    severity: "high",
    priority: "P1",
    testerStatus: "open",
    developerStatus: "blocked",
    reporterId: "tomas",
    assigneeId: "marcus",
    watcherIds: ["rhea", "daniel"],
    environment: "production",
    browser: "Not applicable",
    device: "Desktop",
    os: "Ubuntu 26.04",
    sprint: "Sprint 43",
    labels: ["api", "performance", "customer-reported"],
    createdAt: "2026-08-01T16:48:00",
    age: 80,
    description:
      "Failed webhook deliveries retry every two seconds for an hour instead of backing off. Two customers have rate limited our IP range as a result.",
    steps: [
      "Register a webhook endpoint that responds with 500.",
      "Trigger any event that fans out to webhooks.",
      "Watch the delivery attempts in the integration log.",
    ],
    expected:
      "Retries back off exponentially and stop after the configured attempt budget.",
    actual: "1,800 attempts are made in the first hour at a fixed 2s interval.",
    attachments: [
      {
        name: "delivery-attempts.log",
        kind: "log",
        size: 3_355_443,
        after: 0.4,
        byId: "tomas",
      },
    ],
    comments: [
      {
        byId: "marcus",
        after: 18,
        body: "Blocked until the queue upgrade lands — the current driver has no delayed-retry support.",
        reactions: [["👀", ["rhea"]]],
      },
    ],
  },
  {
    id: "BUG-1035",
    title: "KPI cards show NaN while the comparison range is loading",
    module: "Dashboard",
    component: "KPI Cards",
    severity: "low",
    priority: "P3",
    testerStatus: "verified",
    developerStatus: "fixed",
    reporterId: "noah",
    assigneeId: "sofia",
    environment: "development",
    browser: "Safari 19",
    device: 'MacBook Pro 16"',
    os: "macOS 16.2",
    sprint: "Sprint 42",
    labels: ["ui"],
    createdAt: "2026-07-24T09:55:00",
    age: 200,
    description:
      "Trend deltas divide by an undefined previous value on first paint, so each card briefly renders `NaN%` before the comparison range resolves.",
    steps: [
      "Throttle the network to Slow 3G.",
      "Open the dashboard with a comparison range enabled.",
      "Watch the four KPI cards during the first second.",
    ],
    expected: "Cards render a skeleton until both ranges have resolved.",
    actual: "Cards render `NaN%` and then correct themselves.",
    attachments: [
      {
        name: "nan-trend.png",
        kind: "image",
        size: 189_440,
        after: 0.2,
        byId: "noah",
        label: "NaN% vs previous period",
        tone: "error",
      },
    ],
  },
  {
    id: "BUG-1034",
    title: "Multi-file upload silently drops files above 25 MB",
    module: "File Storage",
    component: "Upload Service",
    severity: "high",
    priority: "P1",
    testerStatus: "reopened",
    developerStatus: "in-progress",
    reporterId: "ishita",
    assigneeId: "aarav",
    watcherIds: ["grace"],
    environment: "staging",
    browser: "Chrome 141",
    device: "Windows Laptop",
    os: "Windows 11",
    sprint: "Sprint 43",
    labels: ["regression", "data-loss"],
    createdAt: "2026-07-31T15:30:00",
    age: 110,
    description:
      "Selecting several files at once uploads only those under the per-file limit. Oversized files disappear from the queue with no error, so users believe the upload succeeded.",
    steps: [
      "Open any record and start an attachment upload.",
      "Select four files, two of them larger than 25 MB.",
      "Confirm the upload and wait for it to finish.",
      "Reload the record and count the attachments.",
    ],
    expected:
      "Oversized files are rejected with a visible message naming each file.",
    actual: "Only the two small files appear; the others vanish without a trace.",
    attachments: [
      {
        name: "upload-queue.png",
        kind: "image",
        size: 297_984,
        after: 0.3,
        byId: "ishita",
        label: "4 files selected, 2 uploaded",
        tone: "error",
      },
      {
        name: "screen-recording-upload.mp4",
        kind: "recording",
        size: 22_020_096,
        after: 0.6,
        byId: "ishita",
        label: "Oversized files dropped from queue, 1:10",
      },
    ],
    comments: [
      {
        byId: "aarav",
        after: 12,
        body: "The client filter runs before validation and never reports what it removed. Reopening the error channel now.",
      },
      {
        byId: "ishita",
        after: 60,
        replyTo: 0,
        body: "Reopened — the message shows for a single oversized file but not when several are rejected at once.",
        reactions: [["🐛", ["aarav", "grace"]]],
      },
    ],
  },
  {
    id: "BUG-1033",
    title: "Audit log paginates past the end of the event stream",
    module: "Audit Log",
    component: "Event Stream",
    severity: "medium",
    priority: "P2",
    testerStatus: "closed",
    developerStatus: "fixed",
    reporterId: "grace",
    assigneeId: "lena",
    environment: "production",
    browser: "Chrome 141",
    device: "Desktop",
    os: "Windows 11",
    sprint: "Sprint 41",
    labels: ["api"],
    createdAt: "2026-07-16T10:15:00",
    age: 320,
    description:
      "The audit log cursor does not check for an empty page, so Next stays enabled forever and shows an empty table beyond the last event.",
    steps: [
      "Open the audit log for a workspace with fewer than 50 events.",
      "Click Next twice.",
    ],
    expected: "Next is disabled on the final page.",
    actual: "An empty table is rendered and Next remains clickable.",
  },
  {
    id: "BUG-1032",
    title: "Onboarding wizard loses progress when the browser is resized",
    module: "Onboarding",
    component: "Setup Wizard",
    severity: "medium",
    priority: "P2",
    testerStatus: "open",
    developerStatus: "backlog",
    reporterId: "noah",
    assigneeId: null,
    environment: "development",
    browser: "Safari 19",
    device: "iPad Air",
    os: "iOS 20",
    sprint: "Backlog",
    labels: ["ui", "mobile"],
    createdAt: "2026-08-06T09:40:00",
    age: 4,
    description:
      "Crossing the tablet breakpoint remounts the wizard because the layout swaps component trees, which resets the in-memory draft to step one.",
    steps: [
      "Start onboarding on an iPad in portrait orientation.",
      "Complete steps one and two.",
      "Rotate the device to landscape.",
    ],
    expected: "The wizard keeps the current step and the entered values.",
    actual: "The wizard restarts at step one with empty fields.",
    attachments: [
      {
        name: "wizard-reset.png",
        kind: "image",
        size: 262_144,
        after: 0.2,
        byId: "noah",
        label: "Step 1 of 4 — fields cleared",
        tone: "error",
      },
    ],
  },
  {
    id: "BUG-1031",
    title: "Rate limiter counts preflight requests against the caller quota",
    module: "API Gateway",
    component: "Rate Limiter",
    severity: "high",
    priority: "P1",
    testerStatus: "under-review",
    developerStatus: "ready-for-qa",
    reporterId: "tomas",
    assigneeId: "daniel",
    watcherIds: ["marcus"],
    environment: "staging",
    browser: "Chrome 141",
    device: "Desktop",
    os: "macOS 16.2",
    sprint: "Sprint 42",
    labels: ["api", "performance"],
    createdAt: "2026-07-29T12:12:00",
    age: 150,
    description:
      "CORS preflight OPTIONS requests are metered, so browser clients exhaust roughly half of their quota before sending a single real request.",
    steps: [
      "Call any browser-facing endpoint from a different origin.",
      "Inspect the X-RateLimit-Remaining header across ten calls.",
    ],
    expected: "Only non-preflight requests decrement the quota.",
    actual: "Each call decrements the quota twice.",
    comments: [
      {
        byId: "daniel",
        after: 40,
        body: "Preflight is now short-circuited before the limiter middleware.",
        code: 'if (request.method === "OPTIONS") return preflight(request)',
        reactions: [["👍", ["tomas"]]],
      },
    ],
  },
  {
    id: "BUG-1030",
    title: "Chart tooltips stay pinned after the pointer leaves the canvas",
    module: "Reporting",
    component: "Chart Renderer",
    severity: "low",
    priority: "P3",
    testerStatus: "verified",
    developerStatus: "fixed",
    reporterId: "ishita",
    assigneeId: "sofia",
    environment: "production",
    browser: "Firefox 137",
    device: "Windows Laptop",
    os: "Windows 11",
    sprint: "Sprint 41",
    labels: ["ui"],
    createdAt: "2026-07-14T14:05:00",
    age: 360,
    description:
      "Leaving the chart quickly through the top edge does not fire a pointer-out event, so the tooltip stays visible over the rest of the page.",
    steps: [
      "Hover any bar in the activity chart.",
      "Move the pointer up and out of the chart in one quick motion.",
    ],
    expected: "The tooltip disappears when the pointer leaves the chart.",
    actual: "The tooltip stays on screen until the next hover.",
  },
  {
    id: "BUG-1029",
    title: "Password reset link expires after 30 seconds instead of 30 minutes",
    module: "Authentication",
    component: "Session Store",
    severity: "critical",
    priority: "P0",
    testerStatus: "closed",
    developerStatus: "fixed",
    reporterId: "grace",
    assigneeId: "priya",
    watcherIds: ["rhea", "ishita"],
    environment: "production",
    browser: "Chrome 141",
    device: "iPhone 17",
    os: "iOS 20",
    sprint: "Sprint 41",
    labels: ["regression", "security", "customer-reported"],
    createdAt: "2026-07-10T08:30:00",
    age: 400,
    description:
      "A unit mix-up between seconds and minutes shortened the reset token lifetime to 30 seconds, so nearly every reset attempt failed with an invalid token error.",
    steps: [
      "Request a password reset email.",
      "Wait one minute, then open the link.",
    ],
    expected: "The link is valid for 30 minutes.",
    actual: "The link is rejected as expired.",
    attachments: [
      {
        name: "expired-token.png",
        kind: "image",
        size: 231_424,
        after: 0.3,
        byId: "grace",
        label: "This reset link has expired",
        tone: "error",
      },
    ],
    comments: [
      {
        byId: "priya",
        after: 3,
        body: "One-line fix, plus a regression test that asserts the TTL in seconds.",
        code: "-const RESET_TTL = 30\n+const RESET_TTL = 30 * 60",
        reactions: [["🎉", ["grace", "rhea", "ishita"]]],
      },
    ],
  },
  {
    id: "BUG-1028",
    title: "Bulk role assignment applies to filtered-out users",
    module: "User Management",
    component: "Role Editor",
    severity: "critical",
    priority: "P0",
    testerStatus: "open",
    developerStatus: "assigned",
    reporterId: "noah",
    assigneeId: "lena",
    watcherIds: ["rhea"],
    environment: "staging",
    browser: "Chrome 141",
    device: "Desktop",
    os: "Windows 11",
    sprint: "Sprint 43",
    labels: ["security", "data-loss"],
    createdAt: "2026-08-05T16:20:00",
    age: 20,
    description:
      "Select-all captures every user in the workspace rather than the current filter, so a bulk role change can hit hundreds of unintended accounts.",
    steps: [
      "Filter User Management to the Support team.",
      "Use the header checkbox to select all rows.",
      "Assign the Billing Admin role in bulk.",
      "Clear the filter and inspect the full user list.",
    ],
    expected: "Only users matching the active filter are changed.",
    actual: "Every user in the workspace receives the role.",
    attachments: [
      {
        name: "bulk-selection.png",
        kind: "image",
        size: 318_464,
        after: 0.2,
        byId: "noah",
        label: "12 shown, 486 selected",
        tone: "error",
      },
      {
        name: "affected-users.zip",
        kind: "archive",
        size: 5_242_880,
        after: 0.7,
        byId: "noah",
      },
    ],
  },
  {
    id: "BUG-1027",
    title: "Notification preferences reset when the profile drawer closes",
    module: "Notifications",
    component: "Email Digest",
    severity: "medium",
    priority: "P2",
    testerStatus: "open",
    developerStatus: "in-progress",
    reporterId: "ishita",
    assigneeId: "marcus",
    environment: "development",
    browser: "Chrome 141",
    device: 'MacBook Pro 16"',
    os: "macOS 16.2",
    sprint: "Sprint 43",
    labels: ["ui"],
    createdAt: "2026-08-04T17:05:00",
    age: 43,
    description:
      "Toggling notification switches updates local state but the drawer unmounts before the debounced save flushes, so the changes never reach the server.",
    steps: [
      "Open the profile drawer and switch off two notification types.",
      "Close the drawer within a second.",
      "Reopen the drawer.",
    ],
    expected: "The switches keep their new values.",
    actual: "Both switches are back on.",
  },
  {
    id: "BUG-1026",
    title: "Search highlights ignore diacritics for Latin scripts",
    module: "Search",
    component: "Query Parser",
    severity: "low",
    priority: "P3",
    testerStatus: "open",
    developerStatus: "backlog",
    reporterId: "tomas",
    assigneeId: null,
    environment: "production",
    browser: "Safari 19",
    device: 'MacBook Pro 16"',
    os: "macOS 16.2",
    sprint: "Backlog",
    labels: ["accessibility", "ui"],
    createdAt: "2026-08-06T11:50:00",
    age: 2,
    description:
      "Matching is accent-insensitive but highlighting is not, so results for `Tomas` return the right rows with nothing highlighted for `Tomás`.",
    steps: [
      "Search for `Tomas` without the accent.",
      "Inspect the highlighted spans in the result list.",
    ],
    expected: "The matched substring is highlighted in accented text too.",
    actual: "Rows match but no highlight is rendered.",
  },
  {
    id: "BUG-1025",
    title: "Dashboard date range picker allows an end date before the start",
    module: "Dashboard",
    component: "KPI Cards",
    severity: "medium",
    priority: "P2",
    testerStatus: "verified",
    developerStatus: "fixed",
    reporterId: "grace",
    assigneeId: "aarav",
    environment: "staging",
    browser: "Edge 141",
    device: "Windows Laptop",
    os: "Windows 11",
    sprint: "Sprint 42",
    labels: ["ui"],
    createdAt: "2026-07-27T09:05:00",
    age: 190,
    description:
      "The range picker accepts an inverted range, which produces an empty result set and a misleading zero on every card.",
    steps: [
      "Open the dashboard date range picker.",
      "Set the start to 1 July and the end to 1 June.",
      "Apply the range.",
    ],
    expected: "The picker refuses an end date earlier than the start date.",
    actual: "The range is applied and every metric reads zero.",
  },
  {
    id: "BUG-1024",
    title: "Attachment thumbnails fail to load behind the CDN cache",
    module: "File Storage",
    component: "Upload Service",
    severity: "high",
    priority: "P1",
    testerStatus: "under-review",
    developerStatus: "ready-for-qa",
    reporterId: "ishita",
    assigneeId: "daniel",
    watcherIds: ["sofia"],
    environment: "production",
    browser: "Chrome 141",
    device: "Pixel 10",
    os: "Android 17",
    sprint: "Sprint 42",
    labels: ["performance", "mobile"],
    createdAt: "2026-07-26T13:45:00",
    age: 210,
    description:
      "Signed thumbnail URLs are cached by the CDN with their expiry, so after 15 minutes every cached thumbnail returns 403 until the cache is purged.",
    steps: [
      "Upload an image attachment and load the record.",
      "Wait 20 minutes and reload from a different device.",
    ],
    expected: "Thumbnails load for any viewer at any time.",
    actual: "Thumbnails return 403 from the CDN edge.",
    attachments: [
      {
        name: "broken-thumbnails.png",
        kind: "image",
        size: 268_288,
        after: 0.4,
        byId: "ishita",
        label: "403 Forbidden on 6 of 6 thumbnails",
        tone: "error",
      },
    ],
  },
  {
    id: "BUG-1023",
    title: "Audit log export omits the actor column for system events",
    module: "Audit Log",
    component: "Export Worker",
    severity: "low",
    priority: "P3",
    testerStatus: "closed",
    developerStatus: "fixed",
    reporterId: "noah",
    assigneeId: "sofia",
    environment: "production",
    browser: "Not applicable",
    device: "Desktop",
    os: "Ubuntu 26.04",
    sprint: "Sprint 41",
    labels: ["api"],
    createdAt: "2026-07-08T15:20:00",
    age: 430,
    description:
      "System-generated events have no actor record, and the exporter writes an empty cell instead of the `system` sentinel used in the UI.",
    steps: [
      "Export the audit log for a range containing scheduled jobs.",
      "Open the CSV and look at the actor column.",
    ],
    expected: "System events export with the actor `system`.",
    actual: "The actor cell is empty.",
  },
  {
    id: "BUG-1022",
    title: "Integration setup rejects valid API keys containing plus signs",
    module: "Integrations",
    component: "Webhook Delivery",
    severity: "medium",
    priority: "P2",
    testerStatus: "reopened",
    developerStatus: "assigned",
    reporterId: "tomas",
    assigneeId: "priya",
    environment: "staging",
    browser: "Firefox 137",
    device: "Desktop",
    os: "Ubuntu 26.04",
    sprint: "Sprint 43",
    labels: ["api", "regression"],
    createdAt: "2026-08-03T10:35:00",
    age: 70,
    description:
      "Keys are trimmed with a pattern that also strips `+`, so any key containing one is stored corrupted and every request from it is rejected.",
    steps: [
      "Paste an API key that contains a plus sign into the integration form.",
      "Save and run the connection test.",
    ],
    expected: "The key is stored verbatim and the test passes.",
    actual: "The stored key is missing the plus sign and the test fails.",
    comments: [
      {
        byId: "tomas",
        after: 50,
        body: "Reopened: `+` is fixed but keys with a trailing `=` are still mangled.",
        reactions: [["🐛", ["priya"]]],
      },
    ],
  },
  {
    id: "BUG-1021",
    title: "Session stays alive after the user revokes it from another device",
    module: "Authentication",
    component: "Session Store",
    severity: "critical",
    priority: "P1",
    testerStatus: "under-review",
    developerStatus: "in-progress",
    reporterId: "grace",
    assigneeId: "lena",
    watcherIds: ["rhea", "aarav"],
    environment: "production",
    browser: "Safari 19",
    device: "iPhone 17",
    os: "iOS 20",
    sprint: "Sprint 43",
    labels: ["security", "customer-reported"],
    createdAt: "2026-08-02T18:15:00",
    age: 90,
    description:
      "Revoking a session removes the database row but the gateway keeps its token in an in-memory cache for up to 15 minutes, leaving the revoked device fully authenticated.",
    steps: [
      "Sign in on two devices.",
      "Revoke the second device's session from security settings.",
      "Continue browsing on the revoked device.",
    ],
    expected: "The revoked device is signed out on its next request.",
    actual: "It keeps working for up to 15 minutes.",
    attachments: [
      {
        name: "gateway-cache.log",
        kind: "log",
        size: 655_360,
        after: 0.5,
        byId: "grace",
      },
    ],
    comments: [
      {
        byId: "lena",
        after: 22,
        body: "Publishing a revocation event to the gateway so the cache entry is dropped immediately.",
        reactions: [["👀", ["rhea", "aarav"]]],
      },
    ],
  },
  {
    id: "BUG-1020",
    title: "Billing page shows a negative balance for prepaid accounts",
    module: "Billing",
    component: "Invoice PDF",
    severity: "medium",
    priority: "P2",
    testerStatus: "open",
    developerStatus: "backlog",
    reporterId: "ishita",
    assigneeId: null,
    environment: "production",
    browser: "Chrome 141",
    device: 'MacBook Pro 16"',
    os: "macOS 16.2",
    sprint: "Backlog",
    labels: ["ui", "customer-reported"],
    createdAt: "2026-08-06T14:25:00",
    age: 1,
    description:
      "Prepaid credit is stored as a negative balance internally but rendered without conversion, so customers with credit appear to owe money.",
    steps: [
      "Open the billing page for an account with prepaid credit.",
      "Read the balance summary.",
    ],
    expected: "Credit is shown as available balance.",
    actual: "The balance reads `-240.00 USD` with an overdue style.",
  },
  {
    id: "BUG-1019",
    title: "Report scheduler drops the timezone when a schedule is duplicated",
    module: "Reporting",
    component: "Export Worker",
    severity: "medium",
    priority: "P2",
    testerStatus: "verified",
    developerStatus: "fixed",
    reporterId: "noah",
    assigneeId: "marcus",
    environment: "staging",
    browser: "Chrome 141",
    device: "Desktop",
    os: "Windows 11",
    sprint: "Sprint 42",
    labels: ["regression"],
    createdAt: "2026-07-25T11:35:00",
    age: 205,
    description:
      "Duplicating a schedule copies the cron expression but not the timezone, so the copy runs in UTC.",
    steps: [
      "Create a schedule at 09:00 Europe/Berlin.",
      "Duplicate it and inspect the copy.",
    ],
    expected: "The duplicate keeps the original timezone.",
    actual: "The duplicate runs at 09:00 UTC.",
  },
  {
    id: "BUG-1018",
    title: "Keyboard focus escapes the modal when tabbing backwards",
    module: "Dashboard",
    component: "KPI Cards",
    severity: "medium",
    priority: "P2",
    testerStatus: "closed",
    developerStatus: "fixed",
    reporterId: "grace",
    assigneeId: "aarav",
    environment: "production",
    browser: "Firefox 137",
    device: "Windows Laptop",
    os: "Windows 11",
    sprint: "Sprint 41",
    labels: ["accessibility"],
    createdAt: "2026-07-06T10:45:00",
    age: 470,
    description:
      "Shift+Tab from the first focusable element in a modal moves focus to the page behind it instead of wrapping to the last element.",
    steps: [
      "Open any modal.",
      "Press Shift+Tab from the first focusable control.",
    ],
    expected: "Focus wraps to the last focusable element inside the modal.",
    actual: "Focus lands on the page behind the overlay.",
  },
  {
    id: "BUG-1017",
    title: "Gateway returns 500 instead of 413 for oversized payloads",
    module: "API Gateway",
    component: "Rate Limiter",
    severity: "low",
    priority: "P3",
    testerStatus: "open",
    developerStatus: "backlog",
    reporterId: "tomas",
    assigneeId: null,
    environment: "development",
    browser: "Not applicable",
    device: "Desktop",
    os: "Ubuntu 26.04",
    sprint: "Backlog",
    labels: ["api"],
    createdAt: "2026-08-05T08:15:00",
    age: 28,
    description:
      "The body size guard throws before the error mapper runs, so clients see an opaque 500 for a request they could fix themselves.",
    steps: ["POST a 12 MB JSON body to any write endpoint."],
    expected: "413 Payload Too Large with the configured limit in the body.",
    actual: "500 Internal Server Error with no detail.",
  },
];

function attachmentFrom(seed: SeedAttachment, createdAt: string) {
  const label = seed.label ?? seed.name;
  const media =
    seed.kind === "image"
      ? screenshotDataUri(label, seed.tone ?? "neutral")
      : seed.kind === "recording" || seed.kind === "video"
        ? recordingPosterDataUri(label)
        : null;

  return {
    id: `${seed.name}-${seed.after}`,
    name: seed.name,
    kind: seed.kind,
    size: seed.size,
    // Seeded recordings have a poster frame but no playable source.
    url: seed.kind === "image" ? media : null,
    thumbnail: media,
    uploadedAt: shiftHours(createdAt, seed.after),
    uploadedById: seed.byId,
    progress: 100,
    status: "ready" as const,
  };
}

function commentsFrom(seeds: SeedComment[], bugId: string, createdAt: string) {
  const ids = seeds.map((_, index) => `${bugId}-c${index + 1}`);
  return seeds.map<Comment>((seed, index) => ({
    id: ids[index],
    authorId: seed.byId,
    at: shiftHours(createdAt, seed.after),
    body: seed.body,
    parentId: seed.replyTo === undefined ? null : ids[seed.replyTo],
    code: seed.code ?? null,
    attachments: (seed.attachments ?? []).map((attachment) =>
      attachmentFrom(attachment, createdAt)
    ),
    reactions: (seed.reactions ?? []).map<Reaction>(([emoji, byIds]) => ({
      emoji,
      byIds,
    })),
  }));
}

/** Statuses imply the milestones a bug must already have passed through. */
function milestonesFor(seed: SeedBug): Array<Omit<ActivityEntry, "id" | "at">> {
  const entries: Array<Omit<ActivityEntry, "id" | "at">> = [];
  const assignee = seed.assigneeId;
  const developerFlow: Record<DeveloperStatus, DeveloperStatus[]> = {
    backlog: [],
    assigned: ["assigned"],
    "in-progress": ["assigned", "in-progress"],
    "ready-for-qa": ["assigned", "in-progress", "ready-for-qa"],
    fixed: ["assigned", "in-progress", "ready-for-qa", "fixed"],
    blocked: ["assigned", "in-progress", "blocked"],
  };
  const testerFlow: Record<TesterStatus, TesterStatus[]> = {
    open: [],
    "under-review": ["under-review"],
    verified: ["under-review", "verified"],
    reopened: ["under-review", "reopened"],
    closed: ["under-review", "verified", "closed"],
  };

  if (assignee) {
    entries.push({
      kind: "assigned",
      actorId: "rhea",
      summary: `assigned this to ${personName(assignee)}`,
    });
  }

  let previousDeveloper: DeveloperStatus = "backlog";
  for (const status of developerFlow[seed.developerStatus]) {
    if (status === "assigned") {
      previousDeveloper = status;
      continue;
    }
    entries.push({
      kind: status === "fixed" ? "fixed" : "status",
      actorId: assignee ?? "rhea",
      summary: "changed developer status",
      from: DEVELOPER_STATUS_LABELS[previousDeveloper],
      to: DEVELOPER_STATUS_LABELS[status],
    });
    previousDeveloper = status;
  }

  let previousTester: TesterStatus = "open";
  for (const status of testerFlow[seed.testerStatus]) {
    entries.push({
      kind:
        status === "verified"
          ? "verified"
          : status === "closed"
            ? "closed"
            : status === "reopened"
              ? "reopened"
              : "status",
      actorId: seed.reporterId,
      summary: "changed tester status",
      from: TESTER_STATUS_LABELS[previousTester],
      to: TESTER_STATUS_LABELS[status],
    });
    previousTester = status;
  }

  return entries;
}

function activityFrom(seed: SeedBug, comments: Comment[]): ActivityEntry[] {
  const milestones = milestonesFor(seed);
  const entries: ActivityEntry[] = [
    {
      id: `${seed.id}-a0`,
      kind: "created",
      actorId: seed.reporterId,
      at: seed.createdAt,
      summary: "reported this bug",
    },
  ];

  for (const attachment of seed.attachments ?? []) {
    entries.push({
      id: `${seed.id}-att-${attachment.name}`,
      kind: "attachment",
      actorId: attachment.byId,
      at: shiftHours(seed.createdAt, attachment.after),
      summary: `attached ${attachment.name}`,
    });
  }

  // Milestones are spread evenly between creation and the last update so the
  // timeline reads in a plausible order without hand-written timestamps.
  const step = milestones.length > 0 ? seed.age / (milestones.length + 1) : 0;
  milestones.forEach((milestone, index) => {
    entries.push({
      ...milestone,
      id: `${seed.id}-m${index}`,
      at: shiftHours(seed.createdAt, step * (index + 1)),
    });
  });

  for (const comment of comments) {
    entries.push({
      id: `${seed.id}-cm-${comment.id}`,
      kind: "comment",
      actorId: comment.authorId,
      at: comment.at,
      summary: "added a comment",
    });
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

function expand(seed: SeedBug): Bug {
  const comments = commentsFrom(seed.comments ?? [], seed.id, seed.createdAt);
  return {
    id: seed.id,
    projectId: PROJECT_BY_MODULE[seed.module] ?? DEFAULT_PROJECT_ID,
    title: seed.title,
    description: seed.description,
    module: seed.module,
    component: seed.component,
    severity: seed.severity,
    priority: seed.priority,
    testerStatus: seed.testerStatus,
    developerStatus: seed.developerStatus,
    reporterId: seed.reporterId,
    assigneeId: seed.assigneeId ?? null,
    watcherIds: seed.watcherIds ?? [],
    environment: seed.environment,
    browser: seed.browser,
    device: seed.device,
    os: seed.os,
    sprint: seed.sprint,
    labels: seed.labels,
    stepsToReproduce: seed.steps,
    expectedResult: seed.expected,
    actualResult: seed.actual,
    attachments: (seed.attachments ?? []).map((attachment) =>
      attachmentFrom(attachment, seed.createdAt)
    ),
    activity: activityFrom(seed, comments),
    comments,
    createdAt: seed.createdAt,
    updatedAt: shiftHours(seed.createdAt, seed.age),
  };
}

export const SEED_BUGS: Bug[] = SEED.map(expand);

/** Bug ids are sequential, so the next one continues from the highest seed. */
export function nextBugId(bugs: Bug[]): string {
  const highest = bugs.reduce((max, bug) => {
    const value = Number.parseInt(bug.id.replace(/\D/g, ""), 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 1000);
  return `BUG-${highest + 1}`;
}

export const DEFAULT_ENVIRONMENT: Environment = "production";
export const DEFAULT_SEVERITY: Severity = "medium";
export const DEFAULT_PRIORITY: Priority = "P2";
