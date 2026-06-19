import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { CATEGORIES, DEFAULT_BUDGETS } from './constants'

export function useBudget(month, ready = true) {
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
    const merged = CATEGORIES.map((category) => ({
      id: byCategory[category]?.id ?? null,
      category,
      month,
      monthly_limit: byCategory[category]?.monthly_limit ?? DEFAULT_BUDGETS[category],
    }))

    setBudgets(merged)
    setLoading(false)
  }, [month])

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

    const { error } = await supabase.from('budget').upsert(rows, { onConflict: 'user_id,category,month' })
    if (error) throw error
    await fetchBudget()
  }

  return { budgets, loading, error, saveBudgets, refetch: fetchBudget }
}
