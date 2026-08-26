import { useEffect, useMemo, useRef, useState } from 'react'

export default function CategorySelect({
  value,
  onChange,
  categories,
  placeholder = 'All categories',
  className = '',
  compact = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const iconByName = useMemo(() => Object.fromEntries(categories.map((c) => [c.name, c.icon])), [categories])

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

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  function select(category) {
    onChange(category)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={value ? `Category filter: ${value}` : 'Filter by category'}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-lg outline-none ${value ? 'bg-forest text-cream' : 'bg-sage/40 text-ink'
            }`}
        >
          {value ? iconByName[value] : '🏷️'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-block bg-sage/40 p-2 h-12 text-left text-sm text-ink outline-none"
        >
          {value ? (
            <>
              <span>{iconByName[value]}</span>
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </button>
      )}

      {open && (
        <div
          className={`absolute top-full z-20 mt-1 max-h-64 w-56 overflow-hidden rounded-block bg-cream shadow-lg ${compact ? 'right-0' : 'left-0 right-0'
            }`}
        >
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
                className={`flex w-full items-center px-3 py-2 text-left text-sm ${!value ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/30'
                  }`}
              >
                All categories
              </button>
            )}
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-muted">No matches</p>}
            {filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => select(c.name)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${value === c.name ? 'bg-forest text-cream' : 'text-ink hover:bg-sage/30'
                  }`}
              >
                <span>{c.icon}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
