import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  IoCalendarOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoImageOutline,
  IoMicOutline,
  IoStop,
} from 'react-icons/io5'
import { compressImage, parseExpenses, startRecording } from '../lib/aiCapture'
import { PAYMENT_MODES } from '../lib/constants'
import { todayISO } from '../lib/format'
import CategorySelect from './CategorySelect'

// WebGL orb is only needed on the Voice tab, so keep `ogl` out of the main bundle.
const Orb = lazy(() => import('./Orb'))

const ORB_COLORS = ['#D9714B', '#E0C53D', '#3D4836'] // terracotta, mustard, forest
const ORB_BACKGROUND = '#2C342A' // forest-dark
const MAX_PHOTOS = 5

const TABS = [
  { id: 'image', label: 'Image', Icon: IoImageOutline },
  { id: 'voice', label: 'Voice', Icon: IoMicOutline },
  { id: 'manual', label: 'Manual', Icon: IoCreateOutline },
]

const fieldClass =
  'w-full rounded-block box-border border-none bg-sage/40 p-2 h-12 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70'

let draftSeq = 0

export default function AddExpenseForm({ onAdd, categories }) {
  const blankDraft = (date = todayISO()) => ({
    key: ++draftSeq,
    date,
    amount: '',
    category: categories[0]?.name ?? '',
    payment_mode: 'upi',
    description: '',
    fromAI: false,
  })

  const [tab, setTab] = useState('manual')
  // Entries waiting for approval; the first one is the card being edited.
  const [drafts, setDrafts] = useState(() => [blankDraft()])
  const [batchSize, setBatchSize] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // AI capture: 'idle' | 'recording' | 'reading'
  const [aiState, setAiState] = useState('idle')
  const [previews, setPreviews] = useState([])
  const recordingRef = useRef(null)
  // Bumped on every capture/cancel so a cancelled request's result is ignored.
  const requestRef = useRef(0)
  const fileRef = useRef(null)

  const draft = drafts[0]
  const position = batchSize - drafts.length + 1

  // Drop the in-memory photos/recording when leaving the screen.
  useEffect(() => () => recordingRef.current?.cancel(), [])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  function update(field, value) {
    setDrafts(([first, ...rest]) => [{ ...first, [field]: value }, ...rest])
  }

  function cancelCapture() {
    requestRef.current++
    recordingRef.current?.cancel()
    recordingRef.current = null
    setPreviews([])
    setAiState('idle')
  }

  function switchTab(id) {
    if (id === tab) return
    cancelCapture()
    setError('')
    setTab(id)
  }

  async function fillFromAI(getMedia) {
    const id = ++requestRef.current
    setError('')
    setAiState('reading')
    try {
      const results = await parseExpenses(await getMedia(), categories)
      if (id !== requestRef.current) return
      const incoming = results.map((r) => {
        const base = blankDraft(r.date ?? draft.date)
        return {
          ...base,
          amount: r.amount ? String(r.amount) : '',
          category: r.category ?? base.category,
          payment_mode: r.payment_mode ?? base.payment_mode,
          description: r.description ?? '',
          fromAI: true,
        }
      })
      // Replace an untouched blank card; otherwise queue behind what's there.
      const untouched = drafts.length === 1 && !draft.fromAI && !draft.amount && !draft.description
      setDrafts(untouched ? incoming : [...drafts, ...incoming])
      setBatchSize(untouched ? incoming.length : batchSize + incoming.length)
      setPreviews([])
      setAiState('idle')
      setTab('manual')
    } catch (err) {
      if (id !== requestRef.current) return
      setError(err.message)
      setPreviews([])
      setAiState('idle')
    }
  }

  function readPhotos(files) {
    if (!files.length) return
    if (files.length > MAX_PHOTOS) {
      setError(`Pick up to ${MAX_PHOTOS} photos at a time`)
      return
    }
    setPreviews(files.map((f) => URL.createObjectURL(f)))
    fillFromAI(() => Promise.all(files.map((f) => compressImage(f))).then((images) => ({ images })))
  }

  async function startVoice() {
    setError('')
    try {
      recordingRef.current = await startRecording()
      setAiState('recording')
    } catch {
      setError('Microphone permission is needed for voice entry')
    }
  }

  function stopVoice() {
    const recording = recordingRef.current
    recordingRef.current = null
    if (recording) fillFromAI(() => recording.stop().then((audio) => ({ audio })))
  }

  // Move to the next card in the stack, or a fresh blank one when done.
  function nextDraft() {
    if (drafts.length > 1) {
      setDrafts(drafts.slice(1))
    } else {
      setDrafts([blankDraft(draft.date)])
      setBatchSize(1)
    }
  }

  function discardAll() {
    setDrafts([blankDraft(draft.date)])
    setBatchSize(1)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(draft.amount)
    if (!amount || amount <= 0) {
      setError('Enter a valid amount')
      return
    }

    setSaving(true)
    try {
      await onAdd({
        date: draft.date,
        amount,
        category: draft.category,
        payment_mode: draft.payment_mode,
        description: draft.description || null,
      })
      nextDraft()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const stacked = Math.min(drafts.length - 1, 2)

  return (
    <div className="space-y-3">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-block bg-cream p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => switchTab(id)}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium transition ${tab === id ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/40'
              }`}
          >
            <Icon className="text-base" /> {label}
            {id === 'manual' && drafts.length > 1 && (
              <span className="rounded-full bg-terracotta px-1.5 text-[10px] font-semibold text-cream">
                {drafts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'image' && (
        <div className="rounded-block bg-cream p-3">
          {aiState === 'reading' ? (
            <div className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-dashed border-sage-dark/50 px-6 py-8 text-center">
              <div className="flex flex-wrap justify-center gap-2">
                {previews.map((url) => (
                  <img key={url} src={url} alt="" className="h-16 w-16 rounded-block object-cover" />
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                Reading…
              </div>
              <p className="text-xs text-muted">Filling in the details for you</p>
              <button type="button" onClick={cancelCapture} className="text-xs font-medium text-muted underline">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                readPhotos([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')))
              }}
              className="flex w-full flex-col items-center gap-2 rounded-[10px] border-2 border-dashed border-sage-dark/50 px-6 py-10 text-center transition hover:bg-sage/20"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/40 text-2xl text-forest">
                <IoImageOutline />
              </span>
              <span className="text-sm font-semibold text-ink">Choose photos</span>
              <span className="text-xs text-muted">Receipts, bills or UPI screenshots · up to {MAX_PHOTOS}</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = [...(e.target.files ?? [])]
              e.target.value = ''
              readPhotos(files)
            }}
            className="hidden"
          />
        </div>
      )}

      {tab === 'voice' && (
        <OrbPanel active={aiState !== 'idle'} onOrbClick={aiState === 'idle' ? startVoice : undefined}>
          {aiState === 'recording' && (
            <>
              <Status title="Listening…" hint="“200 for milk in cash and 450 dinner on UPI”" />
              <PillButton onClick={stopVoice}>
                <IoStop className="text-lg" /> Done
              </PillButton>
              <TextButton onClick={cancelCapture}>Cancel</TextButton>
            </>
          )}
          {aiState === 'reading' && (
            <>
              <Status title="Reading…" hint="Filling in the details for you" />
              <TextButton onClick={cancelCapture}>Cancel</TextButton>
            </>
          )}
          {aiState === 'idle' && (
            <>
              <Status title="Say your expenses" hint="One or many — amount, what for, how you paid" />
              <PillButton onClick={startVoice}>
                <IoMicOutline className="text-lg" /> Tap to Speak
              </PillButton>
            </>
          )}
        </OrbPanel>
      )}

      {tab !== 'manual' && error && <p className="text-center text-sm text-forest-dark">{error}</p>}

      {tab === 'manual' && (
        <div className="relative" style={{ paddingBottom: stacked * 8 }}>
          {/* Cards waiting behind the current one */}
          {stacked >= 2 && <div className="absolute inset-x-6 bottom-0 top-4 rounded-block bg-cream/40" />}
          {stacked >= 1 && (
            <div
              className="absolute inset-x-3 top-2 rounded-block bg-cream/70"
              style={{ bottom: (stacked - 1) * 8 }}
            />
          )}

          <form
            key={draft.key}
            onSubmit={handleSubmit}
            className="relative animate-card-in space-y-3 rounded-block bg-cream p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {batchSize > 1 ? `Entry ${position} of ${batchSize}` : 'New Entry'}
              </p>
              {draft.fromAI && (
                <span className="rounded-full bg-mustard/40 px-2 py-0.5 text-[10px] font-semibold text-ink">
                  Check details
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={draft.date}
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
                  value={draft.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Category</label>
              <CategorySelect
                value={draft.category}
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
                    className={`rounded-block p-2 h-12 text-[11px] font-medium ${draft.payment_mode === p.value ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'
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
                value={draft.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="e.g. Weekly groceries"
                className={fieldClass}
              />
            </div>

            {error && <p className="text-sm text-forest-dark">{error}</p>}

            <div className="flex gap-2">
              {(draft.fromAI || drafts.length > 1) && (
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    nextDraft()
                  }}
                  disabled={saving}
                  className="rounded-block bg-sage/40 px-5 py-3 text-sm font-semibold text-ink disabled:opacity-60"
                >
                  Skip
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-block bg-terracotta py-3 text-sm font-semibold text-cream transition disabled:opacity-60"
              >
                {saving ? 'Saving…' : drafts.length > 1 ? 'Add & Next' : 'Add Expense'}
              </button>
            </div>

            {drafts.length > 1 && (
              <button
                type="button"
                onClick={discardAll}
                className="mx-auto flex items-center gap-1 text-xs font-medium text-muted underline"
              >
                <IoCloseOutline /> Discard remaining {drafts.length}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function OrbPanel({ active, onOrbClick, children }) {
  return (
    <div className="overflow-hidden rounded-block bg-forest-dark text-cream">
      <div
        className={`relative mx-auto aspect-square w-full max-w-[17rem] mix-blend-screen ${onOrbClick ? 'cursor-pointer' : ''}`}
        onClick={onOrbClick}
      >
        <Suspense fallback={null}>
          <Orb
            colors={ORB_COLORS}
            backgroundColor={ORB_BACKGROUND}
            hoverIntensity={0.5}
            forceHoverState={active}
            rotateOnHover
          />
        </Suspense>
      </div>
      <div className="-mt-2 flex flex-col items-center gap-3 px-6 pb-6 text-center">{children}</div>
    </div>
  )
}

function Status({ title, hint }) {
  return (
    <div className="relative">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-cream/60">{hint}</p>
    </div>
  )
}

function PillButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-12 items-center justify-center gap-2 rounded-full bg-terracotta px-7 text-sm font-semibold text-cream"
    >
      {children}
    </button>
  )
}

function TextButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="relative text-xs font-medium text-cream/60 underline">
      {children}
    </button>
  )
}
