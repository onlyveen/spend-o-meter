# Spendid — Full App Blueprint

A complete specification to recreate the Spendid personal finance tracker from scratch. Target audience: any LLM or developer starting with an empty directory.

---

## 1. What the App Is

**Spendid** is a mobile-first personal expense tracker and budget manager. It is built for a single user (one account per household). The app is designed for Indian users (currency: INR, payment modes: UPI/Cash/Card).

Core loop: log an expense → see it against your budget → review spending trends.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 (Vite, ESM) |
| Styling | Tailwind CSS v3 (custom design tokens) |
| Backend / DB / Auth | Supabase (Postgres + Auth + RLS) |
| Charts | Recharts |
| Icons | react-icons (io5 set) |
| Date helpers | date-fns |
| Font | Space Grotesk (Google Fonts) |

### package.json dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "date-fns": "^3.6.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-icons": "^5.6.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.3"
  }
}
```

---

## 3. Design System

### Color Palette (`tailwind.config.js`)
```js
colors: {
  sage:       { DEFAULT: '#AFB596', light: '#C7CBB4', dark: '#9CA283' },
  cream:      '#DBDCC9',
  mustard:    '#E0C53D',
  forest:     { DEFAULT: '#3D4836', dark: '#2C342A' },
  terracotta: '#D9714B',
  ink:        '#1B1E16',
  muted:      '#6E7460',
}
```

### Typography
- Font: `Space Grotesk` (load from Google Fonts in `index.html`)
- Defined via `fontFamily: { sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'] }`

### Border Radius
- `borderRadius: { block: '14px' }` — used everywhere as `rounded-block`

### Page Background
- `bg-sage` — the global background color for all authenticated screens

### Liquid Glass Nav Bar (CSS class)
```css
.liquid-glass {
  background: linear-gradient(180deg, rgba(61,72,54,0.55), rgba(61,72,54,0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow:
    0 8px 32px rgba(27,30,22,0.35),
    inset 0 1px 0 rgba(255,255,255,0.35),
    inset 0 -1px 0 rgba(0,0,0,0.15);
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 45%);
  pointer-events: none;
}
```

---

## 4. Database Schema (Supabase / PostgreSQL)

Run in the Supabase SQL editor.

```sql
create extension if not exists "pgcrypto";

-- Enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_mode') then
    create type payment_mode as enum ('cash', 'credit_card', 'upi', 'debit_card');
  end if;
end$$;

-- expenses
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  date         date not null default current_date,
  amount       numeric(12,2) not null check (amount > 0),
  category     text not null,
  payment_mode payment_mode not null,
  description  text,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_user_date_idx     on expenses (user_id, date);
create index if not exists expenses_user_category_idx on expenses (user_id, category);

-- budget (per-category monthly target, keyed by YYYY-MM string)
create table if not exists budget (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category      text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  month         text not null, -- 'YYYY-MM'
  unique (user_id, category, month)
);
create index if not exists budget_user_month_idx on budget (user_id, month);

-- categories (user-managed; category name is stored as plain text in expenses/budget,
-- so renames must cascade via app code)
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name          text not null,
  icon          text not null default '✦',
  period        text not null default 'monthly' check (period in ('monthly','yearly')),
  is_savings    boolean not null default false,
  default_limit numeric(12,2) not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists categories_user_sort_idx on categories (user_id, sort_order);

-- Row Level Security
alter table expenses   enable row level security;
alter table budget     enable row level security;
alter table categories enable row level security;

create policy "Users can manage their own expenses"
  on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own budget"
  on budget   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own categories"
  on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Key schema decisions
- `category` is stored as plain text (not a FK) in `expenses` and `budget`. When a category is renamed in the app, the app explicitly updates all matching rows in both tables.
- `budget.monthly_limit` stores the raw value the user entered. For `yearly` categories, the value is divided by 12 in the UI to get the monthly equivalent.
- `is_savings` categories appear in the tracker but are excluded from budget totals (they are "tracking only").

---

## 5. Environment Variables

Create a `.env` file:
```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

`src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 6. App Structure & File Layout

```
src/
  main.jsx                  — mounts <AuthProvider><App/></AuthProvider>
  App.jsx                   — root shell: tab routing, header, bottom nav
  index.css                 — tailwind directives + .liquid-glass class
  pages/
    Login.jsx               — sign in / sign up / forgot password
    ResetPassword.jsx       — password reset form (triggered by email link)
  components/
    Splash.jsx              — 1-second branded loading screen shown on cold start
    UpdateBanner.jsx        — sticky bottom banner when a new app version is available
    MonthSwitcher.jsx       — prev/next chevron controls + current month label
    Dashboard.jsx           — total spent card + collapsible category breakdown
    AddExpenseForm.jsx      — form to log a new expense
    ExpenseList.jsx         — filtered, editable, deletable list of expenses
    BudgetSetup.jsx         — per-category budget limit editor + category manager
    MonthlySummary.jsx      — bar chart + biggest-spend + payment-mode breakdown + CSV export
    CategorySelect.jsx      — searchable dropdown for picking a category
    Sunburst.jsx            — decorative SVG sunburst used as background art
  lib/
    supabase.js             — supabase client singleton
    AuthContext.jsx         — React context for auth session + recovery state
    constants.js            — DEFAULT_CATEGORIES seed, PAYMENT_MODES list
    format.js               — formatINR, formatDateDDMMYYYY, currentMonthStr, shiftMonth, todayISO
    csv.js                  — expensesToCSV + downloadCSV helpers
    useExpenses.js          — CRUD hook for expenses, scoped to a month
    useCategories.js        — CRUD hook for categories + first-run seeding
    useBudget.js            — fetch/save budgets for a given month
    useSpendHistory.js      — time-bucketed spend data for the Summary bar chart
    useAppUpdate.js         — detects new service worker versions; returns boolean
```

---

## 7. App Shell (`App.jsx`)

### Tabs
Four bottom-nav tabs + one floating action button:

| Key | Label | Icon (react-icons/io5) |
|---|---|---|
| `dashboard` | Home | `IoGridOutline` |
| `expenses` | Activity | `IoListOutline` |
| `budget` | Budget | `IoWalletOutline` |
| `summary` | Summary | `IoStatsChartOutline` |
| `add` | (FAB, no tab) | `+` |

### Header
- Greeting: "Hi, {displayName}" — derived from `user.user_metadata.full_name` or email prefix
- Sign-out icon button (door/arrow SVG) top-right
- Two-line dynamic title below the header row (changes per tab)
- App icon (`/images/icon.svg`) shown right of the title

### Title strings per tab
```js
dashboard → ['Track and Spend', 'Your Money']
expenses  → ['All Recent', 'Transactions']
budget    → ['Add your', 'Budget Category']
add       → ['Quick', 'Add Expense']
summary   → ['Compare your', `${period} Spend`]  // period = Daily/Weekly/Monthly/Yearly
```
The first line renders in `text-muted`, second line in `text-ink`.

### MonthSwitcher
Always rendered below the title. Lets the user navigate months. All data hooks receive the current `month` string (`YYYY-MM`) and re-fetch on change.

### Bottom Nav
- Fixed to bottom on mobile, centered card floating 5% from bottom on `md:` screens
- `rounded-t-[28px]` on mobile, fully rounded on desktop
- Uses `.liquid-glass` CSS class
- Nav buttons: icon (2xl) + label (9px uppercase)
- Active tab: `text-mustard`; inactive: `text-cream/80`
- FAB (`+` button): `h-28 w-28` circle, positioned `-right-4 top-1/2 -translate-y-1/2`, `bg-terracotta text-cream`, `ring-4 ring-sage`

### Swipe navigation
Touch swipe left/right (≥60px horizontal, more horizontal than vertical) cycles through tabs in order. Disabled on the `add` tab.

### Render order / guards
1. Show `<Splash />` for 1 second on mount
2. Show spinner if auth is loading
3. Show `<ResetPassword />` if in password-recovery flow
4. Show `<Login />` if no authenticated user
5. Otherwise render the main app

`<UpdateBanner />` is rendered on top of all screens.

---

## 8. Authentication (`AuthContext.jsx`)

- Wraps the app in a React context
- Calls `supabase.auth.getSession()` on mount; listens to `onAuthStateChange`
- Exposes: `{ session, user, loading, recovery, clearRecovery, signOut }`
- `recovery` is set to `true` when the event is `PASSWORD_RECOVERY`

### Login page
Three modes toggled by link buttons: `sign_in` / `sign_up` / `forgot`
- Sign in: `supabase.auth.signInWithPassword`
- Sign up: `supabase.auth.signUp`
- Forgot: `supabase.auth.resetPasswordForEmail({ redirectTo: window.location.origin })`
- Styled card centered on `bg-sage` with logo + decorative `<Sunburst />`

---

## 9. Data Hooks

### `useExpenses(month, ready)`
- Fetches all expenses for the given month (`date >= YYYY-MM-01` and `date <= last-day`)
- Ordered by `date desc, created_at desc`
- Exposes: `{ expenses, loading, error, addExpense, updateExpense, deleteExpense }`

### `useCategories(ready)`
- Fetches user's categories ordered by `sort_order asc`
- On first login (empty result), seeds the DB with `DEFAULT_CATEGORIES`
- On rename: cascades update to `expenses.category` and `budget.category` for that user
- Exposes: `{ categories, loading, error, addCategory, updateCategory, deleteCategory }`

### `useBudget(month, categories, ready)`
- Fetches budget rows for the given month
- Merges with all categories (categories without a budget row get `default_limit` as fallback)
- `saveBudgets`: upserts all rows with conflict key `(user_id, category, month)`
- Exposes: `{ budgets, loading, error, saveBudgets }`

### `useSpendHistory(month, period)`
- Builds time buckets based on `period`: daily (7 days), weekly (6 weeks), monthly (6 months), yearly (4 years)
- Anchor = today if current month, else last day of the month
- Fetches expenses spanning the entire bucket range in one query, then groups client-side
- Exposes: `{ history, loading }` where `history = [{ label, total, expenses }]`

### `useAppUpdate()`
- Listens for service worker `controllerchange` to detect a new version
- Returns a boolean `updateAvailable`

---

## 10. Constants

### Payment Modes
```js
[
  { value: 'cash',        label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'upi',         label: 'UPI' },
  { value: 'debit_card',  label: 'Debit Card' },
]
```

### Default Categories (seeded on first login)
27 categories with emoji icons. Examples:
- `Groceries` 🛒 monthly ₹8,000
- `Eating Out` 🍔 monthly ₹5,000
- `Shopping` 🛍️ monthly ₹10,000
- `Subscriptions` 🔁 **yearly** ₹55,896
- `SIP` 📈 monthly — `is_savings: true`
- `Gold` 🪙 monthly — `is_savings: true`
- `Trips` ✈️ **yearly** ₹0
- `Health/Gym` 💪 **yearly** ₹0

---

## 11. Screen Specifications

### Dashboard (`tab = 'dashboard'`)
**Total Spent card** (cream bg, full width):
- Decorative `<Sunburst />` SVG in the top-right corner of the card
- Big number: total spent this month (excluding `is_savings` categories)
- Budget pill below: "Budget ₹X" on left, "₹Y left" or "Over by ₹Y" on right
  - Green (`text-forest`) when under budget, dark red (`text-forest-dark`) when over
- Clicking the card toggles a category breakdown list

**Category breakdown** (collapsible, 80-row max-height scroll):
- One row per budget category, sorted by `spent desc`
- Alternating `bg-sage` / `bg-sage-dark` rows
- Shows icon, name, amount spent, limit; "OVER" badge if spent > limit
- Yearly categories show `of ₹X (₹Y/yr)` for the limit

### Add Expense (`tab = 'add'`)
Form fields:
1. **Date** — date input, max = today
2. **Amount** — number input, decimal, label "Amount (₹)"
3. **Category** — `<CategorySelect />` dropdown
4. **Payment Mode** — 4-button grid (Cash / Credit Card / UPI / Debit Card); selected = `bg-forest text-cream`
5. **Description** — optional text input
- Submit button: terracotta, "Add Expense" / "Saving…"
- After save: resets form (keeps same date)

### Expense List (`tab = 'expenses'`)
Two filter dropdowns at top:
- `<CategorySelect />` (shows "All categories" option)
- Payment mode `<select>`

Each expense row (cream card, dividers between rows):
- Left: category icon in `bg-forest` circle
- Middle: category name + `{PAYMENT_MODE} · {description}` in muted text
- Right: formatted amount + DD/MM/YYYY date
- Far right: ✏️ edit button + 🗑️ delete button

**Inline edit mode** (replacing the row):
- Grid: date input + amount input
- Grid: CategorySelect + payment mode select
- Description text input
- Save / Cancel buttons

### Budget Setup (`tab = 'budget'`)
**Edit Categories toggle** button at top.

Budget list (alternating `bg-sage` / `bg-forest text-cream`, border-2 forest):
- Normal mode: icon + category name + inline number input for limit
  - Yearly categories show `/ yr` label and monthly equivalent below
- Edit mode: inline text input for name rename + pill buttons for period toggle (Monthly/Yearly) + Savings toggle + 🗑️ delete button

**Add Category panel** (shown when editing):
- Emoji icon input (2 chars max) + name text input
- Period toggle pill (Monthly/Yearly)
- Savings toggle pill
- "+ Add Category" button

**Total Variable Budget** summary row (excludes savings categories, prorates yearly to monthly).

**Save Budget** button: terracotta, shows "Saved ✓" briefly after save.

### Summary (`tab = 'summary'`)
Period switcher pill: Daily / Weekly / Monthly / Yearly — right-aligned, above chart.

**Bar chart** (Recharts `BarChart`, 208px height):
- `fill="#E0C53D"` (mustard), rounded top corners
- X axis: bucket labels, Y axis: INR amounts, tooltip formats with `formatINR`
- Data from `useSpendHistory`

**Biggest Spend Categories** card:
- Top 5 categories by total spend this month
- Icon + name + formatted amount

**Cash vs Card vs UPI** card:
- 3-column grid: Cash (`bg-sage-dark`), Card (`bg-forest`), UPI (`bg-forest-dark`)

**Export to CSV** button: terracotta, triggers download of `spendid-YYYY-MM.csv`

CSV columns: `date,amount,category,payment_mode,description`

---

## 12. Shared Components

### `<CategorySelect />`
Custom searchable dropdown (not a native `<select>`):
- Trigger button shows icon + name (or placeholder)
- Dropdown: search input autofocused → filtered list → each option is a `<button>`
- Selected item: `bg-forest text-cream`; hover: `bg-sage/30`
- Closes on outside click
- Used in AddExpenseForm, ExpenseList (filter + edit), BudgetSetup is not affected

### `<MonthSwitcher />`
- Left chevron `‹` / right chevron `›` buttons
- Center: month label (`en-IN` locale, e.g. "June 2026")
- Clicking chevrons calls `shiftMonth(month, ±1)` and passes result to `onChange`

### `<Sunburst />`
Decorative SVG: concentric rings of radial lines. Props: `size`, `color`, `opacity`, `className`.
Used as background art on the Login page and Dashboard card.

### `<Splash />`
Full-screen `bg-sage` with centered logo. Shown for exactly 1000ms on cold start.

### `<UpdateBanner />`
Sticky bottom strip (`bg-mustard text-ink`, above the nav). Only visible when `show={true}`.
Message: "A new version is available — reload to update"
Click reloads the page.

---

## 13. Format Utilities (`src/lib/format.js`)

```js
formatINR(amount)           // Intl.NumberFormat 'en-IN', INR, no decimals
formatDateDDMMYYYY(str)     // "28/06/2026"
currentMonthStr()           // "2026-06"
monthLabel(monthStr)        // "June 2026"
shiftMonth(monthStr, delta) // "2026-07" from ("2026-06", 1)
todayISO()                  // timezone-corrected "YYYY-MM-DD"
```

---

## 14. CSV Export (`src/lib/csv.js`)

```js
export function expensesToCSV(expenses) {
  const header = 'date,amount,category,payment_mode,description'
  const rows = expenses.map(e =>
    [e.date, e.amount, e.category, e.payment_mode, e.description ?? ''].join(',')
  )
  return [header, ...rows].join('\n')
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## 15. Key Implementation Rules

1. **Yearly budget categories**: `monthly_limit` in the DB stores the annual figure. Divide by 12 for monthly display and for comparisons against monthly spend.
2. **Savings categories**: `is_savings = true` means the category is excluded from budget totals and shown with a "Tracking only" badge. Expenses still log normally.
3. **Category rename cascade**: When `updateCategory` is called with a new `name`, the app also runs `UPDATE expenses SET category = $new WHERE user_id = $uid AND category = $old` and the same for `budget`.
4. **Month scoping**: Expenses are fetched with `date >= YYYY-MM-01` and `date <= YYYY-MM-{lastDay}`. Budget is fetched with `eq('month', 'YYYY-MM')`.
5. **First-run seeding**: If `categories` table is empty for a user, the app inserts all 27 `DEFAULT_CATEGORIES` in a single insert call with `sort_order` = array index.
6. **Budget merge**: `useBudget` always returns one row per category (merging DB rows with `categories`). Categories with no DB row use `default_limit`.
7. **Swipe tabs**: Only horizontal swipes ≥ 60px with `|dx| > |dy|` trigger tab changes. Disabled on the `add` tab.
8. **Layout max-width**: `max-w-xl mx-auto` constrains the content on tablets/desktop. The floating nav on `md:` screens has `bottom-[5%] mx-auto max-w-xl rounded-[28px]`.
9. **Safe-area insets**: Nav bar uses `pb-[env(safe-area-inset-bottom)]` for iPhone notch.
10. **No dark mode toggle**: Dark mode class is configured but not toggled by the app — it follows the OS via `color-scheme: light dark`.

---

## 16. Assets

- `/images/icon.svg` — app icon shown in the header
- `/images/logo_for_light_bg.svg` — wordmark logo used on the Login page
- Both are inline SVGs served as static files from `/public/images/`

---

## 17. PWA / Service Worker

The app uses a service worker (via Vite PWA plugin or manual registration) to enable "install to home screen". `useAppUpdate` listens for `navigator.serviceWorker` `controllerchange` events and sets `updateAvailable = true`, which triggers `<UpdateBanner />`.

---

## 18. Rebuild Checklist

- [ ] `npm create vite@latest spendid -- --template react`
- [ ] Install all dependencies from §2
- [ ] Add Google Fonts link for Space Grotesk in `index.html`
- [ ] Configure `tailwind.config.js` with tokens from §3
- [ ] Add `.liquid-glass` CSS class in `index.css`
- [ ] Create Supabase project; run schema SQL from §4
- [ ] Add `.env` with Supabase URL + anon key (§5)
- [ ] Build files in order: `supabase.js` → `AuthContext` → hooks → components → pages → `App.jsx`
- [ ] Wire `DEFAULT_CATEGORIES` seed in `useCategories`
- [ ] Test: sign up → budget setup → add expense → verify dashboard totals
- [ ] Test: rename a category → verify cascade on expenses + budget rows
- [ ] Test: yearly category → verify ÷12 in dashboard and budget total
- [ ] Test: swipe navigation on mobile
- [ ] Test: CSV export from Summary tab
