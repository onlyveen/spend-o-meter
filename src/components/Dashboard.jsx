import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatINR } from '../lib/format'
import { CATEGORY_ICONS } from '../lib/constants'
import RadialSpoke from './RadialSpoke'
import TickBars from './TickBars'

const BLOCK_STYLES = [
  { bg: 'bg-mustard', text: 'text-ink', muted: 'text-ink/60' },
  { bg: 'bg-forest', text: 'text-cream', muted: 'text-cream/60' },
]

export default function Dashboard({ expenses, budgets }) {
  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0), [budgets])
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses])

  const byCategory = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    }
    return budgets.map((b) => ({
      category: b.category,
      spent: map[b.category] || 0,
      limit: Number(b.monthly_limit),
    }))
  }, [expenses, budgets])

  const byPaymentMode = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      map[e.payment_mode] = (map[e.payment_mode] || 0) + Number(e.amount)
    }
    return map
  }, [expenses])

  const dailyTrend = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      const day = e.date.slice(8, 10)
      map[day] = (map[day] || 0) + Number(e.amount)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, amount]) => ({ day, amount }))
  }, [expenses])

  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-block bg-cream p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Spent</p>
        <p className="mt-1 text-4xl font-bold text-ink">{formatINR(totalSpent)}</p>
        <div className="mt-2 flex justify-center">
          <RadialSpoke pct={pct} />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-block bg-forest/10 px-3 py-2 text-sm">
          <span className="text-muted">Budget {formatINR(totalBudget)}</span>
          <span className={remaining < 0 ? 'font-semibold text-terracotta' : 'font-semibold text-forest'}>
            {remaining < 0 ? `Over by ${formatINR(-remaining)}` : `${formatINR(remaining)} left`}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {byCategory.map((c, i) => {
          const style = BLOCK_STYLES[i % 2]
          const catPct = c.limit > 0 ? (c.spent / c.limit) * 100 : 0
          const over = c.spent > c.limit
          return (
            <div key={c.category} className={`rounded-block ${style.bg} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_ICONS[c.category]}</span>
                  <span className={`font-semibold ${style.text}`}>{c.category}</span>
                </div>
                {over && <span className="text-xs font-semibold text-terracotta">OVER</span>}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${style.muted}`}>Spent</p>
                  <p className={`text-lg font-bold ${style.text}`}>{formatINR(c.spent)}</p>
                </div>
                <TickBars pct={Math.min(catPct, 100)} count={20} className={style.text} />
                <div className="text-right">
                  <p className={`text-xs uppercase tracking-wide ${style.muted}`}>Budget</p>
                  <p className={`text-lg font-bold ${style.text}`}>{formatINR(c.limit)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {Object.keys(byPaymentMode).length > 0 && (
        <div className="rounded-block bg-cream p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Cash vs Card vs UPI</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-block bg-sage/40 p-3">
              <p className="text-xs text-muted">Cash</p>
              <p className="font-bold text-ink">{formatINR(byPaymentMode.cash || 0)}</p>
            </div>
            <div className="rounded-block bg-sage/40 p-3">
              <p className="text-xs text-muted">Card</p>
              <p className="font-bold text-ink">
                {formatINR((byPaymentMode.credit_card || 0) + (byPaymentMode.debit_card || 0))}
              </p>
            </div>
            <div className="rounded-block bg-sage/40 p-3">
              <p className="text-xs text-muted">UPI</p>
              <p className="font-bold text-ink">{formatINR(byPaymentMode.upi || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {dailyTrend.length > 0 && (
        <div className="rounded-block bg-cream p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Daily Spend Trend</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3D4836" opacity={0.15} />
                <XAxis dataKey="day" fontSize={11} stroke="#6E7460" />
                <YAxis fontSize={11} width={46} stroke="#6E7460" />
                <Tooltip formatter={(value) => formatINR(value)} />
                <Bar dataKey="amount" fill="#3D4836" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
