import { useMemo, useState } from 'react'
import { formatDateDDMMYYYY, formatINR } from '../lib/format'
import Sunburst from './Sunburst'

export default function Dashboard({ expenses, budgets, categories }) {
  const [selectedTab, setSelectedTab] = useState('expenses')
  const [expanded, setExpanded] = useState(false)
  const catByName = useMemo(() => Object.fromEntries(categories.map((c) => [c.name, c])), [categories])

  function monthlyLimit(b) {
    const value = Number(b.monthly_limit)
    return catByName[b.category]?.period === 'yearly' ? value / 12 : value
  }

  const totalBudget = useMemo(
    () => budgets.filter((b) => !catByName[b.category]?.is_savings).reduce((sum, b) => sum + monthlyLimit(b), 0),
    [budgets, catByName]
  )
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses])
  const spendOnly = useMemo(
    () => expenses.filter((e) => !catByName[e.category]?.is_savings).reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses, catByName]
  )
  const totalSavings = totalSpent - spendOnly

  const byCategory = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    }
    return budgets
      .map((b) => ({
        category: b.category,
        icon: catByName[b.category]?.icon,
        spent: map[b.category] || 0,
        savings: !!catByName[b.category]?.is_savings,
      }))
      .sort((a, b) => b.spent - a.spent)
  }, [expenses, budgets, catByName])

  const remaining = totalBudget - spendOnly

  const expenseCategories = useMemo(() => byCategory.filter((c) => !c.savings), [byCategory])
  const savingsTransactions = useMemo(
    () => expenses.filter((e) => catByName[e.category]?.is_savings),
    [expenses, catByName]
  )

  function selectTab(tab) {
    if (tab === selectedTab) {
      setExpanded((e) => !e)
    } else {
      setSelectedTab(tab)
      setExpanded(true)
    }
  }

  return (
    <div className="overflow-hidden rounded-block border border-[#A1A88A] bg-cream">
      <div className="relative overflow-hidden p-5">
        <Sunburst
          size={280}
          color="#3D4836"
          opacity={0.12}
          className="pointer-events-none absolute -right-16 -top-16"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Spent</p>
          <p className="mt-1 text-4xl font-bold text-ink">{formatINR(totalSpent)}</p>
          <div className="mt-3 flex items-center justify-between rounded-block bg-forest/10 px-3 py-2 text-sm">
            <span className="text-muted">Budget {formatINR(totalBudget)}</span>
            <span className={remaining < 0 ? 'font-semibold text-forest-dark' : 'font-semibold text-forest'}>
              {remaining < 0 ? `Over by ${formatINR(-remaining)}` : `${formatINR(remaining)} left`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-t border-[#CACCB3]">
        <button
          type="button"
          onClick={() => selectTab('expenses')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 pb-4 pt-3 outline-none ${
            expanded && selectedTab === 'expenses' ? 'border-b-[3px] border-[#535B4C]' : ''
          }`}
        >
          <span className="text-sm font-medium text-ink opacity-50">Expenses</span>
          <span
            className={`text-sm font-bold ${
              expanded && selectedTab === 'expenses' ? 'text-[#535B4C]' : 'text-ink opacity-50'
            }`}
          >
            {formatINR(spendOnly)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => selectTab('savings')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 pb-4 pt-3 outline-none ${
            expanded && selectedTab === 'savings' ? 'border-b-[3px] border-[#535B4C]' : ''
          }`}
        >
          <span className="text-sm font-medium text-ink opacity-50">Savings</span>
          <span
            className={`text-sm font-bold ${
              expanded && selectedTab === 'savings' ? 'text-[#535B4C]' : 'text-ink opacity-50'
            }`}
          >
            {formatINR(totalSavings)}
          </span>
        </button>
      </div>

      {expanded && selectedTab === 'expenses' && (
        <div className="p-3">
          {expenseCategories.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted">No expense categories.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {expenseCategories.map((c) => (
                <div
                  key={c.category}
                  className="flex flex-col items-center gap-1 rounded-block bg-sage/40 px-2 py-3 text-center"
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ink">
                    {c.category}
                  </span>
                  <span className="text-xs font-bold text-ink">{formatINR(c.spent)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {expanded && selectedTab === 'savings' && (
        <div className="p-3">
          {savingsTransactions.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted">No savings transactions.</p>
          ) : (
            <div className="overflow-hidden rounded-block bg-sage/40">
              {savingsTransactions.map((e, i) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-sage-dark/30' : ''}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-block bg-forest text-base text-cream">
                    {catByName[e.category]?.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{e.description || e.category}</p>
                    <p className="truncate text-[10px] uppercase tracking-wide text-muted">{e.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{formatINR(e.amount)}</p>
                    <p className="text-[10px] text-muted">{formatDateDDMMYYYY(e.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
