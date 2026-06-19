import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSpendHistory } from '../lib/useSpendHistory'
import { formatINR } from '../lib/format'
import { expensesToCSV, downloadCSV } from '../lib/csv'
import { CATEGORY_ICONS } from '../lib/constants'

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
]

export default function MonthlySummary({ month, expenses, period, onPeriodChange }) {
  const { history, loading } = useSpendHistory(month, period)

  const chartData = useMemo(() => history.map((h) => ({ label: h.label, total: h.total })), [history])

  const biggestCategories = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }, [expenses])

  const cashVsCard = useMemo(() => {
    const map = { cash: 0, credit_card: 0, debit_card: 0, upi: 0 }
    for (const e of expenses) {
      map[e.payment_mode] = (map[e.payment_mode] || 0) + Number(e.amount)
    }
    const cash = map.cash
    const card = map.credit_card + map.debit_card
    const upi = map.upi
    return { cash, card, upi }
  }, [expenses])

  function handleExport() {
    const csv = expensesToCSV(expenses)
    downloadCSV(`spendid-${month}.csv`, csv)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-block bg-cream p-4">
        <div className="mb-3 flex items-center justify-end">
          <div className="flex rounded-full bg-sage/40 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => onPeriodChange(p.key)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  p.key === period ? 'bg-forest text-cream' : 'text-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {!loading && (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3D4836" opacity={0.15} />
                <XAxis dataKey="label" fontSize={11} stroke="#6E7460" />
                <YAxis fontSize={11} width={46} stroke="#6E7460" />
                <Tooltip formatter={(value) => formatINR(value)} />
                <Bar dataKey="total" fill="#E0C53D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-block bg-cream">
        <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Biggest Spend Categories</p>
        <div className="mt-2">
          {biggestCategories.length === 0 && (
            <p className="px-4 pb-4 text-sm text-muted">No expenses this month.</p>
          )}
          {biggestCategories.map(([category, amount], i) => (
            <div
              key={category}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-sage/40' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span>{CATEGORY_ICONS[category]}</span>
                <span className="text-sm text-ink">{category}</span>
              </div>
              <span className="font-semibold text-ink">{formatINR(amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-block bg-cream p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Cash vs Card vs UPI</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-block bg-sage-dark p-3">
            <p className="text-xs text-ink/60">Cash</p>
            <p className="font-bold text-ink">{formatINR(cashVsCard.cash)}</p>
          </div>
          <div className="rounded-block bg-forest p-3">
            <p className="text-xs text-cream/60">Card</p>
            <p className="font-bold text-cream">{formatINR(cashVsCard.card)}</p>
          </div>
          <div className="rounded-block bg-forest-dark p-3">
            <p className="text-xs text-cream/70">UPI</p>
            <p className="font-bold text-cream">{formatINR(cashVsCard.upi)}</p>
          </div>
        </div>
      </div>

      <button onClick={handleExport} className="w-full rounded-block bg-terracotta py-3 text-sm font-semibold text-cream">
        Export to CSV
      </button>
    </div>
  )
}
