# Master Build Prompt — Hometown Hub (Digital Community Platform)

Use this prompt with an AI coding assistant (Claude Code, Cursor, etc.) to build the
application end-to-end. It references the five companion documents that must sit in
the project root: `architecture.md`, `rules.md`, `phases.doc.md`, `design.md`,
`memory.md`.

---

## 1. Project Summary

Build **Hometown Hub**, a hyperlocal, web-based community platform that lets people
from the same city or village connect, share updates, organize events, and preserve
local culture — a focused alternative to broad social networks and scattered WhatsApp
groups (closest reference: Nextdoor).

## 2. Instruction to the AI Assistant

> You are acting as a full-stack engineering partner. Before writing any code:
>
> 1. Read `architecture.md` to understand the system design and folder structure.
> 2. Read `rules.md` and follow it strictly — it defines approved tech, banned
>    patterns, and the boundaries of what you may decide on your own.
> 3. Read `phases.doc.md` and implement the product **one phase at a time, in
>    order**. Do not start Phase 2 work until Phase 1 is functionally complete.
> 4. Read `design.md` before building any UI and apply its colors, type scale, and
>    UX principles consistently.
> 5. After every meaningful step (feature completed, decision made, bug fixed),
>    update `memory.md` so the project has continuity across sessions.
> 6. Ask for clarification only when a requirement is genuinely ambiguous or
>    missing — otherwise make a reasonable choice, note it in `memory.md`, and
>    keep moving.

## 3. Problem Statement

- No dedicated platform exists for hometown/village-level community networking.
- Communication is scattered across WhatsApp groups with no structure.
- There's no central place for local announcements, events, or news.
- People lose touch with their hometown community after moving away.

## 4. Objectives

**Primary**

- Let people from the same city/village connect digitally.
- Provide one place for community updates and discussion.
- Support event creation and organization.
- Strengthen local participation and bonding.

**Secondary**

- Preserve local culture and traditions.
- Enable community-led initiatives and support groups.
- Surface local news and alerts.
- Encourage cross-community collaboration.

## 5. Scope

**In scope:** responsive web app, community creation/membership, posts &
discussions, event creation/management.

**Out of scope (Phase 1):** native mobile apps, paid ads, advanced AI moderation,
government/emergency alert integrations.

## 6. User Roles & Core Features

| Role                          | Key capabilities                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**                      | register/login, join or create a community, post/comment/like/share, create & join events, receive notifications, edit profile with hometown info |
| **Community Admin/Moderator** | approve/reject members, set community rules, moderate posts/comments, pin announcements, manage events                                            |
| **Platform Admin**            | approve new communities, manage users/moderators, monitor activity, handle abuse reports, manage content categories/tags                          |

## 7. Non-Functional Requirements

- Page loads under 3 seconds; supports concurrent usage.
- Secure authentication and data privacy by default.
- Mobile-first, simple, intuitive UI.
- Architecture must scale to many cities/villages.

## 8. Tech Stack

- **Frontend:** React.js / Next.js, HTML5/CSS3/JS, Tailwind CSS (or Bootstrap)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB or PostgreSQL
- **API style:** REST
- **Deployment:** Vercel / Netlify (frontend), AWS/Render (backend)

## 9. Core Data Entities

Users, Communities, Posts, Comments, Events, Moderators, Notifications.

## 10. Deliverables

- Functional web application (all 6 phases from `phases.doc.md`)
- Admin dashboard
- Community onboarding module
- PRD & technical documentation (this file set)
- Deployment-ready build

## 11. Success Metrics (KPIs)

Registered users, active communities, daily active users, post/engagement rate,
event participation rate, community growth rate.

## 12. How to Use This Prompt

Paste this entire file as the system/context prompt for your coding assistant at
the start of every session, alongside the current contents of `memory.md` so it
knows exactly where the project left off.
