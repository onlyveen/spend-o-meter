import { monthLabel, shiftMonth, currentMonthStr } from '../lib/format'
import CategorySelect from './CategorySelect'
import PaymentModeSelect from './PaymentModeSelect'

export default function MonthSwitcher({
  month,
  onChange,
  bare = false,
  showFilters = false,
  categories = [],
  categoryFilter = '',
  onCategoryFilterChange,
  paymentFilter = '',
  onPaymentFilterChange,
  showEditCategories = false,
  editingCategories = false,
  onToggleEditCategories,
}) {
  const isCurrentMonth = month === currentMonthStr()

  return (
    <div
      className={
        bare
          ? 'flex items-center gap-2 px-1 py-2'
          : 'sticky top-2 z-30 flex items-center gap-2 rounded-block bg-cream px-4 py-3 shadow-sm'
      }
    >
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className="text-lg text-muted hover:text-ink"
        aria-label="Previous month"
      >
        ←
      </button>
      <span className="flex-1 truncate text-center text-sm font-semibold uppercase tracking-wide text-ink">
        {monthLabel(month)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrentMonth}
        className="text-lg text-muted hover:text-ink disabled:opacity-30"
        aria-label="Next month"
      >
        →
      </button>

      {showFilters && (
        <div className="flex shrink-0 items-center gap-1.5 border-l border-sage/40 pl-2">
          <CategorySelect value={categoryFilter} onChange={onCategoryFilterChange} categories={categories} compact />
          <PaymentModeSelect value={paymentFilter} onChange={onPaymentFilterChange} />
        </div>
      )}

      {showEditCategories && (
        <div className="flex shrink-0 items-center border-l border-sage/40 pl-2">
          <button
            type="button"
            onClick={onToggleEditCategories}
            aria-label={editingCategories ? 'Done editing categories' : 'Edit categories'}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg outline-none ${
              editingCategories ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'
            }`}
          >
            {editingCategories ? '✓' : '✏️'}
          </button>
        </div>
      )}
    </div>
  )
}
