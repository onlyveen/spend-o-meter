import { useMemo } from 'react'
import { formatINR } from '../lib/format'
import { CATEGORY_ICONS } from '../lib/constants'
import Sunburst from './Sunburst'

const BLOCK_STYLES = [
  { bg: 'bg-sage', text: 'text-ink', muted: 'text-ink/60' },
  { bg: 'bg-forest', text: 'text-cream', muted: 'text-cream/60' },
  { bg: 'bg-sage-dark', text: 'text-ink', muted: 'text-ink/60' },
  { bg: 'bg-forest-dark', text: 'text-cream', muted: 'text-cream/70' },
]

export default function Dashboard({ expenses, budgets }) {
  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0), [budgets])
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses])

  const byCategory = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    }
    return budgets
      .map((b) => ({
        category: b.category,
        spent: map[b.category] || 0,
        limit: Number(b.monthly_limit),
      }))
      .sort((a, b) => b.spent - a.spent)
  }, [expenses, budgets])

  const remaining = totalBudget - totalSpent

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-block bg-cream p-5">
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

      <div className="grid grid-cols-3 gap-2">
        {byCategory.map((c, i) => {
          const style = BLOCK_STYLES[i % BLOCK_STYLES.length]
          const over = c.spent > c.limit
          return (
            <div key={c.category} className={`rounded-block border-2 border-forest ${style.bg} p-2.5`}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-base">{CATEGORY_ICONS[c.category]}</span>
                {over && <span className="text-[9px] font-semibold text-forest-dark">OVER</span>}
              </div>
              <p className={`truncate text-[11px] font-semibold ${style.text}`}>{c.category}</p>
              <p className={`mt-0.5 text-sm font-bold leading-tight ${style.text}`}>{formatINR(c.spent)}</p>
              <p className={`truncate text-[10px] ${style.muted}`}>of {formatINR(c.limit)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
