import { useMemo, useState } from 'react'
import { formatINR } from '../lib/format'
import Sunburst from './Sunburst'

const BLOCK_STYLES = [
  { bg: 'bg-sage', text: 'text-ink', muted: 'text-ink/60' },
  { bg: 'bg-sage-dark', text: 'text-ink', muted: 'text-ink/60' },
]

export default function Dashboard({ expenses, budgets, categories }) {
  const [showCategories, setShowCategories] = useState(false)
  const catByName = useMemo(() => Object.fromEntries(categories.map((c) => [c.name, c])), [categories])

  function monthlyLimit(b) {
    const value = Number(b.monthly_limit)
    return catByName[b.category]?.period === 'yearly' ? value / 12 : value
  }

  const totalBudget = useMemo(
    () => budgets.filter((b) => !catByName[b.category]?.is_savings).reduce((sum, b) => sum + monthlyLimit(b), 0),
    [budgets, catByName]
  )
  const totalSpent = useMemo(
    () => expenses.filter((e) => !catByName[e.category]?.is_savings).reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses, catByName]
  )

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
        limit: monthlyLimit(b),
        yearlyLimit: catByName[b.category]?.period === 'yearly' ? Number(b.monthly_limit) : null,
        savings: !!catByName[b.category]?.is_savings,
      }))
      .sort((a, b) => b.spent - a.spent)
  }, [expenses, budgets, catByName])

  const remaining = totalBudget - totalSpent

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowCategories((v) => !v)}
        className="relative w-full overflow-hidden rounded-block bg-cream p-5 text-left"
      >
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
          <p className="mt-5 text-center text-[10px] uppercase tracking-wide text-muted">
            {showCategories ? 'Hide Categories ▲' : 'View Categories ▼'}
          </p>
        </div>
      </button>

      {showCategories && (
        <div className="max-h-80 overflow-y-auto overscroll-contain rounded-block border-2 border-forest">
          {byCategory.map((c, i) => {
            const style = BLOCK_STYLES[i % BLOCK_STYLES.length]
            const over = !c.savings && c.spent > c.limit
            return (
              <div
                key={c.category}
                className={`flex items-center justify-between gap-3 ${style.bg} px-3 py-2.5 ${i > 0 ? 'border-t border-forest/20' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{c.icon}</span>
                  <p className={`text-sm font-semibold ${style.text}`}>{c.category}</p>
                  {over && <span className="text-[9px] font-semibold text-forest-dark">OVER</span>}
                  {c.savings && <span className="text-[9px] font-semibold uppercase opacity-60">Tracking only</span>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold leading-tight ${style.text}`}>{formatINR(c.spent)}</p>
                  {!c.savings && (
                    <p className={`text-[10px] ${style.muted}`}>
                      of {formatINR(c.limit)}
                      {c.yearlyLimit != null && ` (${formatINR(c.yearlyLimit)}/yr)`}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
