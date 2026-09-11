# Bug Board — Backend Plan

Status: **complete — backend, frontend wiring and end-to-end UI verification all done.**
Last updated: 2026-09-10

The Bug Board frontend used to hold all of its state in React memory, seeded
from `src/lib/bug-board/data.ts` (26 bugs, 4 projects, 11 people) — reload the
page and every bug, comment and upload was gone. It now reads and writes a real
Django + Postgres backend, behind a login.

---

## 1. Decisions

| Area | Choice | Why |
| --- | --- | --- |
| Backend | **Django 5.2 LTS + Django REST Framework 3.18** | Auth, migrations, admin and permissions are built in — which is what makes "real auth now" cheap. |
| Database | **Postgres 16 in its own container, host port `5433`** | Keeps this project fully isolated from the `kodus` stack already running on 5432. |
| Auth | **Real auth now** — custom `User` model, session-cookie login | Every write already records an actor (`reporterId`, `authorId`, `actorId`), so the actor must be a real authenticated user, not a hardcoded id. |
| Python tooling | **`uv`** (installed at `~/.local/bin/uv`) | The host has no `pip`, no `ensurepip`, no `python3-venv`, and no password-less `sudo`. `uv` installs to `$HOME` and needs none of them. |
| Layout | `backend/` inside this repo (monorepo) | One clone, one `docker compose up`, frontend and backend versioned together. |

### Environment facts this plan is built on

- Python 3.12.3 on the host; **no `pip`/`venv` bootstrap** → `uv` is required.
- Docker 29.1.3 + docker-compose available.
- Port 5432 is **taken** by the `kodus` project's `db_postgres` container → we use 5433.
- Node 24.11.1, Next.js 16.2.6 frontend on port 3000.

### Ports

| Service | Port |
| --- | --- |
| Next.js frontend | 3000 |
| Django API | 8000 |
| Postgres (this project) | 5433 |
| Postgres (kodus, untouched) | 5432 |

---

## 2. Secrets and git hygiene

Credentials never enter the repo.

- `backend/.env` — real values (`SECRET_KEY`, `POSTGRES_PASSWORD`, …). **Git-ignored.**
- `backend/.env.example` — same keys, placeholder values. **Committed**, so the
  next person knows what to fill in.
- `.gitignore` gains the Python/Django entries (`__pycache__/`, `.venv/`,
  `backend/media/`, `backend/staticfiles/`, `*.sqlite3`) plus an explicit
  un-ignore for `.env.example`, because the existing `.env*` rule would
  otherwise swallow the template too.

`docker-compose.yml` reads its Postgres password from `backend/.env` — no
password is written into the compose file.

---

## 3. Data model

Mapping `src/lib/bug-board/types.ts` onto Django models. The API keeps the
frontend's camelCase field names so the existing TypeScript types stay valid.

### `accounts.User` — replaces `Person`

`AbstractUser` subclass (a custom user model is set from the first migration —
switching later is painful).

| Field | Notes |
| --- | --- |
| `username` | Keeps the seeded slug: `ishita`, `aarav`, … so seeded ids survive. |
| `name` | Display name, e.g. `Ishita Rao`. |
| `initials` | 2 chars, auto-derived from `name` when blank. |
| `role` | `developer` \| `tester` \| `manager`. |
| `email`, `password` | Django handles hashing (PBKDF2). |

### `projects.Project`

`id` (UUID pk), `name`, `description`, `created_at`.
Seeded projects get fixed UUIDs so links stay stable.

### `bugs.Bug`

The human-readable key is what the frontend and shared links use
(`?bugs=BUG-1042`), so it is a first-class unique column, not a derived value.

| Field | Type |
| --- | --- |
| `id` (pk) | BigAuto, internal only |
| `number` | int, unique — from a Postgres sequence starting at **1043** (seed occupies 1017–1042) |
| `key` | `BUG-{number}`, unique + indexed — **this is the `id` the API exposes** |
| `project` | FK → Project (`PROTECT`; deleting a project requires moving its bugs, matching `deleteProject`) |
| `title`, `description`, `module`, `component` | text |
| `severity` | `critical` \| `high` \| `medium` \| `low` |
| `priority` | `P0`–`P3` |
| `tester_status` | `open` \| `under-review` \| `verified` \| `reopened` \| `closed` |
| `developer_status` | `backlog` \| `assigned` \| `in-progress` \| `ready-for-qa` \| `fixed` \| `blocked` |
| `reporter` | FK → User |
| `assignee` | FK → User, nullable |
| `watchers` | M2M → User |
| `environment` | `production` \| `staging` \| `development` |
| `browser`, `device`, `os`, `sprint` | text |
| `labels` | Postgres `ArrayField(CharField)` |
| `steps_to_reproduce` | `ArrayField(TextField)` — ordered, so an array beats a child table |
| `expected_result`, `actual_result` | text |
| `created_at`, `updated_at` | timestamps |

Choice values are byte-identical to the TS string literals (kebab-case included)
so no translation layer is needed.

### `bugs.Attachment`

| Field | Notes |
| --- | --- |
| `bug` | FK → Bug (always set) |
| `comment` | FK → Comment, **nullable** |
| `name`, `kind`, `size` | `kind` ∈ image/video/recording/pdf/archive/log/file |
| `file` | `FileField` → `MEDIA_ROOT` |
| `thumbnail` | poster image, nullable |
| `uploaded_by` | FK → User |
| `uploaded_at` | timestamp |

The nullable `comment` FK reproduces the current behaviour exactly: a file
attached to a comment shows up in that comment *and* in the bug's evidence list.
`progress` and `status` stay client-side — they describe an in-flight browser
upload, so the server only ever stores a finished file.

### `bugs.Comment`

`bug` FK, `author` FK, `body`, `parent` (self-FK, nullable → threaded replies),
`code` (nullable snippet), `created_at`.

### `bugs.Reaction`

`comment` FK, `user` FK, `emoji`, with `unique_together(comment, user, emoji)`.
Stored one row per person, serialized back grouped as
`{ emoji, byIds: [...] }` for the frontend.

### `bugs.Activity`

`bug` FK, `kind` (the 13 `ACTIVITY_KINDS`), `actor` FK, `summary`,
`from_value`, `to_value`, `at`.
**Written by the server**, not the client — the endpoint that changes a status is
the thing that knows what changed, so the audit trail cannot be forged or
forgotten.

---

## 4. API surface

Prefix `/api/`. Payloads use camelCase to match the existing TS types.

### Auth
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/auth/csrf/` | sets the CSRF cookie before the login POST |
| POST | `/api/auth/login/` | username + password → session cookie |
| POST | `/api/auth/logout/` | clear session |
| GET | `/api/auth/me/` | current user, for `CURRENT_USER_ID` |

### Projects
`GET/POST /api/projects/`, `GET/PATCH/DELETE /api/projects/{id}/`
Delete accepts `?moveTo={id}` and refuses to orphan bugs — the server-side twin
of the existing `deleteProject(id, moveToId)` rule.

### Bugs
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/bugs/` | list — filters, search, ordering, pagination |
| POST | `/api/bugs/` | create (allocates the next `BUG-####`) |
| GET/PATCH/DELETE | `/api/bugs/{key}/` | single bug |
| POST | `/api/bugs/{key}/duplicate/` | mirrors `duplicateBug` |
| GET | `/api/bugs/summary/` | the summary-card counts |

Query params map 1:1 onto `BugFilters`: `query`, `projectIds`, `bugIds`,
`testerStatus`, `developerStatus`, `severity`, `priority`, `assigneeIds`,
`reporterIds`, `modules`, `sprints`, `environments`, `createdFrom`, `createdTo`,
plus `sort` (any `SORT_KEYS` value) with `direction=asc|desc`, and `page` /
`pageSize` for paging. Facets accept either `?severity=critical,high` or a
repeated `?severity=critical&severity=high`.

### Bulk actions
Every board mutation is already array-shaped (`setTesterStatus(ids, status)`), so
the API is too — one request per user action, not one per row:

`POST /api/bugs/bulk/` with `{ ids: [...], action: "...", value: ... }`
covering `testerStatus`, `developerStatus`, `severity`, `priority`, `assign`,
`move`, `delete`.

### Comments, attachments, reactions
- `GET/POST /api/bugs/{key}/comments/`
- `POST /api/comments/{id}/reactions/` — toggles one emoji for the current user
- `POST /api/bugs/{key}/attachments/` — multipart upload
- `DELETE /api/attachments/{id}/`

### People
`GET /api/people/` — the pickers' list of who can report, be assigned or watch.

### Meta
`GET /api/meta/` — the option lists the forms need (modules, components,
sprints, labels, browsers, devices, operating systems, people, enum choices),
so `data.ts` stops being the source of truth for dropdowns.

---

## 4b. Where the API differs from today's frontend types

These are the only places the wired-up frontend will need a small change. Worth
reading before step 10.

| What | Today in `data.ts` | Now from the API | Why |
| --- | --- | --- | --- |
| `Bug.projectId` | `"proj-atlas"` | a UUID (`b6efa9ac-…`) | Projects are user-created rows, so their ids are generated, not authored. The seed derives each UUID deterministically from the old slug, so a reseed keeps the same id. |
| `Bug.id` | `"BUG-1042"` | unchanged | Kept as a real column precisely so links and exports keep working. |
| `Attachment.id`, `Comment.id`, `ActivityEntry.id` | `"cmt-…"` strings | database ids, **serialized as strings** | `types.ts` declares them `string`, and identity checks like `item.id !== attachmentId` would silently fail against numbers. |
| Summary cards | `summarize()` builds label + hint + delta | `/api/bugs/summary/` returns **raw counts only** | The card copy is presentation. Duplicating those strings in Python would put UI wording in the backend; `summarize()` stays and consumes the counts. |
| `stepsToReproduce` | `BugDraft` sends one textarea string; `Bug` holds a list | endpoint accepts **either** | Both shapes are posted by the existing form code, so both are normalised server-side (numbering the user typed is stripped, exactly as `splitSteps` did). |
| Relative dates | measured from a frozen `BOARD_NOW` (2026-08-07) | measured from the real clock | The seed is now genuinely historical data, so "closed this sprint" reads 0 against August rows. Expected, not a bug.

## 5. Execution steps

- [x] **1. Scaffold** — `backend/` with `uv` (`pyproject.toml`), Django 5, DRF,
      `psycopg`, `django-filter`, `django-cors-headers`, `python-dotenv`.
- [x] **2. Postgres** — `docker-compose.yml` with a `bugboard_db` service on
      5433 and a named volume; bring it up and verify a connection.
- [x] **3. Env + gitignore** — `backend/.env`, `backend/.env.example`, and the
      `.gitignore` additions from §2.
- [x] **4. Settings** — split-free single settings module reading `.env`:
      `AUTH_USER_MODEL`, Postgres, DRF defaults, CORS/CSRF for `localhost:3000`,
      media root.
- [x] **5. Models + migrations** — the three apps from §3, then
      `makemigrations` / `migrate`.
- [x] **6. Auth endpoints** — login/logout/me, session-cookie based.
- [x] **7. Serializers + viewsets** — camelCase, nested attachments/comments/
      activity, the filter set, bulk actions, server-written activity entries.
- [x] **8. Seed command** — `manage.py seed_bugboard`. Rather than
      transcribing `data.ts` by hand, the seed was **exported from the
      TypeScript itself** (Node type-stripping) into
      `backend/apps/bugs/fixtures/seed.json`, so nothing drifted: 26 bugs,
      4 projects, 11 people, 15 comments, 19 reactions, 20 attachments and
      158 activity entries. Idempotent, with `--reset` to reload.
- [x] **9. Verify** — migrations from scratch, seed, then exercise every endpoint
      and report real output.
- [x] **10. Frontend wiring** — see §10.

---

## 6. Running it

Three things, in this order. The first two only matter the first time.

```bash
# 1. database (once; it restarts itself after that)
docker compose up -d bugboard_db

# 2. backend — uv creates the venv and installs on first run
cd backend
uv run manage.py migrate
uv run manage.py seed_bugboard          # only needed once
uv run manage.py runserver 8000

# 3. frontend, in a second terminal, from the repo root
npm run dev
```

Then open **http://localhost:3000/bug-board** and sign in as any seeded person
— `ishita` (tester), `aarav` (developer), `rhea` (manager) — with the password in
`SEED_USER_PASSWORD` in `backend/.env`.

Open only `localhost:3000`. The API is proxied under that same origin by
`next.config.ts`, so the browser never talks to port 8000 directly — that is
what keeps the session cookie and Django's CSRF check working without CORS.

Django's admin, if you want to poke at rows directly, is at
http://localhost:8000/admin/ after `uv run manage.py createsuperuser`.

---

## 7. Deliberately out of scope

- **Realtime** — no websockets; the board polls or refetches. Add later if two
  testers on one board actually collide.
- **Object storage** — uploads go to local `MEDIA_ROOT`. S3 is a settings swap.
- **Email/invites** — users are created by the seed command and `createsuperuser`.
- **Permissions per role** — `role` is stored and returned, but every
  authenticated user can act on any bug for now. The field is there so
  role-scoped rules are a follow-up, not a migration.


---

## 8. What was verified

Run against the built backend, on a database dropped and rebuilt from zero:

- 5 migrations apply from scratch; `seed_bugboard` twice in a row is idempotent
  (second run: `0 bugs created (26 already present)`).
- Auth: unauthenticated list `403`; wrong password `401` with a message that does
  not reveal whether the account exists; login `200`; `/auth/me/` returns the
  person; logout `204` and the board closes again.
- Detail payload for `BUG-1042` compared key-by-key against the TypeScript `Bug`
  interface: **no missing keys, no extra keys, no scalar mismatches**, and
  identical attachment / activity / comment counts.
- List: 26 rows, `pageSize` paging, default sort `updatedAt desc`, and
  `sort=severity` returning true workflow rank (critical first) rather than
  alphabetical.
- Filters: multi-value (`severity=critical,high`), free-text search including
  label matching through the array cast, the `unassigned` assignee sentinel, and
  an inclusive single-day `createdFrom`/`createdTo` range.
- Writes: create allocates `BUG-1043`; textarea steps split correctly across
  `1.`, `2)` and blank lines; bulk close reports `matched 3, changed 2` and
  `changed 0` on repeat (no duplicate activity); invalid enums and unknown ids
  and unknown people all rejected with `400`.
- Audit trail: a single PATCH produced `edited`, `severity Low → Critical`,
  `priority P3 → P0` and `assigned Unassigned → Marcus Chen`, all attributed to
  the signed-in user.
- Comments: threaded reply works; replying with a `parentId` belonging to a
  different bug is rejected; a reaction toggles on and back off.
- Evidence: multipart upload stored and served over HTTP, delete returns `204`
  and logs `removed evidence.log`.
- Projects: deleting one holding 12 bugs returns `409` with the bug count;
  deleting an empty one returns `204`; `?moveTo=` relocates the bugs and logs
  the move on each.

## 9. Notes for whoever runs this next

- **`uv` was installed to `~/.local/bin`** because this host has no `pip`, no
  `ensurepip`, no `python3-venv` and no password-less `sudo`. Add it to `PATH`
  (`source $HOME/.local/bin/env`) or call it as `~/.local/bin/uv`.
- **Seeded people all share one password**, set by `SEED_USER_PASSWORD` in
  `backend/.env`. Sign in as any of them — `ishita` is the tester the board was
  written around. For the Django admin, make a superuser:
  `uv run manage.py createsuperuser`.
- The kodus stack's Postgres on 5432 was never touched; this project's database
  is a separate container on 5433.


---

## 10. Frontend wiring

The board keeps its architecture: it still loads every bug and filters, sorts and
paginates **in the browser**, using the same `filters.ts` it always did. Only the
source of the data changed. That is why the table, filter bar, summary cards,
pagination, export and keyboard shortcuts needed no changes at all.

### New files

| File | Role |
| --- | --- |
| `src/lib/bug-board/api.ts` | Typed client. One `request()` helper handles CSRF, cookies and DRF's three error shapes. |
| `src/components/bug-board/session-provider.tsx` | Resolves `/api/auth/me` before anything renders; shows the sign-in card until it succeeds. |

### Changed files

- **`next.config.ts`** — proxies `/api/*` and `/media/*` to Django. Two things
  were needed that are easy to miss:
  - `skipTrailingSlashRedirect: true`, because Next answered `/api/bugs/` with a
    308 before the rewrite was even reached.
  - the API itself is now **slash-free** (`DefaultRouter(trailing_slash=False)`),
    because the rewrite drops the trailing slash when forwarding and Django's
    `APPEND_SLASH` then redirected straight back — an infinite loop.
- **`src/lib/bug-board/data.ts`** — was 1,558 lines of mock board. Now a ~120
  line registry that `/api/meta` hydrates at boot. It keeps the same export
  surface (`PEOPLE`, `DEVELOPERS`, `personName`, `MODULES`, …) so the eight
  components that read those directly did not have to change. The arrays are
  mutated in place for the same reason.
- **`bug-board-provider.tsx`** — same context shape, but reads are loaded from
  the API and every mutation is an async write-through: call the endpoint, then
  replace the affected bug with the server's copy so the activity the server
  wrote shows up immediately. Adds `loading`, `loadError`, `refresh`, `saving`.
- **`use-evidence-uploads.ts`** — was a fake progress bar over object URLs
  (`Files never leave the browser`). Now a staging queue that keeps the real
  `File` objects so the caller can upload them, because *when* to upload differs:
  the create form has no bug to attach to until the bug exists.
- **`bug-board.tsx`** — wraps the board in `SessionGate`, adds loading/error
  states and a signed-in avatar with sign-out.
- Call sites that had to change with the signatures: `bug-form-dialog.tsx`,
  `bug-details-drawer.tsx`, `bug-row-actions.tsx`, `comment-thread.tsx`.
- **Deleted** `src/lib/bug-board/thumbnails.ts` — it existed to generate the
  mock's inline SVG previews, which are now real files in `backend/media/`.

### Two decisions worth knowing

- **`CURRENT_USER_ID` is gone.** It was a hardcoded `"ishita"`. It is now
  `getCurrentUserId()`, filled from the session, because the server attributes
  every comment, upload and status change to the authenticated user — the client
  no longer gets to claim who it is.
- **The list endpoint returns full bugs**, not trimmed rows. A lighter row
  payload was the first thing I tried and it broke the board: it sorts by
  attachment count and opens the details drawer straight from the row it already
  holds, so rows and drawers have to be the same shape. Fine at this size; if the
  board ever holds thousands of bugs, that is the point to move filtering and
  paging to the server, which the API already supports.

### Verified in a real browser

Driven through Chrome with Playwright, against both servers running:

- The login gate renders; wrong credentials are refused; signing in as `ishita`
  loads the board — 26 bugs, 4 projects, `1–10 of 26`, summary cards populated.
- The create form's dropdowns are filled from `/api/meta` (project, module,
  component, environment, browser, device, OS) and the reporter defaults to the
  signed-in person.
- Filing a bug from the form created `BUG-1043`; after a **full page reload** it
  was still on the board.
- The details drawer shows `Activity 11` / `Comments 3` from Postgres, with
  threaded replies, code snippets, reactions and role badges.
- Posting a comment returned `201`, rendered immediately, survived a reload, and
  the server had written an `added a comment` activity entry.
- Dropping a `.log` file onto a bug uploaded it (`201`), it survived a reload,
  and editing the bug's title persisted with `edited the details` in the trail.
- No console or page errors beyond the expected `403` from the first
  `/api/auth/me` before sign-in.
- `tsc --noEmit`, `eslint` and `next build` all clean.

Test data created during this pass (`BUG-1043`–`BUG-1045`, a test comment, an
uploaded log, an edited title) has been removed; the board is back to the 26
seeded bugs.
