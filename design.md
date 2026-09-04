# design.md — Hometown Hub

UI/UX guidelines and visual design system for the application.

## 1. UI/UX Principles

- Clean and intuitive interface — this is for a broad, non-technical audience.
- Consistent user experience across feed, events, and admin views.
- Mobile-first approach (majority of users will be on phones).
- Easy navigation and accessibility (proper contrast, readable font sizes, alt
  text on images).
- Reuse components (cards, buttons, modals) for consistency across the app.

## 2. Color & Theme

| Role       | Suggested color                                           |
| ---------- | --------------------------------------------------------- |
| Primary    | Warm blue (`#2F6FED`) — trust, connection                 |
| Secondary  | Earthy green (`#3FA34D`) — community, locality            |
| Accent     | Warm orange (`#F2994A`) — events, highlights              |
| Background | Off-white (`#FAFAFA`) light / near-black (`#121212`) dark |
| Surface    | White (`#FFFFFF`) light / dark gray (`#1E1E1E`) dark      |
| Text       | Charcoal (`#1F1F1F`) light / off-white (`#EDEDED`) dark   |
| Success    | Green (`#27AE60`)                                         |
| Warning    | Amber (`#F2C94C`)                                         |
| Error      | Red (`#EB5757`)                                           |

Support both light and dark theme using CSS variables / Tailwind's dark mode.

## 3. Fonts & Typography

- **Primary font family:** Inter or Poppins (clean, highly legible at small sizes).
- **Headings (H1–H3):** SemiBold/Bold, larger scale for feed titles and page
  headers.
- **Body text:** Regular weight, 14–16px base size for readability on mobile.
- **Font weights used:** Regular (400), Medium (500), SemiBold (600), Bold (700).
- Maintain generous line height (1.5) for post/comment text blocks.

## 4. Memory (UI Preferences)

Persist per-user UI preferences so the app feels consistent across sessions:

- Theme mode (light/dark)
- Language preference (for future multi-language support)
- Sidebar/navigation layout state (collapsed/expanded)
- Default community/feed view (list vs. grid)
- Any other saved UI customization

These preferences should be stored against the user profile in the database, not
just in local browser storage, so they persist across devices.
