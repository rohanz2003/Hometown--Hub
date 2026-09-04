# rules.md — Hometown Hub

Project rules, standards, and guidelines to build and maintain the application.

## 1. What to Use

- **Frontend:** React.js or Next.js, functional components + hooks only, Tailwind
  CSS for styling.
- **Backend:** Node.js + Express.js, REST conventions (`/api/v1/...`).
- **Database:** MongoDB with Mongoose, or PostgreSQL with Prisma/Sequelize — pick
  one per `architecture.md` and stay consistent.
- **Auth:** JWT access tokens; bcrypt for password hashing.
- **State management:** React Context for small app state; Redux Toolkit only if
  the app's complexity clearly justifies it.
- **Testing:** Jest + React Testing Library (frontend), Jest + Supertest (backend).

## 2. What to Avoid

- No jQuery or class-based React components — keep the codebase modern and
  consistent.
- No inline styles as a substitute for the design system in `design.md`.
- No storing plaintext passwords or secrets in code or client storage.
- No mixing of two database ORMs in the same project.
- No skipping input validation on backend routes, even for "trusted" internal
  calls.
- No native mobile app work, paid-ad integrations, or government/emergency
  alert integrations in Phase 1 (see `phases.doc.md` scope).

## 3. Libraries & Dependencies

| Purpose                                         | Library                                                |
| ----------------------------------------------- | ------------------------------------------------------ |
| HTTP client                                     | axios                                                  |
| Validation                                      | zod or joi (backend), react-hook-form (frontend forms) |
| ORM/ODM                                         | mongoose (MongoDB) or prisma (PostgreSQL)              |
| Auth                                            | jsonwebtoken, bcrypt                                   |
| Testing                                         | jest, supertest, @testing-library/react                |
| Notifications (real-time, optional later phase) | socket.io                                              |

Pin major versions in `package.json`; avoid adding a new dependency for something
solvable with existing libraries already in the stack.

## 4. Error Handling

- Every API response follows a consistent shape: `{ success, data, error }`.
- Backend uses a centralized error-handling middleware — no raw stack traces sent
  to the client.
- User-facing errors are short and actionable (e.g., "That community name is
  already taken" rather than a raw DB error).
- Log server errors with enough context (route, user id, timestamp) to debug
  without exposing sensitive data in logs.
- Frontend shows inline form errors and toast/banner errors for network failures,
  never a blank/broken screen.

## 5. Boundaries of AI

- The AI assistant may scaffold code, write features phase-by-phase, and refactor
  — but must not invent requirements not present in the PRD or these docs.
- The AI must not silently change the tech stack chosen in `architecture.md`.
- The AI must not fabricate data, users, or metrics when demonstrating features —
  use clearly-labeled seed/mock data only.
- The AI must flag (not silently skip) anything it cannot implement with the
  approved stack.
- The AI must update `memory.md` after each work session; it should never assume
  the human remembers undocumented decisions from a prior session.

## 6. General Rules

- **Code style:** Prettier + ESLint (Airbnb or Standard config), enforced pre-commit.
- **Naming:** camelCase for variables/functions, PascalCase for components/classes,
  kebab-case for file names in `pages/`.
- **Commits:** Conventional Commits style — `feat:`, `fix:`, `chore:`, `docs:`.
- **Security & privacy:** never log passwords/tokens; sanitize all user input;
  rate-limit auth endpoints.
- **Performance:** paginate feeds and lists; lazy-load images.
- **Documentation:** every new module gets a short comment block explaining its
  purpose; update `architecture.md` if the folder structure changes.
- **Testing:** every new API route ships with at least one happy-path and one
  failure-path test before merging.
