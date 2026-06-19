import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Sunburst from '../components/Sunburst'

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    onDone()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage px-5">
      <div className="relative w-full max-w-sm overflow-hidden rounded-block bg-cream p-6">
        <Sunburst
          size={260}
          color="#3D4836"
          opacity={0.12}
          className="pointer-events-none absolute -right-14 -top-14"
        />
        <h1 className="relative text-3xl font-bold leading-tight text-ink">
          <span className="text-muted">Set a new</span>
          <br />
          Password
        </h1>
        <p className="mb-6 mt-2 text-sm text-muted">Choose a new password for your account</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">New password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-block bg-sage/40 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Confirm password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-block bg-sage/40 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-forest-dark">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-block bg-terracotta py-3 text-sm font-semibold text-cream transition disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
