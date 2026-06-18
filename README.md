# Spend-O-Meter 💰

A mobile-first personal expense tracker built with React, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend/DB:** Supabase (Postgres + Auth)
- **Charts:** Recharts
- **Hosting:** Vercel

## Features

- Email/password login (single-user app)
- Quick add expense form (date, amount, category, payment mode, description)
- Monthly dashboard: total vs budget, category breakdown with progress bars, cash/card/UPI pie chart, daily spend bar chart
- Expense list with category/payment filters, edit and delete
- Budget setup per category with editable monthly limits
- Monthly summary: month-over-month chart, biggest categories, cash vs card split, CSV export
- Dark mode, INR currency formatting, DD/MM/YYYY dates

## 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates:
   - `expenses` table
   - `budget` table
   - `payment_mode` enum (`cash`, `credit_card`, `upi`, `debit_card`)
   - Row Level Security policies scoping all rows to the logged-in user
3. Go to **Authentication > Providers** and make sure **Email** is enabled. For a single-user app, you can optionally disable "Confirm email" under Auth settings to skip the verification step.
4. Go to **Project Settings > API** and copy the **Project URL** and **anon public key**.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Install and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`, sign up with your email/password, then sign in.

## 4. Set your budget

Go to the **Budget** tab — it's prefilled with these defaults (editable any time):

| Category | Monthly Limit |
|---|---|
| Groceries | ₹8,000 |
| Eating Out | ₹5,000 |
| Shopping | ₹10,000 |
| Cabs | ₹2,500 |
| Baby | ₹5,000 |
| Subscriptions | ₹4,658 |
| Medical | ₹2,000 |
| Misc | ₹5,000 |
| **Total** | **₹42,158** |

## 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or import the GitHub repo directly in the Vercel dashboard. Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under **Project Settings > Environment Variables**. The included `vercel.json` adds an SPA rewrite so client-side routing works on refresh.

## Project Structure

```
src/
  components/   AddExpenseForm, Dashboard, ExpenseList, BudgetSetup, MonthlySummary, MonthSwitcher
  lib/           supabase client, auth context, data hooks, formatting/CSV helpers
  pages/         Login
supabase/
  schema.sql     full DB schema + RLS policies
```
