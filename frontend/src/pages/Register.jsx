import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'investigator',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 10) {
      setError('Password must be at least 10 characters.')
      return
    }

    setLoading(true)
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account.')
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
          <h2 className="mb-1 text-lg font-semibold text-white">Create your account</h2>
          <p className="mb-6 text-sm text-[var(--ink-400)]">
            An administrator will assign cases to your account after sign-up.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-[var(--clay-600)]/15 px-3 py-2.5 text-sm text-[var(--clay-100)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-[var(--ink-200)]">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Jordan Ellery"
                className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-950)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--ink-400)] outline-none focus:border-[var(--brass-500)]"
              />
            </div>

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
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-[var(--ink-200)]">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-950)] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[var(--brass-500)]"
              >
                <option value="investigator">Investigator</option>
                <option value="paralegal">Paralegal</option>
                <option value="attorney">Attorney</option>
              </select>
              <p className="mt-1 text-xs text-[var(--ink-400)]">
                Administrator accounts are provisioned separately and cannot self-register.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--ink-200)]">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 10 characters"
                  className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-950)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--ink-400)] outline-none focus:border-[var(--brass-500)]"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[var(--ink-200)]">
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-950)] px-3.5 py-2.5 text-sm text-white placeholder-[var(--ink-400)] outline-none focus:border-[var(--brass-500)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-[var(--brass-600)] py-2.5 text-sm font-semibold text-[var(--ink-950)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-400)]">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-[var(--brass-500)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
