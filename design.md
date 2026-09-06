# design.md — Hometown Hub

UI/UX guidelines and visual design system for the application.

## 1. UI/UX Principles

- Clean and intuitive interface — this is for a broad, non-technical audience.
- Consistent user experience across feed, events, and admin views.
- Mobile-first approach (majority of users will be on phones).
- Easy navigation and accessibility (proper contrast, readable font sizes, alt
  text on images).
- Reuse components (cards, buttons, modals) for consistency across the app.
- Professional, trustworthy appearance — no emoji, consistent iconography.

## 2. Color & Theme

### Light Mode

| Role          | Color                    | Hex       | Purpose                    |
| ------------- | ------------------------ | --------- | -------------------------- |
| Primary       | Slate 900                | `#0F172A` | Trust, reliability         |
| Primary Hover | Slate 800                | `#1E293B` | Interactive states         |
| Primary Soft  | Slate 200                | `#E2E8F0` | Subtle backgrounds         |
| Primary Glow  | Blue 500                 | `#3B82F6` | Buttons, focus rings, CTAs |
| Secondary     | Emerald 700              | `#047857` | Community, growth          |
| Secondary Glow| Emerald 500              | `#10B981` | Secondary buttons          |
| Accent        | Amber 600                | `#D97706` | Events, highlights         |
| Accent Glow   | Amber 500                | `#F59E0B` | Accent buttons             |
| Background    | Slate 50                 | `#F8FAFC` | Page background            |
| Surface       | White                    | `#FFFFFF` | Cards, panels              |
| Surface Muted | Slate 100                | `#F1F5F9` | Subtle surfaces            |
| Text          | Slate 900                | `#0F172A` | Primary text               |
| Text Muted    | Slate 600                | `#475569` | Secondary text             |
| Text Subtle   | Slate 400                | `#94A3B8` | Placeholders, captions     |
| Border        | Slate 200                | `#E2E8F0` | Dividers, inputs           |
| Success       | Emerald 600              | `#059669` | Success states             |
| Warning       | Amber 600                | `#D97706` | Warning states             |
| Error         | Red 600                  | `#DC2626` | Error states               |
| Error Glow    | Red 500                  | `#EF4444` | Error buttons              |

### Dark Mode

| Role          | Color                    | Hex       | Purpose                    |
| ------------- | ------------------------ | --------- | -------------------------- |
| Primary       | Slate 50                 | `#F8FAFC` | Inverted primary           |
| Primary Hover | Slate 200                | `#E2E8F0` | Interactive states         |
| Primary Soft  | Slate 800                | `#1E293B` | Subtle backgrounds         |
| Primary Glow  | Blue 400                 | `#60A5FA` | Buttons, focus rings, CTAs |
| Secondary     | Emerald 300              | `#6EE7B7` | Community, growth          |
| Secondary Glow| Emerald 400              | `#34D399` | Secondary buttons          |
| Accent        | Amber 400                | `#FBBF24` | Events, highlights         |
| Accent Glow   | Amber 400                | `#FBBF24` | Accent buttons             |
| Background    | Slate 950                | `#020617` | Page background            |
| Surface       | Slate 900                | `#0F172A` | Cards, panels              |
| Surface Muted | Slate 800                | `#1E293B` | Subtle surfaces            |
| Text          | Slate 50                 | `#F8FAFC` | Primary text               |
| Text Muted    | Slate 400                | `#94A3B8` | Secondary text             |
| Text Subtle   | Slate 500                | `#64748B` | Placeholders, captions     |
| Border        | Slate 700                | `#334155` | Dividers, inputs           |
| Success       | Emerald 500              | `#10B981` | Success states             |
| Warning       | Amber 400                | `#FBBF24` | Warning states             |
| Error         | Red 400                  | `#F87171` | Error states               |
| Error Glow    | Red 400                  | `#F87171` | Error buttons              |

**Key principle:** Button variants use `*glow` colors (primary-glow, secondary-glow, accent-glow, error-glow) which are carefully chosen to maintain white text contrast in BOTH light and dark modes. This prevents the "invisible text in dark mode" bug.

Support both light and dark theme using CSS variables / Tailwind's dark mode (`.dark` class on `<html>`).

## 3. Fonts & Typography

- **Primary font family:** Inter (clean, highly legible at small sizes), with system UI fallbacks.
- **Display font family:** Inter (same, for headings).
- **Headings (H1–H4):** SemiBold/Bold, larger scale for feed titles and page headers.
- **Body text:** Regular weight, 15px base size for readability on mobile.
- **Font weights used:** Regular (400), Medium (500), SemiBold (600), Bold (700).
- **Line height:** 1.5–1.6 for body text, tighter for headings (1.15–1.4).
- **Letter spacing:** Slightly negative for headings (-0.01 to -0.025em), normal for body.

### Type Scale (mobile-first)

| Size  | Rem     | Line Height | Use Case              |
| ----- | ------- | ----------- | --------------------- |
| 2xs   | 0.625   | 1.4         | Captions, labels      |
| xs    | 0.75    | 1.5         | Small text            |
| sm    | 0.8125  | 1.5         | Secondary text        |
| base  | 0.9375  | 1.6         | Body text             |
| lg    | 1.0625  | 1.5         | Large body            |
| xl    | 1.25    | 1.4         | Small headings        |
| 2xl   | 1.5     | 1.3         | Medium headings       |
| 3xl   | 1.875   | 1.2         | Large headings        |
| 4xl   | 2.25    | 1.15        | Hero headings         |

## 4. Icons

- **Library:** Lucide React (tree-shakable, consistent stroke-based icons).
- **Centralized exports:** `client/src/components/ui/icons.js` — single import point for all icons.
- **Stroke width:** 1.5–2.5 depending on size (1.5 for decorative, 2 for UI, 2.5 for mobile tap targets).
- **No emoji** — all icons are SVG for consistent rendering across platforms.

## 5. Components

### Buttons
Use `*glow` color variants for consistent white-text contrast in both modes:
- Primary: `bg-primary-glow text-white`
- Secondary: `bg-secondary-glow text-white`
- Accent: `bg-accent-glow text-white`
- Danger: `bg-error-glow text-white`
- Outline/Ghost/Soft: adapt to surface colors

### Cards
- Base: `hh-card` — subtle shadow, border, rounded-xl
- Elevated: `hh-card-elevated` — larger shadow for modals/dropdowns

### Spacing & Radius
- Card radius: 12px (rounded-xl)
- Input radius: 10px (rounded-lg)
- Button radius: 8px (rounded-lg)

## 5. Fonts & Typography

- **Primary font family:** Inter (clean, highly legible at small sizes).
- **Headings (H1–H3):** SemiBold/Bold, larger scale for feed titles and page headers.
- **Body text:** Regular weight, 14–16px base size for readability on mobile.
- **Font weights used:** Regular (400), Medium (500), SemiBold (600), Bold (700).
- Maintain generous line height (1.5) for post/comment text blocks.

## 6. Memory (UI Preferences)

Persist per-user UI preferences so the app feels consistent across sessions:

- Theme mode (light/dark)
- Language preference (for future multi-language support)
- Sidebar/navigation layout state (collapsed/expanded)
- Default community/feed view (list vs. grid)
- Any other saved UI customization

These preferences should be stored against the user profile in the database, not
just in local browser storage, so they persist across devices.