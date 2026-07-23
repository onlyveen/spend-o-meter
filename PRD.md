# Spendid — Product Requirements Document

**Status:** As-built (based on the current application)
**Owner:** Praveen Gorakala
**Platform:** Mobile-first web app

---

## 1. Overview

Spendid is a personal expense and budget tracker for people who want a fast,
low-friction way to log spending, see where their money goes each month, and know at a
glance whether they're on budget — without the complexity of a full accounting or
investment app.

It's designed as a **daily-habit app**: opening it should answer "how am I doing this
month?" in under two seconds, and logging an expense should take under ten.

## 2. Problem Statement

Generic budgeting apps are heavyweight, notification-heavy, and assume a Western
category set and currency. Spreadsheets are flexible but require manual discipline and
give no at-a-glance status. Spendid fills the gap: a personal, opinionated, India-first
tracker with a fully user-editable category list, a monthly budget per category, and a
home screen that leads with one number — how much has been spent, and whether that's
over or under budget.

## 3. Goals

- Logging a single expense should take under 10 seconds.
- "Am I on budget this month?" should be answerable the instant the app opens, with no
  navigation required.
- Support both **spending** categories (have a monthly or yearly limit, count toward
  over/under-budget status) and **savings** categories (tracked, but not
  budget-constrained — e.g. investments, recurring deposits, gold, chit funds).
- Let the user fully own their category list — add, rename, delete, and reclassify —
  instead of shipping a fixed taxonomy.
- Work well one-handed on a phone first; larger screens are a secondary experience of
  the same layout.

## 4. Non-Goals

- Multi-user households / shared budgets / splitting expenses between people.
- Bank or card account linking, or automatic transaction import.
- Investment performance tracking (savings categories track contributions only, not
  returns or market value).
- Bill reminders, recurring-expense automation, or notifications.
- Multi-currency support.
- A native mobile app.

## 5. Target User / Persona

A single adult (or one partner in a household) who wants a personal, private ledger of
monthly spending against self-set limits — not a shared family budgeting tool. Values
speed of entry over analytical depth, and wants a category list that matches their own
life rather than a generic template.

## 6. Information Architecture

Four sections + one persistent action:

| Section | Purpose |
|---|---|
| **Home** | This month's total spent, budget status, and a spend-by-category breakdown |
| **Activity** | Full transaction list for the month, filterable, editable, deletable |
| **Budget** | Per-category limit editor, plus category management |
| **Summary** | Spending trend over time, biggest categories, payment-method split, export |
| **Add** | A persistent action reachable from anywhere, for logging a new expense |

A month switcher scopes Home, Activity, and Budget to a single calendar month; Summary
additionally supports viewing trends by day, week, month, or year.

## 7. Functional Requirements

### 7.1 Account & Access
- Sign up and sign in with email and password.
- Forgot-password flow: request a reset link by email, then set a new password.
- Each person's data is private to their own account.

### 7.2 Add Expense
- Capture: date (defaults to today, can't be set in the future), amount (required),
  category (required), payment mode — Cash / Credit Card / UPI / Debit Card (required,
  defaults to UPI), and an optional description.
- Amount must be a valid positive number; an invalid entry is rejected with a clear
  inline message.
- After saving, the form resets but keeps the same date, so logging several expenses
  from the same day in a row doesn't require re-picking it.
- Reachable from every screen, not just one section.

### 7.3 Home
- Leads with **Total Spent** this month — combined spending and savings.
- Shows budget status directly underneath: total budget for the month, and either how
  much is left or how much the user is over by. Savings contributions never count
  against this budget status.
- Two breakdowns available on demand — **Expenses** and **Savings** — each showing its
  own total, and expandable into a grid of categories with amounts, largest first.

### 7.4 Activity
- Full list of the month's transactions, most recent first.
- Filter by category and/or payment mode, independently or together.
- Edit any transaction in place — no separate screen.
- Delete any transaction with a single action.

### 7.5 Budget
- One editable limit per category, per month.
- Categories marked as savings are tracked but excluded from the total budget.
- A running total of the month's overall budget is always visible while editing.
- Changes must be explicitly saved; unsaved changes are clearly indicated, and saving is
  confirmed.
- Categories can be added, renamed, deleted, and reclassified (monthly vs. yearly,
  spending vs. savings) from the same screen. Renaming a category updates it everywhere
  it's already been used, so past transactions stay correctly labeled.
- New categories start with a sensible default (monthly, spending, no limit) and can be
  fully customized immediately.

### 7.6 Summary
- Trend view of total spending over time, switchable between daily, weekly, monthly,
  and yearly windows.
- Full spend-by-category breakdown for the month (not just a top few), split into
  Expenses and Savings.
- Breakdown of spending by payment method (cash, card, UPI).
- Export the month's transactions for use outside the app.

### 7.7 Categories
- Every category has a name, an icon, a billing period (monthly or yearly), a flag for
  whether it's a spending or savings category, and a default limit.
- New accounts start with a broad, ready-to-use set of everyday categories (groceries,
  rent, travel, subscriptions, savings instruments, etc.), which the user can freely
  edit, extend, or trim down — it's a starting point, not a fixed list.
- Categories persist independently of any single month; budget limits can change
  month to month without losing history.

### 7.8 General Behavior
- The user is notified in-app when a newer version is available and can refresh to get
  it.
- A brief branded loading screen appears on cold start.
- Swiping left or right moves between the main sections.
- The app adapts to the device's light/dark preference automatically.

## 8. Success Metrics

Success is currently judged qualitatively rather than through usage analytics:
- The user logs expenses same-day, most days, without it feeling like a chore.
- The user can state their over/under-budget status for the current month without doing
  their own math.
- The category and budget structure stays accurate over time — editing is easy enough
  that the user actually keeps it current instead of working around stale categories.

## 9. Out of Scope (current version)

- Multi-currency support.
- Automatic recurring-expense logging.
- Receipt photo attachment.
- Shared or household accounts.
- Proactive notifications (over-budget alerts, reminders to log an expense).
- Importing transactions from a bank or another app.

## 10. Open Questions / Future Considerations

- Should the app proactively alert when a category crosses its limit, rather than only
  showing a passive marker when the user looks?
- Should a new month be able to copy forward the previous month's budget limits, rather
  than resetting to each category's default?
- Should expense deletion have a brief undo window instead of being immediate and final?
- Should the user be able to manually reorder categories, rather than new ones always
  being added at the end?
- What would make it worth adding any usage tracking at all, given the app currently
  collects none?
