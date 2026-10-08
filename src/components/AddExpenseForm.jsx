import { useEffect, useRef, useState } from 'react'
import { IoCalendarOutline, IoCameraOutline, IoMicOutline, IoStop } from 'react-icons/io5'
import { compressImage, parseExpense, startRecording } from '../lib/aiCapture'
import { PAYMENT_MODES } from '../lib/constants'
import { todayISO } from '../lib/format'
import CategorySelect from './CategorySelect'

const fieldClass =
  'w-full rounded-block box-border border-none bg-sage/40 p-2 h-12 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70'

export default function AddExpenseForm({ onAdd, categories }) {
  const emptyForm = {
    date: todayISO(),
    amount: '',
    category: categories[0]?.name ?? '',
    payment_mode: 'upi',
    description: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // AI capture: 'idle' | 'recording' | 'reading' | 'review'
  const [aiState, setAiState] = useState('idle')
  const [preview, setPreview] = useState(null)
  const recordingRef = useRef(null)
  const fileRef = useRef(null)

  // Drop the in-memory photo/recording if the user leaves the tab.
  useEffect(() => () => recordingRef.current?.cancel(), [])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function fillFromAI(getMedia) {
    setError('')
    setAiState('reading')
    try {
      const result = await parseExpense(await getMedia(), categories)
      setForm((f) => ({
        date: result.date ?? f.date,
        amount: result.amount ? String(result.amount) : f.amount,
        category: result.category ?? f.category,
        payment_mode: result.payment_mode ?? f.payment_mode,
        description: result.description || f.description,
      }))
      setAiState('review')
    } catch (err) {
      setError(err.message)
      setPreview(null)
      setAiState('idle')
    }
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPreview(URL.createObjectURL(file))
    fillFromAI(() => compressImage(file).then((image) => ({ image })))
  }

  async function handleMic() {
    if (aiState === 'recording') {
      const recording = recordingRef.current
      recordingRef.current = null
      fillFromAI(() => recording.stop().then((audio) => ({ audio })))
      return
    }
    setError('')
    try {
      recordingRef.current = await startRecording()
      setPreview(null)
      setAiState('recording')
    } catch {
      setError('Microphone permission is needed for voice entry')
    }
  }

  function discardAI() {
    setForm({ ...emptyForm, date: form.date })
    setPreview(null)
    setAiState('idle')
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
      setPreview(null)
      setAiState('idle')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-block bg-cream p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">New Entry</p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={aiState === 'reading' || aiState === 'recording'}
          className="flex h-12 items-center justify-center gap-2 rounded-block bg-forest text-sm font-medium text-cream disabled:opacity-60"
        >
          <IoCameraOutline className="text-lg" /> Scan Bill
        </button>
        <button
          type="button"
          onClick={handleMic}
          disabled={aiState === 'reading'}
          className={`flex h-12 items-center justify-center gap-2 rounded-block text-sm font-medium text-cream disabled:opacity-60 ${aiState === 'recording' ? 'bg-terracotta animate-pulse' : 'bg-forest'
            }`}
        >
          {aiState === 'recording' ? (
            <>
              <IoStop className="text-lg" /> Stop
            </>
          ) : (
            <>
              <IoMicOutline className="text-lg" /> Speak
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className="hidden"
        />
      </div>

      {aiState === 'recording' && (
        <p className="text-xs text-muted">Listening… e.g. “450 rupees dinner at Paradise, paid by UPI”. Tap Stop when done.</p>
      )}

      {(aiState === 'reading' || aiState === 'review') && (
        <div className="flex items-center gap-3 rounded-block bg-sage/40 p-2">
          {preview && <img src={preview} alt="" className="h-14 w-14 rounded-block object-cover" />}
          <p className="flex-1 text-xs text-ink">
            {aiState === 'reading' ? 'Reading…' : 'Check the details below, then tap Add Expense.'}
          </p>
          {aiState === 'review' && (
            <button type="button" onClick={discardAI} className="px-2 text-xs font-medium text-muted underline">
              Discard
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Date</label>
          <div className="relative">
            <input
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => update('date', e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className={`${fieldClass} pr-9`}
            />
            <IoCalendarOutline className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-ink" />
          </div>
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
        <CategorySelect
          value={form.category}
          onChange={(c) => update('category', c)}
          categories={categories}
          placeholder="Select category"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Payment Mode</label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_MODES.map((p) => (
            <button
              type="button"
              key={p.value}
              onClick={() => update('payment_mode', p.value)}
              className={`rounded-block p-2 h-12 text-[11px] font-medium ${form.payment_mode === p.value ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'
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

      {error && <p className="text-sm text-forest-dark">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-block bg-terracotta py-3 text-sm font-semibold text-cream transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Add Expense'}
      </button>
    </form>
  )
}
