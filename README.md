<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/onlyveen/spend-o-meter/main/public/images/logo_for_dark_bg.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/onlyveen/spend-o-meter/main/public/images/logo_for_light_bg.svg">
  <img alt="Spendid" src="https://raw.githubusercontent.com/onlyveen/spend-o-meter/main/public/images/logo_for_light_bg.svg" width="420">
</picture>

### Track and spend your money — beautifully.

A mobile-first, shared household expense tracker. Log a spend in three taps, see where the
month is going, and keep every category honest against its budget.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Overview

**Spendid** (repo: `spend-o-meter`) is a small, opinionated personal-finance app built for a
phone screen first. It is designed for a household rather than a single person: everyone who
signs in shares one ledger, and each transaction shows who added it. Categories are not
hard-coded — you create them, pick an emoji, decide whether they are monthly or yearly, and
mark the ones that are actually *savings* so they never count against your spending budget.

Everything lives in Supabase (Postgres + Auth), the UI is React + Tailwind, and the whole
thing deploys to Vercel as a static SPA.

## Features

**Logging**
- Quick-add form: date, amount, category, payment mode, optional description
- Emoji category picker and payment-mode picker (Cash / Credit Card / UPI / Debit Card)
- Floating action button, swipe between tabs, and a bottom nav built for one thumb

**Dashboard**
- Total spent for the month against your combined budget, with *left* / *over by* status
- Expenses vs. Savings split — savings categories are tracked but excluded from the budget
- Per-category spend tiles, sorted by amount, with each category's emoji

**Activity**
- Full expense list with category and payment-mode filters
- Inline edit and delete on any row
- "Added by You / <name>" attribution per transaction

**Budget**
- Per-category monthly limits, editable per month
- Create, rename, re-icon, and delete categories on the fly
- Yearly categories (e.g. subscriptions, trips) are amortised to a monthly figure
- Mark a category as *savings* to make it tracking-only

**Summary**
- Spend-over-time bar chart across four windows: daily, weekly, monthly, yearly
- Spend by category, split into Expense and Savings tabs
- Cash vs. Card vs. UPI breakdown
- One-tap **CSV export** of the current month

**Under the hood**
- Email/password auth with sign-up and password reset flows
- Build-ID polling shows an "update available" banner when a new deploy ships
- INR currency formatting, DD/MM/YYYY dates, Space Grotesk type, and a documented design system

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 18, Vite 5 |
| Styling | Tailwind CSS 3, Space Grotesk |
| Charts | Recharts |
| Icons | Emoji (content) + `react-icons/io5` (nav) |
| Backend | Supabase — Postgres, Auth, Row Level Security |
| Dates | `date-fns` |
| Hosting | Vercel |

## Getting Started

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). It creates the
   `profiles`, `expenses`, `budget`, and `categories` tables, the `payment_mode` enum, the
   new-user trigger, and all RLS policies.
3. Under **Authentication → Providers**, enable **Email**. For a private household app you can
   disable "Confirm email" to skip verification.
4. Copy the **Project URL** and **anon public key** from **Project Settings → API**.

### 2. Configure environment variables

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Sign up with your email, and the default category set
([`src/lib/constants.js`](src/lib/constants.js)) is seeded on first login.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Data Model

| Table | Key columns |
|---|---|
| `profiles` | `id` → `auth.users`, `email`, `full_name` — auto-created by trigger on sign-up |
| `expenses` | `date`, `amount`, `category`, `payment_mode`, `description`, `user_id` |
| `budget` | `category`, `monthly_limit`, `month` (`YYYY-MM`), unique per user/category/month |
| `categories` | `name`, `icon`, `period` (`monthly`/`yearly`), `is_savings`, `default_limit`, `sort_order` |

> **Note on RLS:** the policies in `schema.sql` let any *authenticated* user read and write all
> expenses, budgets, and categories — that is deliberate, so a household shares one ledger.
> Tighten the policies to `auth.uid() = user_id` if you want per-user isolation.

## Project Structure

```
src/
  components/   AddExpenseForm, Dashboard, ExpenseList, BudgetSetup, MonthlySummary,
                MonthSwitcher, CategorySelect, PaymentModeSelect, Sunburst, Splash, UpdateBanner
  lib/          supabase client, AuthContext, data hooks (useExpenses, useCategories,
                useBudget, useProfiles, useSpendHistory, useAppUpdate), format + CSV helpers
  pages/        Login, ResetPassword
supabase/
  schema.sql    tables, enum, trigger, RLS policies
design-system/
  DESIGN_SYSTEM.md + assets/   colours, type scale, spacing, logo files
public/images/  logos, icon, favicon
```

## Design System

Colours, typography, radii, shadows, and component anatomy are documented in
[`design-system/DESIGN_SYSTEM.md`](design-system/DESIGN_SYSTEM.md).

| Token | Hex | Role |
|---|---|---|
| `forest` | `#3D4836` | Primary brand |
| `terracotta` | `#D9714B` | Call to action |
| `mustard` | `#E0C53D` | Accent / charts |
| `sage` | `#AFB596` | Page background |
| `cream` | `#DBDCC9` | Card surface |
| `ink` | `#1B1E16` | Primary text |

## Deployment

```bash
npm install -g vercel
vercel
```

Or import the GitHub repo in the Vercel dashboard and add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` under **Project Settings → Environment Variables**. The included
[`vercel.json`](vercel.json) adds the SPA rewrite so client-side routing survives a refresh, and
marks `index.html` as no-cache so the in-app update banner can detect new builds.
