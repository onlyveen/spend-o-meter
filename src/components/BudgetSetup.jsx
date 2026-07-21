import { useEffect, useState } from 'react'
import { formatINR } from '../lib/format'

const BLOCK_STYLES = [
  'bg-sage text-ink',
  'bg-forest text-cream',
]

const emptyNewCategory = { name: '', icon: '✦', period: 'monthly', is_savings: false, default_limit: 0 }

export default function BudgetSetup({
  budgets,
  onSave,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  editing = false,
}) {
  const [form, setForm] = useState(budgets)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newCategory, setNewCategory] = useState(emptyNewCategory)
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]))

  useEffect(() => {
    setForm(budgets)
  }, [budgets])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(timer)
  }, [saved])

  const total = form.reduce((sum, b) => {
    if (catByName[b.category]?.is_savings) return sum
    const value = Number(b.monthly_limit) || 0
    return sum + (catByName[b.category]?.period === 'yearly' ? value / 12 : value)
  }, 0)

  const isDirty = form.some((b) => {
    const original = budgets.find((o) => o.category === b.category)
    return (Number(original?.monthly_limit) || 0) !== (Number(b.monthly_limit) || 0)
  })
  const showSaveButton = isDirty || saving || saved

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

  async function handleAddCategory() {
    if (!newCategory.name.trim()) return
    await onAddCategory({ ...newCategory, name: newCategory.name.trim(), default_limit: Number(newCategory.default_limit) || 0 })
    setNewCategory(emptyNewCategory)
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 rounded-block bg-cream p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Add Category</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory.icon}
            onChange={(e) => setNewCategory((f) => ({ ...f, icon: e.target.value }))}
            className="w-12 rounded-md bg-sage/40 px-2 py-2 text-center text-lg outline-none"
            maxLength={2}
          />
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory((f) => ({ ...f, name: e.target.value }))}
            placeholder="Category name"
            className="flex-1 rounded-md bg-sage/40 px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNewCategory((f) => ({ ...f, period: f.period === 'yearly' ? 'monthly' : 'yearly' }))}
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${newCategory.period === 'yearly' ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'}`}
          >
            {newCategory.period === 'yearly' ? 'Yearly' : 'Monthly'}
          </button>
          <button
            type="button"
            onClick={() => setNewCategory((f) => ({ ...f, is_savings: !f.is_savings }))}
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${newCategory.is_savings ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'}`}
          >
            Savings
          </button>
        </div>
        <button
          type="button"
          onClick={handleAddCategory}
          className="w-full rounded-block bg-forest py-2.5 text-sm font-semibold text-cream"
        >
          + Add Category
        </button>
      </div>

      <div className="overflow-hidden rounded-block border-2 border-forest">
        {form.map((b, i) => {
          const cat = catByName[b.category]
          const yearly = cat?.period === 'yearly'
          const savings = !!cat?.is_savings
          return (
            <div key={b.category} className={`flex items-center justify-between gap-3 px-4 py-6 ${BLOCK_STYLES[i % 2]}`}>
              <div className="flex flex-1 items-center gap-2">
                <span className="text-base">{cat?.icon}</span>
                {editing ? (
                  <input
                    type="text"
                    defaultValue={b.category}
                    onBlur={(e) => {
                      const name = e.target.value.trim()
                      if (cat && name && name !== cat.name) onUpdateCategory(cat.id, { name })
                    }}
                    className="w-28 rounded-md bg-black/10 px-2 py-1 text-sm font-medium uppercase tracking-wide outline-none"
                  />
                ) : (
                  <span className="text-sm font-medium uppercase tracking-wide">{b.category}</span>
                )}
                {savings && <span className="text-[9px] font-semibold uppercase opacity-60">Tracking only</span>}
              </div>

              {editing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cat && onUpdateCategory(cat.id, { period: yearly ? 'monthly' : 'yearly' })}
                    className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${yearly ? 'bg-mustard text-ink' : 'bg-black/10'}`}
                  >
                    {yearly ? 'Yearly' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => cat && onUpdateCategory(cat.id, { is_savings: !savings })}
                    className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${savings ? 'bg-mustard text-ink' : 'bg-black/10'}`}
                  >
                    Savings
                  </button>
                  <button
                    type="button"
                    onClick={() => cat && onDeleteCategory(cat.id)}
                    aria-label={`Delete ${b.category}`}
                    className="text-sm opacity-70"
                  >
                    🗑️
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-block bg-cream px-4 py-3 text-sm font-semibold text-ink">
        <span className="uppercase tracking-wide text-muted">Total Variable Budget</span>
        <span>{formatINR(total)}</span>
      </div>

      {showSaveButton && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 md:bottom-[calc(5%+7rem)]">
          <div className="mx-auto flex w-full max-w-xl justify-end px-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              aria-label="Save budget"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-lg text-cream shadow-lg ring-2 ring-cream disabled:opacity-60"
            >
              {saving ? '…' : saved ? '✓' : '💾'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
