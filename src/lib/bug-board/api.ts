/**
 * Client for the Django backend.
 *
 * Paths carry no trailing slash: the Next.js rewrite that fronts this API
 * strips one when forwarding, which used to collide with Django's
 * APPEND_SLASH and loop. The router is configured to match (see
 * backend/config/urls.py).
 *
 * Everything goes to `/api/...` on this same origin — `next.config.ts` proxies
 * that to Django, which is what lets the session cookie ride along untouched
 * and keeps Django's CSRF referer check happy.
 */

import type {
  Attachment,
  Bug,
  DeveloperStatus,
  Person,
  Priority,
  Project,
  Severity,
  TesterStatus,
} from "@/lib/bug-board/types";

const BASE = "/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Field-keyed messages from DRF, when the failure was a validation error. */
    readonly fields: Record<string, string> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** DRF reports errors as `{detail}`, `{field: [msg]}`, or a bare string. */
function describe(status: number, body: unknown): ApiError {
  if (typeof body === "string" && body) return new ApiError(status, body);
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") {
      return new ApiError(status, record.detail);
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      fields[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
    const first = Object.values(fields)[0];
    return new ApiError(status, first ?? `Request failed (${status})`, fields);
  }
  return new ApiError(status, `Request failed (${status})`);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Django needs the CSRF token echoed in a header on every unsafe request. The
 * cookie is set by `GET /api/auth/csrf`, which `ensureCsrf` fetches once if
 * the cookie is not already there.
 */
async function ensureCsrf(): Promise<string | null> {
  const existing = readCookie("csrftoken");
  if (existing) return existing;
  await fetch(`${BASE}/auth/csrf`, { credentials: "same-origin" });
  return readCookie("csrftoken");
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  body?: unknown
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  let payload = init.body;

  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers.set("Content-Type", "application/json");
      payload = JSON.stringify(body);
    }
  }

  if (method !== "GET" && method !== "HEAD") {
    const token = await ensureCsrf();
    if (token) headers.set("X-CSRFToken", token);
  }

  const response = await fetch(`${BASE}${path}`, {
    ...init,
    method,
    headers,
    body: payload,
    credentials: "same-origin",
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const parsed = text ? safeJson(text) : null;

  if (!response.ok) throw describe(response.status, parsed ?? text);
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** The signed-in person, plus the fields only they see. */
export interface CurrentUser extends Person {
  email: string;
  is_staff: boolean;
}

export interface BoardMeta {
  people: Person[];
  severities: Severity[];
  priorities: Priority[];
  testerStatuses: TesterStatus[];
  developerStatuses: DeveloperStatus[];
  environments: string[];
  modules: string[];
  components: string[];
  sprints: string[];
  browsers: string[];
  devices: string[];
  operatingSystems: string[];
  labels: string[];
  reactionEmoji: string[];
}

export const api = {
  // ---- auth ----
  async me(): Promise<CurrentUser | null> {
    try {
      return await request<CurrentUser>("/auth/me");
    } catch (error) {
      // A signed-out visitor is an expected state, not a failure.
      if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
        return null;
      }
      throw error;
    }
  },

  login(username: string, password: string): Promise<CurrentUser> {
    return request<CurrentUser>("/auth/login", { method: "POST" }, {
      username,
      password,
    });
  },

  logout(): Promise<void> {
    return request<void>("/auth/logout", { method: "POST" }, {});
  },

  // ---- reference data ----
  meta(): Promise<BoardMeta> {
    return request<BoardMeta>("/meta");
  },

  people(): Promise<Person[]> {
    return request<Person[]>("/people");
  },

  // ---- projects ----
  projects(): Promise<Project[]> {
    return request<Project[]>("/projects");
  },

  createProject(draft: { name: string; description: string }): Promise<Project> {
    return request<Project>("/projects", { method: "POST" }, draft);
  },

  updateProject(
    id: string,
    draft: { name: string; description: string }
  ): Promise<Project> {
    return request<Project>(`/projects/${id}`, { method: "PATCH" }, draft);
  },

  deleteProject(id: string, moveTo: string | null): Promise<void> {
    const query = moveTo ? `?moveTo=${encodeURIComponent(moveTo)}` : "";
    return request<void>(`/projects/${id}${query}`, { method: "DELETE" });
  },

  // ---- bugs ----
  /**
   * Every bug, in full. The board filters, sorts and paginates in the browser —
   * the same code it always used — so it needs the whole set, not a page.
   */
  async bugs(): Promise<Bug[]> {
    const collected: Bug[] = [];
    let path: string | null = "/bugs?pageSize=100";
    while (path) {
      const page: Page<Bug> = await request<Page<Bug>>(path);
      collected.push(...page.results);
      // `next` comes back absolute; only the query matters for the next hop.
      path = page.next ? `/bugs${new URL(page.next, window.location.origin).search}` : null;
    }
    return collected;
  },

  bug(key: string): Promise<Bug> {
    return request<Bug>(`/bugs/${key}`);
  },

  createBug(payload: Record<string, unknown>): Promise<Bug> {
    return request<Bug>("/bugs", { method: "POST" }, payload);
  },

  updateBug(key: string, payload: Record<string, unknown>): Promise<Bug> {
    return request<Bug>(`/bugs/${key}`, { method: "PATCH" }, payload);
  },

  duplicateBug(key: string): Promise<Bug> {
    return request<Bug>(`/bugs/${key}/duplicate`, { method: "POST" }, {});
  },

  /** One request per user action, however many rows are selected. */
  bulk(
    ids: string[],
    action:
      | "testerStatus"
      | "developerStatus"
      | "severity"
      | "priority"
      | "assign"
      | "move"
      | "delete",
    value?: string | null
  ): Promise<{ matched?: number; changed?: number; deleted?: number }> {
    return request("/bugs/bulk", { method: "POST" }, { ids, action, value });
  },

  // ---- comments, reactions, evidence ----
  addComment(
    key: string,
    payload: {
      body: string;
      code: string | null;
      parentId: string | null;
      attachmentIds: string[];
    }
  ): Promise<unknown> {
    return request(`/bugs/${key}/comments`, { method: "POST" }, payload);
  },

  toggleReaction(commentId: string, emoji: string): Promise<unknown> {
    return request(`/comments/${commentId}/reactions`, { method: "POST" }, {
      emoji,
    });
  },

  uploadAttachment(key: string, file: File, kind: string): Promise<Attachment> {
    const form = new FormData();
    form.append("file", file);
    form.append("name", file.name);
    form.append("kind", kind);
    return request<Attachment>(
      `/bugs/${key}/attachments`,
      { method: "POST" },
      form
    );
  },

  deleteAttachment(id: string): Promise<void> {
    return request<void>(`/attachments/${id}`, { method: "DELETE" });
  },
};
