import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldAlert } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function CaseLookup({ onOpenMobile }) {
  const navigate = useNavigate()
  const [caseId, setCaseId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = caseId.trim()
    if (trimmed) navigate(`/cases/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex h-full flex-col">
      <Navbar
        title="Case Lookup"
        subtitle="Look up any case by its unique ID"
        onOpenMobile={onOpenMobile}
      />

      <div className="flex-1 overflow-y-auto px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink-200)]">
            <Search className="h-5 w-5 text-[var(--ink-700)]" />
          </div>
          <h2 className="font-serif-display text-xl font-semibold text-[var(--ink-950)]">
            Enter a case ID
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-400)]">
            The server checks every lookup against your account. You'll only see documents for
            cases you are assigned to — everything else opens in a locked view.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
            <input
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="e.g. MRD-2026-00147"
              className="flex-1 rounded-md border border-[var(--parchment-300)] bg-white px-3.5 py-2.5 font-mono-data text-sm outline-none focus:border-[var(--brass-500)]"
            />
            <button
              type="submit"
              className="rounded-md bg-[var(--ink-950)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Look up
            </button>
          </form>

          <div className="mx-auto mt-8 flex max-w-md items-start gap-2.5 rounded-md border border-[var(--parchment-300)] bg-white p-4 text-left text-xs text-[var(--ink-400)]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-600)]" />
            <span>
              Every lookup is logged with your account, timestamp, and the case ID requested,
              whether access is granted or denied.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
