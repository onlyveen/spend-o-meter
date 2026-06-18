import { useState } from 'react'
import { CATEGORIES, PAYMENT_MODES, CATEGORY_ICONS } from '../lib/constants'
import { todayISO } from '../lib/format'

const emptyForm = {
  date: todayISO(),
  amount: '',
  category: CATEGORIES[0],
  payment_mode: 'upi',
  description: '',
}

const fieldClass =
  'w-full rounded-block border-none bg-sage/40 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70'

export default function AddExpenseForm({ onAdd }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      setError('Enter a valid amount')
      return
    }

    setSaving(true)
    try {
      await onAdd({
        date: form.date,
        amount,
        category: form.category,
        payment_mode: form.payment_mode,
        description: form.description || null,
      })
      setForm({ ...emptyForm, date: form.date })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-block bg-cream p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">New Entry</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Date</label>
          <input
            type="date"
            value={form.date}
            max={todayISO()}
            onChange={(e) => update('date', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Amount (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Category</label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => update('category', c)}
              className={`flex flex-col items-center gap-1 rounded-block py-2 text-[10px] font-medium ${
                form.category === c ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'
              }`}
            >
              <span className="text-base">{CATEGORY_ICONS[c]}</span>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Payment Mode</label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_MODES.map((p) => (
            <button
              type="button"
              key={p.value}
              onClick={() => update('payment_mode', p.value)}
              className={`rounded-block py-2 text-[11px] font-medium ${
                form.payment_mode === p.value ? 'bg-mustard text-ink' : 'bg-sage/40 text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Description (optional)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="e.g. Weekly groceries"
          className={fieldClass}
        />
      </div>

      {error && <p className="text-sm text-terracotta">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-block bg-forest py-3 text-sm font-semibold text-cream transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Add Expense'}
      </button>
    </form>
  )
}
