import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Sunburst from '../components/Sunburst'

export default function Login() {
  const [mode, setMode] = useState('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      setMessage('Check your inbox for a password reset link.')
      return
    }

    const { error } =
      mode === 'sign_in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'sign_up') {
      setMessage('Account created. Check your inbox to confirm your email, then sign in.')
    }
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
        <img src="/images/logo_for_light_bg.svg" alt="Spendid" className="relative mb-4 h-7 w-auto" />
        <h1 className="relative text-3xl font-bold leading-tight text-ink">
          <span className="text-muted">Track and Spend</span>
          <br />
          Your Money
        </h1>
        <p className="mb-6 mt-2 text-sm text-muted">
          {mode === 'sign_in' && 'Sign in to your account'}
          {mode === 'sign_up' && 'Create your account'}
          {mode === 'forgot' && 'Enter your email to reset your password'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-block bg-sage/40 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:bg-sage/70"
              placeholder="you@example.com"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-xs text-muted">Password</label>
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
          )}

          {error && <p className="text-sm text-forest-dark">{error}</p>}
          {message && <p className="text-sm text-forest">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-block bg-terracotta py-3 text-sm font-semibold text-cream transition disabled:opacity-60"
          >
            {loading
              ? 'Please wait…'
              : mode === 'sign_in'
                ? 'Sign In'
                : mode === 'sign_up'
                  ? 'Sign Up'
                  : 'Send Reset Link'}
          </button>
        </form>

        {mode === 'sign_in' && (
          <button
            onClick={() => {
              setMode('forgot')
              setError('')
              setMessage('')
            }}
            className="mt-3 w-full text-center text-xs text-muted hover:text-ink"
          >
            Forgot password?
          </button>
        )}

        <button
          onClick={() => {
            setMode(mode === 'sign_up' ? 'sign_in' : mode === 'forgot' ? 'sign_in' : 'sign_up')
            setError('')
            setMessage('')
          }}
          className="mt-4 w-full text-center text-sm text-muted hover:text-ink"
        >
          {mode === 'sign_up'
            ? 'Already have an account? Sign in'
            : mode === 'forgot'
              ? 'Back to sign in'
              : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
