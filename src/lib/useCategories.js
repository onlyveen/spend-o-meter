import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DEFAULT_CATEGORIES } from './constants'

export function useCategories(ready = true) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if ((data ?? []).length > 0) {
      setCategories(data)
      setLoading(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const rows = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sort_order: i, user_id: userData.user.id }))
    const { data: seeded, error: seedError } = await supabase.from('categories').insert(rows).select()
    if (seedError) {
      setError(seedError.message)
      setLoading(false)
      return
    }
    setCategories(seeded.sort((a, b) => a.sort_order - b.sort_order))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (ready) fetchCategories()
  }, [fetchCategories, ready])

  async function addCategory({ name, icon, period, is_savings, default_limit }) {
    const { data: userData } = await supabase.auth.getUser()
    const sort_order = categories.length ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0
    const { error } = await supabase.from('categories').insert({
      name,
      icon,
      period,
      is_savings,
      default_limit,
      sort_order,
      user_id: userData.user.id,
    })
    if (error) throw error
    await fetchCategories()
  }

  async function updateCategory(id, updates) {
    const existing = categories.find((c) => c.id === id)
    const { error } = await supabase.from('categories').update(updates).eq('id', id)
    if (error) throw error

    if (existing && updates.name && updates.name !== existing.name) {
      const { data: userData } = await supabase.auth.getUser()
      await supabase
        .from('expenses')
        .update({ category: updates.name })
        .eq('user_id', userData.user.id)
        .eq('category', existing.name)
      await supabase
        .from('budget')
        .update({ category: updates.name })
        .eq('user_id', userData.user.id)
        .eq('category', existing.name)
    }

    await fetchCategories()
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  return { categories, loading, error, addCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
