import { useState } from 'react'
import { useAuth } from './lib/AuthContext'
import { useExpenses } from './lib/useExpenses'
import { useBudget } from './lib/useBudget'
import { currentMonthStr } from './lib/format'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import MonthSwitcher from './components/MonthSwitcher'
import AddExpenseForm from './components/AddExpenseForm'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import BudgetSetup from './components/BudgetSetup'
import MonthlySummary from './components/MonthlySummary'
import { IoGridOutline, IoListOutline, IoWalletOutline, IoStatsChartOutline } from 'react-icons/io5'

const TABS = [
  { key: 'dashboard', label: 'Home', icon: IoGridOutline },
  { key: 'expenses', label: 'Activity', icon: IoListOutline },
  { key: 'budget', label: 'Budget', icon: IoWalletOutline },
  { key: 'summary', label: 'Summary', icon: IoStatsChartOutline },
]

const TAB_TITLES = {
  dashboard: ['Track and Spend', 'Your Money'],
  expenses: ['All Recent', 'Transactions'],
  budget: ['Add your', 'Budget Category'],
  summary: ['Compare your', 'Monthly Spend'],
}

export default function App() {
  const { user, loading, signOut, recovery, clearRecovery } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [month, setMonth] = useState(currentMonthStr())

  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(month, !loading && !!user)
  const { budgets, saveBudgets } = useBudget(month, !loading && !!user)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage text-sm text-muted">Loading…</div>
    )
  }

  if (recovery) {
    return <ResetPassword onDone={clearRecovery} />
  }

  if (!user) {
    return <Login />
  }

  const title = tab === 'add' ? ['Quick', 'Add Expense'] : TAB_TITLES[tab]
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email || '').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="min-h-screen bg-sage">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-center justify-between px-5 pt-6">
          <p className="text-sm font-semibold text-ink">Hi, {displayName}</p>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-forest-dark hover:bg-sage/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className="px-5 pt-6">
          <h1 className="text-3xl font-bold leading-tight text-ink">
            <span className="text-muted">{title[0]}</span>
            <br />
            {title[1]}
          </h1>
        </div>

        <main className="w-full space-y-3 px-5 pt-6 pb-28 md:pb-40">
          <MonthSwitcher month={month} onChange={setMonth} />

          {tab === 'dashboard' && <Dashboard expenses={expenses} budgets={budgets} />}
          {tab === 'add' && <AddExpenseForm onAdd={addExpense} />}
          {tab === 'expenses' && (
            <ExpenseList expenses={expenses} onUpdate={updateExpense} onDelete={deleteExpense} />
          )}
          {tab === 'budget' && <BudgetSetup budgets={budgets} onSave={saveBudgets} />}
          {tab === 'summary' && <MonthlySummary month={month} expenses={expenses} />}
        </main>
      </div>

      <nav className="liquid-glass fixed inset-x-0 bottom-0 z-50 h-20 overflow-visible rounded-t-[28px] px-2 pb-[env(safe-area-inset-bottom)] md:bottom-[5%] md:mx-auto md:max-w-xl md:rounded-[28px]">
        <div className="flex h-full items-center justify-around pr-24">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl ${tab === t.key ? 'text-mustard' : 'text-cream/80'
                }`}
              aria-label={t.label}
            >
              <span className="flex h-9 w-9 items-center justify-center text-2xl leading-none">
                <t.icon />
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wide">{t.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setTab('add')}
          aria-label="Add expense"
          className={`absolute -right-4 top-1/2 flex h-28 w-28 -translate-y-1/2 items-center justify-center rounded-full text-3xl font-bold shadow-lg ring-4 ring-sage ${tab === 'add' ? 'bg-terracotta text-cream' : 'bg-terracotta/90 text-cream'
            }`}
        >
          +
        </button>
      </nav>
    </div>
  )
}
