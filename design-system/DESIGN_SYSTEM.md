# Spendid — Design System

Extracted directly from the live app (`tailwind.config.js`, `src/index.css`,
`src/components/*`, `public/images/*`). Use this file + `assets/` to rebuild the UI in
another tool.

---

## Assets (`assets/`)

| File | Type | Use |
|---|---|---|
| `logo_for_dark_bg.svg` | SVG | Full wordmark + mark, cream text — use on forest-dark / dark surfaces (splash screen) |
| `logo_for_light_bg.svg` | SVG | Full wordmark + mark, ink text — use on cream / light surfaces |
| `icon.svg` | SVG | Standalone mark only (no wordmark) — used next to page headings, favicon source |
| `favicon.png` | PNG | Browser tab / home-screen icon |

**Icon system:** Spendid doesn't use a vector icon library for content — categories and
payment modes are represented with user-picked **emoji** (🛒 🍔 🛍️ 🚕 🍼 🔁 ⚕️ 🏠 🩺 💍 🏢
💡 🛵 ⛽ 🅿️ 📈 🤝 🏦 🪙 👕 💇 💪 🙏 ✈️ 🚗 🏨, plus 💵 💳 📱 🏧 for payment modes). The only
vector icons in the app are `react-icons/io5` outline glyphs (`IoGridOutline`,
`IoListOutline`, `IoWalletOutline`, `IoStatsChartOutline`) used exclusively for the four
bottom-nav tabs.

---

## Colors

| Token | Hex | RGBA | Role |
|---|---|---|---|
| `forest` | `#3D4836` | rgba(61,72,54,1) | Primary brand — active states, positive/remaining text, logo diamond |
| `forest-dark` | `#2C342A` | rgba(44,52,42,1) | Deep brand — splash background, dark-mode surface, "over budget" text |
| `terracotta` | `#D9714B` | rgba(217,113,75,1) | Call to action — FAB, Save, primary submit (one accent per screen) |
| `mustard` | `#E0C53D` | rgba(224,197,61,1) | Accent — chart bars, active nav label, coin mark |
| `sage` | `#AFB596` | rgba(175,181,150,1) | Page background surface |
| `sage-light` | `#C7CBB4` | rgba(199,203,180,1) | Surface tint — inactive tab / pill fill |
| `sage-dark` | `#9CA283` | rgba(156,162,131,1) | Surface shade — cash stat tile fill |
| `cream` | `#DBDCC9` | rgba(219,220,201,1) | Card surface — panels, tiles, inputs sit on this |
| `ink` | `#1B1E16` | rgba(27,30,22,1) | Primary text |
| `muted` | `#6E7460` | rgba(110,116,96,1) | Secondary / label text |
| `forest/10` | — | rgba(61,72,54,0.1) | Budget/remaining inset stat bar fill |
| `sage/40` | — | rgba(175,181,150,0.4) | Segmented control track, inactive tile fill |
| `liquid-glass` | — | `linear-gradient(180deg, rgba(61,72,54,.55), rgba(61,72,54,.75))` | Bottom nav frosted-glass panel |

**Functional mapping** (for tools that expect success/danger/warning slots — Spendid has
no red/green traffic-light system, this is a semantic bridge only):
primary → `forest` · secondary → `sage` · dark/text → `ink` · danger/over-limit →
`forest-dark` · success/positive → `forest` · warning/accent → `mustard` · CTA →
`terracotta`.

---

## Typography

Font: **Space Grotesk** (400/500/600/700), loaded from Google Fonts. Fallback
`system-ui, sans-serif`.

| Style | Size / Weight | Usage |
|---|---|---|
| `display-number` | 36px / 700 | Total Spent big number |
| `page-heading` | 30px / 700 | Two-line page title (muted line + ink line) |
| `section-label` | 12px / 600, uppercase, tracking 0.06em | Eyebrow labels ("TOTAL SPENT") |
| `body` | 14px / 600 | List row titles, tab labels, buttons |
| `body-regular` | 14px / 400 | Budget bar text, placeholders |
| `caption` | 12px / 400 | Secondary caption under a value |
| `tile-label` | 10px / 500, uppercase, tracking 0.06em | Category name in a spend tile |
| `micro-tag` | 9px / 600, uppercase, tracking 0.04em | Status tag ("OVER", "Tracking only") |
| `nav-label` | 9px / 500, uppercase, tracking 0.06em | Bottom nav item label |

---

## Shapes, Spacing & Grids

- **Radius:** `14px` ("block", the house radius — used for every card/button/input that
  isn't a circle or pill), `999px` (pill/circle), `6px` (rare, native `<select>`), `28px`
  (bottom nav container).
- **Shadows:** sm `0 1px 2px rgba(27,30,22,.06)` (sticky month-switcher card) · md
  `0 4px 12px rgba(27,30,22,.1)` (mini FAB) · lg `0 10px 30px rgba(27,30,22,.18)` (main
  FAB, open dropdown panels).
- **Page layout:** single column, `max-width: 576px`, centered, `20px` horizontal
  padding, `12px` vertical stack gap between blocks.
- **Grids:** category spend tiles = 4 columns / 8px gap. Cash vs Card vs UPI = 3
  columns / 8px gap.

---

## Components

**Buttons**
- Primary (filled): `bg-terracotta text-cream`, `radius:14px`, full width — "Add Expense" submit.
- Secondary (filled brand): `bg-forest text-cream` — "+ Add Category".
- Neutral (filled muted): `bg-sage/40 text-ink` — "Cancel".
- Segmented pill: track `bg-sage/40 rounded-full`, active segment `bg-forest text-cream rounded-full` — period switch, payment-mode picker.
- Icon toggle (circular, 36px): active `bg-forest text-cream`, inactive `bg-sage/40 text-ink` — filters, edit-categories toggle.
- FAB (112px circle): `bg-terracotta`, `ring-4 ring-sage`, `shadow-lg` — Add expense, half-overlapping the nav bar, always visible.
- Mini FAB (48px circle): `bg-terracotta`, `ring-2 ring-cream` — Save budget; **only rendered while there are unsaved edits**, shows ✓ for 1.5s after saving, then disappears.
- Text icon button: no background, `text-muted` — prev/next month arrows, ✏️/🗑️ row actions.

**Form elements**
- Text/number/date input: `radius:14px`, `bg-sage/40`, no border, focus = darker fill (`bg-sage/70`), not an outline ring.
- Label: `text-xs text-muted`, sits above every input.
- Searchable dropdown (Category Select): trigger button + floating panel (`bg-cream shadow-lg`) with its own search input; option rows highlight `bg-forest text-cream` when selected; closes on outside click. A `compact` mode collapses the trigger to a 36px circular icon button for inline filter bars.
- Segmented toggle field (yearly/monthly, savings flag, payment mode): same active/inactive treatment as segmented pill buttons.

**Cards**
- Hero stat card: `bg-cream`, `radius:14px`, decorative Sunburst SVG bleeding off the top-right corner, eyebrow label → big number → inset stat bar (`bg-forest/10`).
- List container card: `bg-cream`, children separated by a 1px `border-top` (no per-row card, no gap).
- Form card: `bg-cream`, `p-5`, `space-y-3`, eyebrow label at top.
- Tile card (grid cell): `bg-sage/40`, centered column of icon → tile-label → amount.
- Stat tile (3-up): `radius:14px`, one of three fixed background tones.

**Badges / tags** — Spendid does not use filled/pill badges. Status is a bare inline
micro-tag: "OVER" (`text-forest-dark`) next to a category over its budget, "Tracking
only" (`opacity:0.6`) on savings categories.

**Navigation**
- Bottom tab bar: fixed, frosted "liquid glass" material (blurred forest gradient, inset highlight), 4 icon+label tabs, active tab tinted `mustard`.
- Month switcher — **boxed** (sticky `bg-cream shadow-sm` card, used wherever filter/edit controls share the row) vs **bare** (no card, plain row, used alone on Home).
- Two-way segmented tab bar (Expenses/Savings): active tab `bg-cream` flush into the panel below it, inactive `bg-sage/40`; ▲/▼ chevron shows expand state.

**Feedback**
- Update banner: fixed top, full width, `bg-forest-dark text-cream`, inline "Refresh" pill.
- Inline form error: `text-sm text-forest-dark`, plain text, no box.
- Empty state: single muted sentence, no illustration ("No expenses found.").
- Loading spinner: `h-6 w-6 animate-spin rounded-full border-2 border-forest/20 border-t-forest`.
- Splash: full-screen `bg-forest-dark`, centered logo only, ~1s on boot.

---

## Patterns (how components compose into real screens)

1. **App shell** — single column, `bg-sage` page background; header (`Hi, {name}` + sign-out icon); two-line page heading with a logo mark floating top-right; content area is horizontally swipeable between tabs (>60px swipe); bottom nav is fixed and never scrolls.
2. **Hero stat + drill-down tabs (Home)** — hero card (Total Spent → budget/remaining bar) directly above a two-way Expenses/Savings segmented tab that acts as an accordion (click active = collapse, click other = switch+expand); expanded panel is a 4-column tile grid sorted by spend descending.
3. **Category spend grid (Summary tab)** — same Expenses/Savings segmented-tab + 4-column tile idea, reused inside a "Spend by Category" card below a period switch + bar chart, above a Cash/Card/UPI 3-tile breakdown and a CSV export button.
4. **List row (transactions & budget categories)** — one card holds all rows, separated only by a border; tapping edit swaps a row for an inline form in place (no modal); budget rows alternate two background tints instead of borders since they're denser.
5. **Dirty-state floating save** — the Budget tab's save FAB only exists on screen while there's something to save; it never sits idle.
6. **Searchable select** — trigger + anchored floating panel with live-filtered search, reused (without search) for the payment-mode filter, and collapsed to an icon-only `compact` variant for inline filter bars.
7. **Bottom nav + FAB** — 4 tabs in a glass pill; the 5th action (Add) is not a tab, it's an oversized FAB overlapping the nav's right edge, present on every screen.
8. **Decorative motifs** — `Sunburst` (generated radial-spoke SVG, low opacity, bled off one card corner, max once per screen, purely decorative) and `.liquid-glass` (blurred forest gradient + inset highlight, used only for the bottom nav).
9. **Splash / auth gate** — boots into the splash, then resolves to Login / Reset-Password / the app shell based on auth state.

---

## Rules

1. **Earthy, not corporate-finance.** No blue/green fintech cliché — the palette should feel calm and organic.
2. **Cream-on-sage, always.** Every card is `cream` sitting on a `sage` page. Never stack two surface tones without reason, never place a card directly on `cream`.
3. **Color carries meaning sparingly.** No red/green traffic-light system. "Over budget" is the phrase "Over by ₹X" in `forest-dark`, not a red badge. Reserve `terracotta` for actions, not status.
4. **No modals.** Editing happens in place (row → inline form) or in a dedicated tab. Nothing covers the screen except states that own the whole screen anyway (Splash, Login).
5. **One accent per screen.** Exactly one `terracotta` element (the primary action) per screen — don't compete with it.
6. **Emoji as icon system.** Categories/payment modes use user-picked emoji, not an icon library. Reserve `react-icons` strictly for the fixed bottom-nav chrome.
7. **Numbers are the hero.** Every screen leads with a big bold number before any chart or list. Labels above numbers are small, uppercase, muted.
8. **14px block radius is the house radius.** Don't introduce other radii for cards/buttons — only circles/pills deviate.
9. **Floating controls justify their presence.** A floating action stays on screen only while it's actionable.

**Language & voice:** section labels are short, literal, and uppercase ("TOTAL SPENT",
not clever copy). Empty states are one plain sentence. Currency is always full Indian
grouping (`₹1,04,658`), never abbreviated. Category/payment names are Title Case; UI
chrome is UPPERCASE. Buttons are verbs ("Add Expense", "Save", "Export to CSV") — never
"OK"/"Submit".

**Documentation convention:** this file is generated from the live codebase, not the
other way around. If `tailwind.config.js` or `src/components/*` changes, regenerate
rather than hand-editing stale values here.
