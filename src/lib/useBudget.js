import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useBudget(month, categories, ready = true) {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBudget = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.from('budget').select('*').eq('month', month)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const byCategory = Object.fromEntries((data ?? []).map((b) => [b.category, b]))
    const merged = categories.map((cat) => ({
      id: byCategory[cat.name]?.id ?? null,
      category: cat.name,
      month,
      monthly_limit: byCategory[cat.name]?.monthly_limit ?? cat.default_limit,
    }))

    setBudgets(merged)
    setLoading(false)
  }, [month, categories])

  useEffect(() => {
    if (ready) fetchBudget()
  }, [fetchBudget, ready])

  async function saveBudgets(updatedBudgets) {
    const { data: userData } = await supabase.auth.getUser()
    const rows = updatedBudgets.map((b) => ({
      category: b.category,
      monthly_limit: b.monthly_limit,
      month,
      user_id: userData.user.id,
    }))

    const { error } = await supabase.from('budget').upsert(rows, { onConflict: 'category,month' })
    if (error) throw error
    await fetchBudget()
  }

  return { budgets, loading, error, saveBudgets, refetch: fetchBudget }
}
