import { useState } from 'react'
import { useAuth } from './lib/AuthContext'
import { useExpenses } from './lib/useExpenses'
import { useBudget } from './lib/useBudget'
import { currentMonthStr } from './lib/format'
import Login from './pages/Login'
import MonthSwitcher from './components/MonthSwitcher'
import AddExpenseForm from './components/AddExpenseForm'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import BudgetSetup from './components/BudgetSetup'
import MonthlySummary from './components/MonthlySummary'

const TABS = [
  { key: 'dashboard', label: 'Home', icon: '◧' },
  { key: 'expenses', label: 'Activity', icon: '☰' },
  { key: 'budget', label: 'Budget', icon: '◔' },
  { key: 'summary', label: 'Summary', icon: '◷' },
]

const TAB_TITLES = {
  dashboard: ['Track and Spend', 'Your Money'],
  expenses: ['All Recent', 'Transactions'],
  budget: ['Add your', 'Budget Category'],
  summary: ['Compare your', 'Monthly Spend'],
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [month, setMonth] = useState(currentMonthStr())

  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(month)
  const { budgets, saveBudgets } = useBudget(month)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage text-sm text-muted">Loading…</div>
    )
  }

  if (!user) {
    return <Login />
  }

  const initial = (user.email || '?')[0].toUpperCase()
  const title = tab === 'add' ? ['Quick', 'Add Expense'] : TAB_TITLES[tab]

  return (
    <div className="min-h-screen bg-sage pb-28">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream">
          {initial}
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            className="grid h-9 w-9 grid-cols-3 gap-[3px] place-items-center rounded-lg p-2"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-[3px] w-[3px] rounded-full bg-ink" />
            ))}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-block border border-forest/10 bg-cream shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
              <button
                onClick={signOut}
                className="w-full px-3 py-2 text-left text-sm font-medium text-terracotta hover:bg-sage/40"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-5 pt-6">
        <h1 className="text-3xl font-bold leading-tight text-ink">
          <span className="text-muted">{title[0]}</span>
          <br />
          {title[1]}
        </h1>
      </div>

      <main className="mx-auto max-w-xl space-y-3 px-5 pt-6">
        <MonthSwitcher month={month} onChange={setMonth} />

        {tab === 'dashboard' && <Dashboard expenses={expenses} budgets={budgets} />}
        {tab === 'add' && <AddExpenseForm onAdd={addExpense} />}
        {tab === 'expenses' && (
          <ExpenseList expenses={expenses} onUpdate={updateExpense} onDelete={deleteExpense} />
        )}
        {tab === 'budget' && <BudgetSetup budgets={budgets} onSave={saveBudgets} />}
        {tab === 'summary' && <MonthlySummary month={month} expenses={expenses} />}
      </main>

      <nav className="fixed bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-forest px-2 py-2 shadow-xl">
        {TABS.slice(0, 2).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${
              tab === t.key ? 'bg-mustard text-ink' : 'text-cream/70'
            }`}
            aria-label={t.label}
          >
            {t.icon}
          </button>
        ))}
        <button
          onClick={() => setTab('add')}
          aria-label="Add expense"
          className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${
            tab === 'add' ? 'bg-terracotta text-cream' : 'bg-mustard text-ink'
          }`}
        >
          +
        </button>
        {TABS.slice(2).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${
              tab === t.key ? 'bg-mustard text-ink' : 'text-cream/70'
            }`}
            aria-label={t.label}
          >
            {t.icon}
          </button>
        ))}
      </nav>
    </div>
  )
}
