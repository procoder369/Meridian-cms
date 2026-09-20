import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email.trim().toLowerCase(), form.password)
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ink-950)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <ShieldCheck className="h-9 w-9 text-[var(--brass-500)]" strokeWidth={1.5} />
          <h1 className="font-serif-display text-2xl font-semibold text-white">Meridian</h1>
          <p className="text-sm text-[var(--ink-400)]">Case &amp; document management</p>
        </div>

        <div className="rounded-xl border border-[var(--ink-700)] bg-[var(--ink-900)] p-7 sm:p-8">
          <h2 className="mb-1 text-lg font-semibold text-white">Sign in</h2>
          <p className="mb-6 text-sm text-[var(--ink-400)]">
            Access is limited to the cases and documents assigned to you.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-[var(--clay-600)]/15 px-3 py-2.5 text-sm text-[var(--clay-100)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--ink-200)]">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@organization.com"
                className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-950)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--ink-400)] outline-none focus:border-[var(--brass-500)]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--ink-200)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-950)] px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[var(--ink-400)] outline-none focus:border-[var(--brass-500)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--ink-400)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-[var(--brass-600)] py-2.5 text-sm font-semibold text-[var(--ink-950)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-400)]">
          New to Meridian?{' '}
          <Link to="/register" className="font-medium text-[var(--brass-500)] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
