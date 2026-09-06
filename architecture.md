# architecture.md — Hometown Hub

High-level design and structure of the application.

## 1. Architecture Overview

Hometown Hub follows a **client-server, REST-based architecture**:

```
[ React/Vite Frontend ]  <--- REST API (JSON) --->  [ Express.js Backend ]  <--->  [ MongoDB ]
        |                                                        |
   Tailwind UI                                          Auth (JWT) + Business Logic
   State: Context                                         REST controllers per entity
```

**Components**

- **Frontend (SPA):** renders community feeds, events, profiles; talks to the
  backend only through REST endpoints; no direct DB access.
- **Backend (API server):** Express.js app exposing REST routes, handling auth,
  validation, and business rules; the single source of truth for data.
- **Database:** stores Users, Communities, Posts, Comments, Events, Moderators,
  Notifications.
- **Notification layer:** in-app notifications generated on events like new
  comments, approvals, or pinned announcements.

**How components interact**

1. User authenticates → backend issues a JWT.
2. Frontend attaches the JWT to every API call.
3. Backend validates role (User / Moderator / Platform Admin) before performing
   an action (e.g., only moderators can pin a post in their community).
4. Writes (posts, comments, events) go through backend validation before hitting
   the database.

## 2. Folder & File Structure

```
hometown-hub/
├── client/                        # React/Vite frontend
│   ├── src/
│   │   ├── components/            # Reusable UI (Card, Button, Modal, Navbar)
│   │   │   ├── layout/            # AppLayout, AuthLayout, Navbar, Sidebar, MobileNav
│   │   │   └── ui/                # Atomic UI (Button, Card, Modal, Avatar, Badge, etc.)
│   │   ├── pages/                 # Route-level views (Feed, Events, Profile, Admin)
│   │   ├── features/              # Feature-sliced logic (auth, communities, posts, events)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── context/                # Auth/user context providers
│   │   ├── services/               # API call wrappers (axios/fetch)
│   │   ├── styles/                 # Tailwind config, global CSS, design tokens
│   │   └── utils/                  # Formatters, validators
│   └── public/
├── server/                         # Express.js backend
│   ├── src/
│   │   ├── config/                 # DB connection, env config
│   │   ├── models/                 # User, Community, Post, Comment, Event, Notification
│   │   ├── controllers/            # Request handlers per entity
│   │   ├── routes/                 # REST route definitions
│   │   ├── middleware/             # auth, role-check, error handler, validation
│   │   ├── services/               # Business logic separated from controllers
│   │   └── utils/                  # Helpers (logger, response formatter)
│   └── tests/                      # Unit & integration tests
├── architecture.md
├── rules.md
├── phases.doc.md
├── design.md
├── memory.md
└── README.md
```

## 3. Tech Stack

| Layer           | Choice                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Frontend        | React.js + Vite, Tailwind CSS                                           |
| Backend         | Node.js, Express.js                                                     |
| Database        | MongoDB (document-flexible)                                             |
| Auth            | JWT-based sessions (access token in memory, refresh in httpOnly cookie) |
| API             | REST                                                                    |
| Icons           | Lucide React (tree-shakable SVG icons)                                  |
| Deployment      | Vercel (frontend), Render (backend)                                     |
| Version control | Git + GitHub                                                            |

## 4. Frontend Design System

Centralized design tokens live in:

- `client/src/styles/index.css` — CSS variables for colors, spacing, shadows
- `client/tailwind.config.js` — Tailwind theme extension mapping tokens to utilities
- `client/src/components/ui/icons.js` — Tree-shakable Lucide React icon exports

All emoji icons replaced with Lucide React SVG icons for professional, consistent appearance.
