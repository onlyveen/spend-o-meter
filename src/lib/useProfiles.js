import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useProfiles(ready = true) {
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('id, full_name, email')
    if (!error) {
      setProfiles(Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name || p.email || 'Unknown'])))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (ready) fetchProfiles()
  }, [fetchProfiles, ready])

  return { profiles, loading, refetch: fetchProfiles }
}
