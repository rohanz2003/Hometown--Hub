# memory.md — Hometown Hub

Project memory to keep track of progress, decisions, and current work. Update
this file at the end of every work session.

## 1. Memory (Key Context)

- Project: Hometown Hub — hyperlocal community platform.
- Reference docs in repo root: `PROMPT.md`, `architecture.md`, `rules.md`,
  `phases.doc.md`, `design.md`.
- Build order: strictly phase-by-phase per `phases.doc.md`. Phases 1–5 are
  functionally complete; Phase 6 config is in place but nothing is deployed yet.

### Decisions made (and why)

| Decision                                                      | Reasoning                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React + Vite SPA**, not Next.js                             | `architecture.md` § 1 calls the frontend an SPA and its folder tree (`client/src/pages`, `client/public`) is a Vite layout, not a Next.js one. Keeps the frontend fully decoupled from the Express API.                       |
| **MongoDB + Mongoose**                                        | Both were allowed; MongoDB 8.3 was already running locally on `127.0.0.1:27017`. One ODM only, per `rules.md`.                                                                                                                |
| **React Context**, not Redux Toolkit                          | `rules.md` permits Redux "only if complexity clearly justifies it". Three small providers (auth, theme, toast) cover all shared state.                                                                                        |
| **npm workspaces** monorepo                                   | `client/` and `server/` share one lockfile and one `npm run dev`.                                                                                                                                                             |
| **Access token in memory + refresh token in httpOnly cookie** | `rules.md` forbids secrets in client storage. A `tokenVersion` on the user invalidates all refresh tokens on password change or deactivation.                                                                                 |
| **`bcryptjs` instead of `bcrypt`**                            | FLAGGED DEVIATION. `rules.md` names `bcrypt`; its native build has no prebuilt binary for current Node on Windows. Same API, same cost factor.                                                                                |
| **Membership is its own collection**                          | `architecture.md` lists "Moderators" as an entity. A moderator is a `Membership` with role `moderator`/`admin`, which also carries join-request status.                                                                       |
| **Chart palette is blue + orange, not brand blue + green**    | Brand blue/green scores ΔE 7 under tritanopia; blue/orange scores 29.7. Both themes' steps validated for lightness band, chroma, CVD separation, and contrast.                                                                |
| **Lucide React for icons**                                    | Replaced all emoji icons with tree-shakable Lucide SVG icons for professional, consistent appearance across the app. Centralized in `src/components/ui/icons.js`.                                                             |
| **Consistent glow colors for buttons**                        | Added `primary-glow`, `secondary-glow`, `accent-glow`, `error-glow` color tokens so primary/secondary/accent/danger buttons use consistent colors that work in both light and dark modes (fixes invisible text in dark mode). |
| **Navbar right-aligned group**                                | Theme toggle → Notifications → Profile dropdown positioned at far right for modern app layout.                                                                                                                                |
| **Tests use a real local MongoDB** (`hometown_hub_test`)      | Avoids adding `mongodb-memory-server`, which would download a second mongod binary. `clearDb()` refuses to run unless `NODE_ENV=test`.                                                                                        |
| **Husky hooks are opt-in** (`npm run prepare:hooks`)          | A `prepare` script running `husky install` breaks `npm install` outside a Git checkout.                                                                                                                                       |
| **Denormalised counters** on Community/Post/Event             | Feed cards need member/post/comment counts without an aggregate per card; services keep them in step.                                                                                                                         |

## 2. What Happened (Log)

| Date       | Change / Decision                         | Notes                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04 | Project docs created                      | Initial planning, no code written yet                                                                                                                                                                                                                                                                                                                                                  |
| 2026-09-04 | Repo scaffolded                           | npm workspaces root, Prettier, EditorConfig, `.gitignore`, ESLint (Airbnb + Prettier) per workspace                                                                                                                                                                                                                                                                                    |
| 2026-09-04 | **Phase 1 complete** — auth               | Register/login/logout, refresh rotation, password reset, change password, JWT + role middleware. 17 tests                                                                                                                                                                                                                                                                              |
| 2026-09-04 | **Phase 2 complete** — dashboard          | `/dashboard/summary` in one round trip: KPI tiles, 14-day activity chart, communities, upcoming events, recent notifications. Navbar + sidebar + mobile tab bar                                                                                                                                                                                                                        |
| 2026-09-04 | **Phase 3 complete** — CRUD               | Communities (create → admin approval → join/leave/edit), posts, comments (one-level threads), events (RSVP + capacity + cancel), plus search/filter/sort and pagination everywhere                                                                                                                                                                                                     |
| 2026-09-04 | **Phase 4 complete** — extras             | Likes, shares, moderator tools (approve members, roles, pin, hide), platform admin (community queue, users, categories), abuse reports, notifications, profile + preferences                                                                                                                                                                                                           |
| 2026-09-04 | **Phase 5 complete** — QA                 | 112 backend tests (7 suites) + 65 frontend tests (6 suites), all passing. ESLint and Prettier clean. Client production build succeeds                                                                                                                                                                                                                                                  |
| 2026-09-04 | **Phase 6 config** — deployment           | `vercel.json`, `render.yaml`, GitHub Actions CI (format → lint → both suites → build) against a MongoDB service container. Not yet deployed                                                                                                                                                                                                                                            |
| 2026-09-04 | Two bugs found and fixed during the build | (1) Password hashing ran in `pre('save')`, which fires _after_ Mongoose's own validation, so `passwordHash` was always missing — moved to `pre('validate')`. (2) `usePaginatedList.applyFilters` re-fetched on every render when a debounced search effect passed an unchanged value — it now bails out when nothing actually changed                                                  |
| 2026-09-04 | Added `canInteract` to post payloads      | The client was inferring membership from the presence of other fields. The API now says explicitly whether the viewer may like/comment/share                                                                                                                                                                                                                                           |
| 2026-09-06 | **Professional redesign**                 | Replaced all emoji icons with Lucide React SVG icons. Updated color palette to professional slate-based neutral tones with consistent primary/secondary/accent glow colors that work in both light/dark modes. Fixed dark mode visibility issues across landing, auth, and dashboard pages. Navbar layout reordered: brand → search → theme → notifications → profile (right-aligned). |
| 2026-09-06 | **Community submission notifications**    | Added unread in-app notifications for active platform admins whenever a user creates a pending community. Notifications use the `community_submitted` type and link to `/admin`; the notification service remains the single write path. |

## 3. Currently Working On

- **Feature/task:** nothing in progress — Phases 1–5 are done and verified.
- **Next up, in order:**
  1. Deploy: MongoDB Atlas cluster → Render (API, using `render.yaml`) → Vercel
     (client, with `VITE_API_BASE_URL` pointing at the API).
  2. Wire in a mail provider so password-reset links are actually emailed
     (`requestPasswordReset` in `server/src/services/authService.js` is the only
     function that changes).
  3. Move uploads to object storage (`server/src/middleware/upload.js`).
  4. Add a scheduler for event reminders — the notification type and UI exist, but
     nothing dispatches them on a timer.
  5. Optional: socket.io for real-time notifications. `notificationService` is
     already the single write path, so the emit is localised.

## 4. Open Questions

- Which mail provider? Nothing in `rules.md` covers email, so this needs a call
  before the reset flow can work in production.
- Multi-language support is listed as a future enhancement. The `language`
  preference is already stored per user, but no strings are extracted yet.

## 5. Purpose

- Maintain context across sessions so work doesn't restart from zero.
- Improve productivity and consistency across contributors (including AI
  assistants).
- Ensure no important decision or open issue is forgotten.
