import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function toISO(d) {
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d - tzOffset).toISOString().slice(0, 10)
}

function getAnchorDate(month) {
  const [y, m] = month.split('-').map(Number)
  const lastDayOfMonth = new Date(y, m, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return lastDayOfMonth < today ? lastDayOfMonth : today
}

function startOfWeek(d) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday = 0
  date.setDate(date.getDate() - day)
  return date
}

function buildBuckets(period, anchor) {
  if (period === 'daily') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor)
      d.setDate(d.getDate() - (6 - i))
      return { label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), start: d, end: d }
    })
  }
  if (period === 'weekly') {
    const anchorWeekStart = startOfWeek(anchor)
    return Array.from({ length: 6 }, (_, i) => {
      const start = new Date(anchorWeekStart)
      start.setDate(start.getDate() - (5 - i) * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return { label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), start, end }
    })
  }
  if (period === 'yearly') {
    const anchorYear = anchor.getFullYear()
    return Array.from({ length: 4 }, (_, i) => {
      const year = anchorYear - 3 + i
      return { label: String(year), start: new Date(year, 0, 1), end: new Date(year, 11, 31) }
    })
  }
  // monthly
  const anchorMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  return Array.from({ length: 6 }, (_, i) => {
    const start = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - (5 - i), 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return { label: start.toLocaleDateString('en-IN', { month: 'short' }), start, end }
  })
}

export function useSpendHistory(month, period) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const anchor = getAnchorDate(month)
      const buckets = buildBuckets(period, anchor)
      const startDate = toISO(buckets[0].start)
      const endDate = toISO(buckets[buckets.length - 1].end)

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (cancelled) return
      if (error) {
        setHistory([])
        setLoading(false)
        return
      }

      const result = buckets.map((b) => {
        const startISO = toISO(b.start)
        const endISO = toISO(b.end)
        const bucketExpenses = (data ?? []).filter((e) => e.date >= startISO && e.date <= endISO)
        const total = bucketExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
        return { label: b.label, total, expenses: bucketExpenses }
      })

      setHistory(result)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [month, period])

  return { history, loading }
}
