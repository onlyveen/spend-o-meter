import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useExpenses(month, ready = true) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError('')
    const startDate = `${month}-01`
    const [year, m] = month.split('-').map(Number)
    const endDate = new Date(year, m, 0).toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setExpenses(data ?? [])
    }
    setLoading(false)
  }, [month])

  useEffect(() => {
    if (ready) fetchExpenses()
  }, [fetchExpenses, ready])

  async function addExpense(expense) {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('expenses').insert({
      ...expense,
      user_id: userData.user.id,
    })
    if (error) throw error
    await fetchExpenses()
  }

  async function updateExpense(id, updates) {
    const { error } = await supabase.from('expenses').update(updates).eq('id', id)
    if (error) throw error
    await fetchExpenses()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    await fetchExpenses()
  }

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense, refetch: fetchExpenses }
}
