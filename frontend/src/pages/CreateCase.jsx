import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../services/api'

const initialForm = {
  title: '',
  category: 'Civil Litigation',
  description: '',
  assigneeEmail: '',
}

export default function CreateCase({ onOpenMobile }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)
    try {
      const res = await api.post('/cases', form)
      setSuccess(res.data.case)
      setForm(initialForm)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the case.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Navbar title="New Case" subtitle="Every case gets a unique, permanent case ID" onOpenMobile={onOpenMobile} />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl">
          {success && (
            <div className="mb-6 rounded-lg border border-[var(--teal-600)]/30 bg-[var(--teal-100)] p-5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--teal-600)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--teal-600)]">Case created</p>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Case ID{' '}
                    <span className="font-mono-data font-medium">{success.caseId}</span> has been
                    created. Only the assignee can view its documents until you add others.
                  </p>
                  <button
                    onClick={() => navigate(`/cases/${success.caseId}`)}
                    className="mt-3 text-sm font-semibold text-[var(--teal-600)] hover:underline"
                  >
                    Open case →
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-md bg-[var(--clay-100)] px-4 py-3 text-sm text-[var(--clay-600)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-[var(--parchment-300)] bg-white p-6">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-[var(--ink-700)]">
                Case title
              </label>
              <input
                id="title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Halvorsen v. Bright Ridge Logistics"
                className="w-full rounded-md border border-[var(--parchment-300)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brass-500)]"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-[var(--ink-700)]">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-md border border-[var(--parchment-300)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brass-500)]"
              >
                <option>Civil Litigation</option>
                <option>Criminal Defense</option>
                <option>Corporate</option>
                <option>Family Law</option>
                <option>Intellectual Property</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-[var(--ink-700)]">
                Summary
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of the matter"
                className="w-full resize-none rounded-md border border-[var(--parchment-300)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brass-500)]"
              />
            </div>

            <div>
              <label htmlFor="assigneeEmail" className="mb-1.5 block text-sm font-medium text-[var(--ink-700)]">
                Assign to (email)
              </label>
              <input
                id="assigneeEmail"
                name="assigneeEmail"
                type="email"
                required
                value={form.assigneeEmail}
                onChange={handleChange}
                placeholder="colleague@organization.com"
                className="w-full rounded-md border border-[var(--parchment-300)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brass-500)]"
              />
              <p className="mt-1.5 text-xs text-[var(--ink-400)]">
                Only the assignee (and admins) will be able to open documents in this case.
                Everyone else sees the case as locked.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[var(--ink-950)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-6"
            >
              {loading ? 'Creating…' : 'Create case'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
