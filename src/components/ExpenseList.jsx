import { useMemo, useState } from 'react'
import { PAYMENT_MODES, PAYMENT_MODE_LABELS } from '../lib/constants'
import { formatDateDDMMYYYY, formatINR, todayISO } from '../lib/format'
import CategorySelect from './CategorySelect'

const fieldClass = 'rounded-block bg-sage/40 px-2 py-1.5 text-sm text-ink outline-none'

export default function ExpenseList({
  expenses,
  onUpdate,
  onDelete,
  categories,
  categoryFilter = '',
  paymentFilter = '',
  profiles = {},
  currentUserId = null,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const iconByName = useMemo(() => Object.fromEntries(categories.map((c) => [c.name, c.icon])), [categories])

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false
      if (paymentFilter && e.payment_mode !== paymentFilter) return false
      return true
    })
  }, [expenses, categoryFilter, paymentFilter])

  function startEdit(expense) {
    setEditingId(expense.id)
    setEditForm({
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      payment_mode: expense.payment_mode,
      description: expense.description || '',
    })
  }

  async function saveEdit() {
    await onUpdate(editingId, {
      ...editForm,
      amount: Number(editForm.amount),
      description: editForm.description || null,
    })
    setEditingId(null)
    setEditForm(null)
  }

  return (
    <div className="space-y-3">
      {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted">No expenses found.</p>}

      <div className="overflow-hidden rounded-block bg-cream">
        {filtered.map((expense, i) => (
          <div key={expense.id} className={i > 0 ? 'border-t border-sage/40' : ''}>
            {editingId === expense.id ? (
              <div className="space-y-2 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    max={todayISO()}
                    value={editForm.date}
                    onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CategorySelect
                    value={editForm.category}
                    onChange={(c) => setEditForm((f) => ({ ...f, category: c }))}
                    categories={categories}
                    placeholder="Select category"
                  />
                  <select
                    value={editForm.payment_mode}
                    onChange={(e) => setEditForm((f) => ({ ...f, payment_mode: e.target.value }))}
                    className={fieldClass}
                  >
                    {PAYMENT_MODES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className={`w-full ${fieldClass}`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 rounded-block bg-terracotta py-1.5 text-sm font-semibold text-cream"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 rounded-block bg-sage/40 py-1.5 text-sm text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-block bg-forest text-lg text-cream">
                  {iconByName[expense.category]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {expense.description ? expense.description : ''}
                  </p>
                  <p className="truncate text-xs uppercase tracking-wide text-muted">{expense.category} <small>({PAYMENT_MODE_LABELS[expense.payment_mode]})</small></p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatINR(expense.amount)}</p>
                  <p className="text-xs text-muted">{formatDateDDMMYYYY(expense.date)}</p>
                  {expense.user_id && (
                    <p className="text-[10px] text-muted/70">
                      {expense.user_id === currentUserId ? 'You' : profiles[expense.user_id] || 'Unknown'}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button onClick={() => startEdit(expense)} aria-label="Edit" className="text-xs text-muted">
                    ✏️
                  </button>
                  <button onClick={() => onDelete(expense.id)} aria-label="Delete" className="text-xs text-muted">
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
