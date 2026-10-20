import { useEffect, useRef, useState } from 'react'
import {
  IoArrowUp,
  IoAttachOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoMicOutline,
  IoStop,
} from 'react-icons/io5'
import { ThinkingOrb } from 'thinking-orbs'
import { compressImage, parseExpenses, startRecording } from '../lib/aiCapture'
import { PAYMENT_MODES } from '../lib/constants'
import { todayISO } from '../lib/format'
import CategorySelect from './CategorySelect'

const MAX_PHOTOS = 5
const MODES = [
  { id: 'chat', label: 'AI Chat', Icon: IoChatbubbleEllipsesOutline },
  { id: 'manual', label: 'Manual', Icon: IoCreateOutline },
]
const EXAMPLES = ['200 for milk in cash', '450 dinner on UPI yesterday', 'Uber 180, petrol 500 on card']

const fieldClass =
  'w-full rounded-block box-border border-none bg-sage/40 p-2 h-12 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70'

let draftSeq = 0
let messageSeq = 0

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

  // Chat history; each message is { id, from: 'me' | 'ai', text?, images?, voice? }.
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [mode, setMode] = useState('chat')
  // Entries waiting for approval; the first one is the card being edited.
  // In chat mode the card stack replaces the chat while this is non-empty;
  // in manual mode it holds a single blank card.
  const [drafts, setDrafts] = useState([])
  const [batchSize, setBatchSize] = useState(0)
  const [added, setAdded] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // AI capture: 'idle' | 'recording' | 'reading'
  const [aiState, setAiState] = useState('idle')
  const recordingRef = useRef(null)
  // Bumped on every capture/cancel so a cancelled request's result is ignored.
  const requestRef = useRef(0)
  const fileRef = useRef(null)
  const scrollRef = useRef(null)
  // Object URLs shown in the chat, revoked when leaving the screen.
  const urlsRef = useRef([])

  const draft = drafts[0]
  const position = batchSize - drafts.length + 1

  // Drop the in-memory photos/recording when leaving the screen.
  useEffect(
    () => () => {
      recordingRef.current?.cancel()
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, aiState, drafts.length])

  function say(from, message) {
    setMessages((m) => [...m, { id: ++messageSeq, from, ...message }])
  }

  function update(field, value) {
    setDrafts(([first, ...rest]) => [{ ...first, [field]: value }, ...rest])
  }

  function cancelCapture() {
    requestRef.current++
    recordingRef.current?.cancel()
    recordingRef.current = null
    setAiState('idle')
  }

  async function ask(getMedia) {
    const id = ++requestRef.current
    setError('')
    setAiState('reading')
    try {
      const results = await parseExpenses(await getMedia(), categories)
      if (id !== requestRef.current) return
      const incoming = results.map((r) => {
        const base = blankDraft(r.date ?? todayISO())
        return {
          ...base,
          amount: r.amount ? String(r.amount) : '',
          category: r.category ?? base.category,
          payment_mode: r.payment_mode ?? base.payment_mode,
          description: r.description ?? '',
          fromAI: true,
        }
      })
      say('ai', {
        text: `Found ${incoming.length} ${incoming.length === 1 ? 'expense' : 'expenses'}, check the details.`,
      })
      setDrafts(incoming)
      setBatchSize(incoming.length)
      setAdded(0)
      setAiState('idle')
    } catch (err) {
      if (id !== requestRef.current) return
      say('ai', { text: err.message, error: true })
      setAiState('idle')
    }
  }

  function sendText(value = text) {
    const message = value.trim()
    if (!message || aiState !== 'idle') return
    say('me', { text: message })
    setText('')
    ask(() => Promise.resolve({ text: message }))
  }

  function sendPhotos(files) {
    if (!files.length) return
    if (files.length > MAX_PHOTOS) {
      say('ai', { text: `Pick up to ${MAX_PHOTOS} photos at a time`, error: true })
      return
    }
    const urls = files.map((f) => URL.createObjectURL(f))
    urlsRef.current.push(...urls)
    say('me', { images: urls })
    ask(() => Promise.all(files.map((f) => compressImage(f))).then((images) => ({ images })))
  }

  async function startVoice() {
    try {
      recordingRef.current = await startRecording()
      setAiState('recording')
    } catch {
      say('ai', { text: 'Microphone permission is needed for voice entry', error: true })
    }
  }

  function stopVoice() {
    const recording = recordingRef.current
    recordingRef.current = null
    if (!recording) return
    say('me', { voice: true })
    ask(() => recording.stop().then((audio) => ({ audio })))
  }

  function switchMode(id) {
    if (id === mode) return
    cancelCapture()
    setError('')
    setMode(id)
    setDrafts(id === 'manual' ? [blankDraft()] : [])
    setBatchSize(id === 'manual' ? 1 : 0)
  }

  // Move to the next card in the stack, or back to the chat when done.
  function nextDraft(addedNow = added) {
    setError('')
    if (!draft.fromAI) {
      setDrafts([blankDraft(draft.date)])
      return
    }
    if (drafts.length > 1) {
      setDrafts(drafts.slice(1))
      return
    }
    say('ai', {
      text: addedNow
        ? `Added ${addedNow} of ${batchSize} ✓ Anything else?`
        : 'Skipped. Anything else?',
    })
    setDrafts([])
  }

  function discardAll() {
    say('ai', {
      text: added ? `Added ${added}, discarded ${drafts.length}. Anything else?` : 'Discarded. Anything else?',
    })
    setDrafts([])
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
      setAdded(added + 1)
      nextDraft(added + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Hidden while AI cards are waiting so they can't be lost by switching.
  const toggle = !draft?.fromAI && (
    <div role="tablist" className="grid grid-cols-2 gap-1 rounded-block bg-cream p-1">
      {MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          onClick={() => switchMode(id)}
          className={`flex h-11 items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium transition ${mode === id ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/40'
            }`}
        >
          <Icon className="text-base" /> {label}
        </button>
      ))}
    </div>
  )

  if (draft) {
    const stacked = Math.min(drafts.length - 1, 2)
    return (
      <div className="space-y-3">
        {toggle}
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
              {draft.fromAI && (
                <button
                  type="button"
                  onClick={() => nextDraft()}
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

            {draft.fromAI && (
              <button
                type="button"
                onClick={discardAll}
                className="mx-auto flex items-center gap-1 text-xs font-medium text-muted underline"
              >
                <IoCloseOutline /> {drafts.length > 1 ? `Discard remaining ${drafts.length}` : 'Discard'}
              </button>
            )}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {toggle}
      <div className="flex flex-col overflow-hidden rounded-block bg-cream">
        <div ref={scrollRef} className="flex max-h-[50vh] min-h-[16rem] flex-col gap-2 overflow-y-auto p-4">
          <Bubble from="ai">
            Tell me what you spent. Type it, attach a receipt or record a voice note.
          </Bubble>
          {!messages.length && (
            <div className="flex flex-wrap gap-2 pt-1">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => sendText(example)}
                  className="rounded-full border border-sage-dark/50 px-3 py-1.5 text-xs text-ink hover:bg-sage/30"
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => (
            <Bubble key={m.id} from={m.from} error={m.error}>
              {m.images ? (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {m.images.map((url) => (
                    <img key={url} src={url} alt="" className="h-16 w-16 rounded-[10px] object-cover" />
                  ))}
                </div>
              ) : m.voice ? (
                <span className="flex items-center gap-1.5">
                  <IoMicOutline /> Voice note
                </span>
              ) : (
                m.text
              )}
            </Bubble>
          ))}

          {aiState === 'reading' && (
            <Bubble from="ai">
              <span className="flex items-center gap-2">
                <ThinkingOrb state="searching" size={32} theme="light" color="#3D4836" />
                Reading…
                <button type="button" onClick={cancelCapture} className="text-xs text-muted underline">
                  Cancel
                </button>
              </span>
            </Bubble>
          )}
        </div>

        <div className="border-t border-sage/60 p-2">
          {aiState === 'recording' ? (
            <div className="flex h-12 items-center gap-2 rounded-full bg-forest-dark pl-4 pr-1.5 text-cream">
              <ThinkingOrb state="composing" size={32} theme="dark" color="#dec756" />
              <span className="flex-1 text-sm">Listening…</span>
              <button type="button" onClick={cancelCapture} className="px-2 text-xs text-cream/60 underline">
                Cancel
              </button>
              <button
                type="button"
                onClick={stopVoice}
                className="flex h-9 items-center gap-1.5 rounded-full bg-terracotta px-4 text-sm font-semibold"
              >
                <IoStop /> Done
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendText()
              }}
              className="flex items-center gap-1 rounded-full bg-sage/40 p-1.5"
            >
              <IconButton label="Attach photos" onClick={() => fileRef.current?.click()} disabled={aiState !== 'idle'}>
                <IoAttachOutline className="rotate-45" />
              </IconButton>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. 250 lunch on UPI"
                enterKeyHint="send"
                className="min-w-0 flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-muted"
              />
              {text.trim() ? (
                <IconButton label="Send" type="submit" disabled={aiState !== 'idle'} primary>
                  <IoArrowUp />
                </IconButton>
              ) : (
                <IconButton label="Record voice note" onClick={startVoice} disabled={aiState !== 'idle'} primary>
                  <IoMicOutline />
                </IconButton>
              )}
            </form>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = [...(e.target.files ?? [])]
              e.target.value = ''
              sendPhotos(files)
            }}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}

function Bubble({ from, error, children }) {
  const mine = from === 'me'
  return (
    <div
      className={`max-w-[85%] animate-card-in rounded-2xl px-3.5 py-2.5 text-sm ${mine
        ? 'self-end rounded-br-md bg-forest text-cream'
        : `self-start rounded-bl-md ${error ? 'bg-terracotta/20' : 'bg-sage/40'} text-ink`
        }`}
    >
      {children}
    </div>
  )
}

function IconButton({ label, onClick, disabled, primary, type = 'button', children }) {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl disabled:opacity-50 ${primary ? 'bg-terracotta text-cream' : 'text-forest hover:bg-sage/50'
        }`}
    >
      {children}
    </button>
  )
}
