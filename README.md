# Hometown Hub

A hyperlocal community platform: one online home for the people of a single city or
village, to share updates, organise events, and keep local culture alive — including
the people who have moved away.

Built to the specification in [`PROMPT.md`](PROMPT.md), following
[`architecture.md`](architecture.md), [`rules.md`](rules.md),
[`design.md`](design.md), and the phase order in [`phases.doc.md`](phases.doc.md).
Progress and decisions are logged in [`memory.md`](memory.md).

## Stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Frontend   | React 18 + Vite, React Router 6, Tailwind CSS 3                        |
| Backend    | Node.js + Express 4, REST under `/api/v1`                              |
| Database   | MongoDB + Mongoose 8                                                   |
| Auth       | JWT access token (in memory) + httpOnly refresh cookie, bcrypt hashing |
| Validation | zod (backend), react-hook-form + zod (frontend)                        |
| Tests      | Jest + Supertest (backend), Jest + React Testing Library (frontend)    |

## Quick start

Requires Node 20+ and a MongoDB server on `127.0.0.1:27017`.

```bash
npm install
```

```bash
cp server/.env.example server/.env
```

```bash
npm run seed --workspace server -- --fresh
```

```bash
npm run dev
```

The client runs on http://localhost:5173 and proxies `/api` to the API on
http://localhost:5000.

### Demo accounts

The seed script creates clearly-labelled demo data — every seeded record is marked
`[DEMO]`. All accounts share the password `Hometown123`:

| Email               | Role                       |
| ------------------- | -------------------------- |
| `asha@example.com`  | platform admin             |
| `ravi@example.com`  | community moderator        |
| `priya@example.com` | member                     |
| `meera@example.com` | member of two communities  |
| `sam@example.com`   | has a pending join request |

## Commands

| Command                                       | What it does                                      |
| --------------------------------------------- | ------------------------------------------------- |
| `npm run dev`                                 | Runs the API and the client together              |
| `npm run build`                               | Production build of the client into `client/dist` |
| `npm start`                                   | Starts the API alone (production mode)            |
| `npm test`                                    | Backend then frontend test suites                 |
| `npm run test:server` / `npm run test:client` | One suite at a time                               |
| `npm run lint` / `npm run lint:fix`           | ESLint across both workspaces                     |
| `npm run format` / `npm run format:check`     | Prettier                                          |
| `npm run seed --workspace server -- --fresh`  | Reseed the demo data                              |

Backend tests use their own database (`hometown_hub_test`) and wipe it between
cases, so they never touch development data.

## Project layout

```
hometown-hub/
├── client/                      React + Vite frontend
│   └── src/
│       ├── components/          Reusable UI (ui/) and layout (layout/)
│       ├── pages/               Route-level views, kebab-case filenames
│       ├── features/            Feature-sliced logic (posts, events, communities)
│       ├── hooks/               useAsync, usePaginatedList, useDebounce
│       ├── context/             Auth, Theme, Toast providers
│       ├── services/            Axios wrappers, one module per resource
│       ├── styles/              Design tokens + Tailwind layers
│       └── utils/               Formatters, validators, constants
├── server/                      Express API
│   ├── src/
│   │   ├── config/              env + Mongo connection
│   │   ├── models/              User, Community, Membership, Post, Comment,
│   │   │                        Event, Notification, Report, Category
│   │   ├── controllers/         HTTP layer
│   │   ├── routes/              REST route definitions
│   │   ├── middleware/          auth, roles, validation, uploads, errors
│   │   ├── services/            Business logic
│   │   ├── validation/          zod request schemas
│   │   └── utils/               Response envelope, pagination, tokens, logger
│   └── tests/                   Jest + Supertest suites
└── PROMPT.md, architecture.md, rules.md, phases.doc.md, design.md, memory.md
```

## API

All routes are under `/api/v1`, and every response uses the same envelope:

```json
{ "success": true, "data": {}, "error": null }
```

Paginated lists add a `meta` block (`page`, `limit`, `total`, `totalPages`,
`hasNextPage`, `hasPrevPage`).

| Area          | Routes                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`, `GET /auth/me` |
| Users         | `GET                                                                                                                                                                                | PATCH /users/me`, `PATCH /users/me/preferences`, `POST /users/me/deactivate`, `GET /users/:userId`, `POST /users/reports` |
| Communities   | `GET                                                                                                                                                                                | POST /communities`, `GET /communities/mine`, `GET                                                                         | PATCH                                                                                                 | DELETE /communities/:id`, `POST /communities/:id/join`, `DELETE /communities/:id/leave`, `GET /communities/:id/members`, `PATCH /communities/:id/members/:membershipId/{review,role}`, `DELETE /communities/:id/members/:membershipId` |
| Posts         | `GET /posts/feed`, `GET                                                                                                                                                             | POST /communities/:id/posts`, `GET                                                                                        | PATCH                                                                                                 | DELETE /posts/:postId`, `POST /posts/:postId/{like,share}`, `PATCH /posts/:postId/{pin,moderate}`                                                                                                                                      |
| Comments      | `GET                                                                                                                                                                                | POST /posts/:postId/comments`, `PATCH                                                                                     | DELETE /comments/:commentId`, `POST /comments/:commentId/like`, `PATCH /comments/:commentId/moderate` |
| Events        | `GET /events`, `GET                                                                                                                                                                 | POST /communities/:id/events`, `GET                                                                                       | PATCH                                                                                                 | DELETE /events/:eventId`, `POST /events/:eventId/{cancel,rsvp}`, `DELETE /events/:eventId/rsvp`                                                                                                                                        |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`, `DELETE /notifications/:id`                              |
| Dashboard     | `GET /dashboard/summary`, `GET /categories`                                                                                                                                         |
| Admin         | `GET /admin/{stats,communities,users,reports,categories}`, `PATCH /admin/communities/:id/review`, `PATCH /admin/users/:id/{role,active}`, `PATCH /admin/reports/:id`, `POST         | PATCH                                                                                                                     | DELETE /admin/categories`                                                                             |

## Roles

Two independent dimensions, matching `PROMPT.md` § 6:

- **Platform role** on the user: `user` or `platform_admin`. Platform admins approve
  new communities, manage accounts, and maintain the category list. They are treated
  as community admins everywhere.
- **Community role** on the membership: `member`, `moderator`, or `admin`. Moderators
  approve join requests, pin announcements, and hide content. Community admins also
  edit the community and change member roles.

The frontend route guards mirror these checks, so no screen renders an action the API
would refuse.

## Security notes

- Passwords are bcrypt-hashed and the hash is never selected by default.
- Access tokens are short-lived and held in JavaScript memory only; the refresh token
  travels exclusively as an httpOnly cookie, so no long-lived credential is readable
  by page scripts.
- A password change or account deactivation bumps a token version, invalidating every
  previously issued refresh token.
- Every route validates its input with zod, and a sanitiser strips `$`-prefixed and
  dotted keys to block MongoDB operator injection.
- Auth endpoints are rate-limited; login failures return one generic message so the
  endpoint cannot be used to enumerate accounts.
- Errors go through one middleware — no stack traces reach the client.

## Design system

Tokens from `design.md` live as CSS variables in
[`client/src/styles/index.css`](client/src/styles/index.css) and are exposed to
Tailwind in [`client/tailwind.config.js`](client/tailwind.config.js). Light and dark
themes are one class on `<html>`; the choice is stored on the user profile so it
follows them across devices, with a `localStorage` copy only to prevent a flash of the
wrong theme before the session loads.

The dashboard's activity chart uses blue + orange rather than the brand blue + green:
the blue/green pair scores ΔE 7 under tritanopia while blue/orange scores 29.7. Both
themes' steps were validated separately for lightness, chroma, colour-vision
separation, and contrast.

## Deployment

- **Frontend** — [`vercel.json`](vercel.json) builds `client/dist` with an SPA
  rewrite. Set `VITE_API_BASE_URL` to the deployed API origin.
- **Backend** — [`render.yaml`](render.yaml) is a Render blueprint with `/health` as
  the health check. Supply `MONGODB_URI`, `CLIENT_ORIGINS`, `CLIENT_URL`, and
  `PLATFORM_ADMIN_EMAIL`; let Render generate the JWT secrets.
- **CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs formatting,
  lint, both test suites, and a production build against a MongoDB service container.

Because the refresh cookie is `SameSite=None; Secure` in production, the API must be
served over HTTPS and the client origin must be listed in `CLIENT_ORIGINS`.

## Known limitations

These are deliberate gaps, flagged rather than silently skipped:

- **No email delivery.** No mail provider is in the approved stack, so password reset
  links are logged server-side and, outside production, returned in the API response
  and surfaced on the "check your email" screen. Wiring in a provider means changing
  one function, `requestPasswordReset` in `server/src/services/authService.js`.
- **`bcryptjs` instead of `bcrypt`.** `rules.md` names `bcrypt`; its native build has
  no prebuilt binary for current Node on Windows. `bcryptjs` is the pure-JS
  equivalent with the same API and cost factor.
- **Uploads are stored on local disk** under `server/uploads` and served from
  `/uploads`. Production should use object storage; only
  `server/src/middleware/upload.js` needs to change.
- **Notifications are in-app only, and polled.** Real-time delivery via socket.io is
  listed as a later phase in `rules.md`; the notification service is already the
  single write path, so adding a socket emit is localised.
- **Git hooks are opt-in.** `npm run prepare:hooks` installs the Husky pre-commit
  hook. It is not part of `npm install`, which would fail outside a Git checkout.
- **Event reminders have no scheduler.** The notification type exists and the UI
  renders it, but nothing dispatches reminders on a timer yet.
