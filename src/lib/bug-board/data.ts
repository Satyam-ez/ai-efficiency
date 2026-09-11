/**
 * Reference data for the board — people, option lists and the signed-in user.
 *
 * This used to hold the mock board (26 hardcoded bugs). The bugs now live in
 * Postgres, so what remains is a small registry that the provider hydrates from
 * `/api/meta/` once at boot.
 *
 * The arrays are **mutated in place** rather than replaced, so the components
 * that import `PEOPLE` / `DEVELOPERS` / `MODULES` directly keep reading a live
 * value without every one of them having to thread a prop or subscribe to a
 * context. Hydration happens before the board renders, and the provider's own
 * state change drives the re-render that shows the filled-in lists.
 */

import type {
  Environment,
  Person,
  Priority,
  Severity,
} from "@/lib/bug-board/types";

/** Everyone who can report, be assigned, or watch a bug. */
export const PEOPLE: Person[] = [];
export const DEVELOPERS: Person[] = [];
export const TESTERS: Person[] = [];

let peopleById = new Map<string, Person>();

/** The signed-in person's id, or `null` before the session resolves. */
let currentUserId: string | null = null;

export function currentUserIdOrThrow(): string {
  if (!currentUserId) {
    throw new Error("No signed-in user: the board renders behind a login gate.");
  }
  return currentUserId;
}

/** `null` until the session is known, so callers can render a signed-out state. */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function setCurrentUserId(id: string | null): void {
  currentUserId = id;
}

export function personOf(id: string | null | undefined): Person | undefined {
  return id ? peopleById.get(id) : undefined;
}

export function personName(id: string | null | undefined): string {
  return personOf(id)?.name ?? "Unassigned";
}

/** Relative times are measured against the real clock now that data is real. */
export function boardNowMs(): number {
  return Date.now();
}

/** Length of a sprint, used for the "closed this sprint" window. */
export const SPRINT_DAYS = 14;

// The option lists behind the form and filter dropdowns. These are suggestions,
// not constraints — the API accepts any string — so they start as sensible
// defaults and are replaced by whatever the board is actually using.
export const MODULES: string[] = [];
export const COMPONENTS: string[] = [];
export const SPRINTS: string[] = [];
export const LABELS: string[] = [];
export const BROWSERS: string[] = [];
export const DEVICES: string[] = [];
export const OPERATING_SYSTEMS: string[] = [];
export const REACTION_EMOJI: string[] = ["👍", "🎉", "👀", "🐛", "🙏"];

export const DEFAULT_ENVIRONMENT: Environment = "production";
export const DEFAULT_SEVERITY: Severity = "medium";
export const DEFAULT_PRIORITY: Priority = "P2";

function refill<T>(target: T[], values: readonly T[]): void {
  target.splice(0, target.length, ...values);
}

/** What `/api/meta/` returns, narrowed to the parts this registry holds. */
export interface RegistryPayload {
  people: Person[];
  modules: string[];
  components: string[];
  sprints: string[];
  labels: string[];
  browsers: string[];
  devices: string[];
  operatingSystems: string[];
  reactionEmoji: string[];
}

export function hydrateRegistry(meta: RegistryPayload): void {
  refill(PEOPLE, meta.people);
  refill(
    DEVELOPERS,
    meta.people.filter((person) => person.role === "developer")
  );
  refill(
    TESTERS,
    meta.people.filter((person) => person.role === "tester")
  );
  peopleById = new Map(meta.people.map((person) => [person.id, person]));

  refill(MODULES, meta.modules);
  refill(COMPONENTS, meta.components);
  refill(SPRINTS, meta.sprints);
  refill(LABELS, meta.labels);
  refill(BROWSERS, meta.browsers);
  refill(DEVICES, meta.devices);
  refill(OPERATING_SYSTEMS, meta.operatingSystems);
  if (meta.reactionEmoji?.length) refill(REACTION_EMOJI, meta.reactionEmoji);
}
