import { useEffect, useState } from 'react'
import { formatINR } from '../lib/format'
import { CATEGORY_ICONS, isYearlyCategory, isSavingsCategory } from '../lib/constants'

const BLOCK_STYLES = [
  'bg-sage text-ink',
  'bg-forest text-cream',
]

export default function BudgetSetup({ budgets, onSave }) {
  const [form, setForm] = useState(budgets)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(budgets)
  }, [budgets])

  const total = form.reduce((sum, b) => {
    if (isSavingsCategory(b.category)) return sum
    const value = Number(b.monthly_limit) || 0
    return sum + (isYearlyCategory(b.category) ? value / 12 : value)
  }, 0)

  function update(category, value) {
    setForm((f) => f.map((b) => (b.category === category ? { ...b, monthly_limit: value } : b)))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form.map((b) => ({ ...b, monthly_limit: Number(b.monthly_limit) || 0 })))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-block border-2 border-forest">
        {form.map((b, i) => {
          const yearly = isYearlyCategory(b.category)
          const savings = isSavingsCategory(b.category)
          return (
            <div key={b.category} className={`flex items-center justify-between gap-3 px-4 py-6 ${BLOCK_STYLES[i % 2]}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{CATEGORY_ICONS[b.category]}</span>
                <span className="text-sm font-medium uppercase tracking-wide">{b.category}</span>
                {savings && <span className="text-[9px] font-semibold uppercase opacity-60">Tracking only</span>}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-sm opacity-70">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={b.monthly_limit}
                    onChange={(e) => update(b.category, e.target.value)}
                    className="w-24 h-10 rounded-md bg-black/10 px-3 py-1 text-left text-lg font-semibold outline-none"
                  />
                  {yearly && <span className="text-[10px] opacity-70">/ yr</span>}
                </div>
                {yearly && (
                  <span className="text-[10px] opacity-60">
                    ≈ {formatINR((Number(b.monthly_limit) || 0) / 12)} / mo
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-block bg-cream px-4 py-3 text-sm font-semibold text-ink">
        <span className="uppercase tracking-wide text-muted">Total Variable Budget</span>
        <span>{formatINR(total)}</span>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-block bg-terracotta py-3 text-sm font-semibold text-cream disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Budget'}
      </button>
    </div>
  )
}
