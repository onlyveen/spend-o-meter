import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { shiftMonth } from './format'

export function useMonthlyHistory(month, monthsBack = 6) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const months = Array.from({ length: monthsBack }, (_, i) => shiftMonth(month, -i)).reverse()
      const startDate = `${months[0]}-01`
      const [endYear, endM] = months[months.length - 1].split('-').map(Number)
      const endDate = new Date(endYear, endM, 0).toISOString().slice(0, 10)

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

      const result = months.map((m) => {
        const monthExpenses = (data ?? []).filter((e) => e.date.startsWith(m))
        const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
        return { month: m, total, expenses: monthExpenses }
      })

      setHistory(result)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [month, monthsBack])

  return { history, loading }
}
