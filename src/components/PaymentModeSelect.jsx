import { useEffect, useRef, useState } from 'react'
import { PAYMENT_MODES, PAYMENT_MODE_ICONS, PAYMENT_MODE_LABELS } from '../lib/constants'

export default function PaymentModeSelect({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(mode) {
    onChange(mode)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={value ? `Payment mode filter: ${PAYMENT_MODE_LABELS[value]}` : 'Filter by payment mode'}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg outline-none ${
          value ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'
        }`}
      >
        {value ? PAYMENT_MODE_ICONS[value] : '💳'}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-block bg-cream shadow-lg">
          <button
            type="button"
            onClick={() => select('')}
            className={`flex w-full items-center px-3 py-2 text-left text-sm ${
              !value ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/30'
            }`}
          >
            All payment modes
          </button>
          {PAYMENT_MODES.map((p) => (
            <button
              type="button"
              key={p.value}
              onClick={() => select(p.value)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                value === p.value ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/30'
              }`}
            >
              <span>{PAYMENT_MODE_ICONS[p.value]}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
