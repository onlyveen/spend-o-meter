import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_ICONS } from '../lib/constants'

export default function CategorySelect({ value, onChange, categories = CATEGORIES, placeholder = 'All categories', className = '' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const filtered = categories.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  function select(category) {
    onChange(category)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-block bg-sage/40 px-3 py-2.5 text-left text-sm text-ink outline-none"
      >
        {value ? (
          <>
            <span>{CATEGORY_ICONS[value]}</span>
            <span className="truncate">{value}</span>
          </>
        ) : (
          <span className="text-muted">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-hidden rounded-block bg-cream shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full border-b border-sage/40 bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
          />
          <div className="max-h-52 overflow-y-auto">
            {placeholder === 'All categories' && (
              <button
                type="button"
                onClick={() => select('')}
                className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                  !value ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/30'
                }`}
              >
                All categories
              </button>
            )}
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-muted">No matches</p>}
            {filtered.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => select(c)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  value === c ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/30'
                }`}
              >
                <span>{CATEGORY_ICONS[c]}</span>
                <span className="truncate">{c}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
