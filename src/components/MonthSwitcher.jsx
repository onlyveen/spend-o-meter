import { monthLabel, shiftMonth, currentMonthStr } from '../lib/format'

export default function MonthSwitcher({ month, onChange }) {
  const isCurrentMonth = month === currentMonthStr()

  return (
    <div className="flex items-center justify-between rounded-block bg-cream px-4 py-3">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className="text-lg text-muted hover:text-ink"
        aria-label="Previous month"
      >
        ←
      </button>
      <span className="text-sm font-semibold uppercase tracking-wide text-ink">{monthLabel(month)}</span>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrentMonth}
        className="text-lg text-muted hover:text-ink disabled:opacity-30"
        aria-label="Next month"
      >
        →
      </button>
    </div>
  )
}
