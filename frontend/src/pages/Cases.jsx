import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import api from '../services/api'

export default function Cases({ onOpenMobile }) {
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/cases')
      .then((res) => setCases(res.data.cases))
      .catch(() => setError('Could not load your cases from the server.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = cases.filter((c) => {
    const matchesQuery =
      query.trim() === '' ||
      c.caseId.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter
    return matchesQuery && matchesStatus
  })

  return (
    <div className="flex h-full flex-col">
      <Navbar title="Cases" subtitle="Cases currently assigned to your account" onOpenMobile={onOpenMobile} />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by case ID or title"
                className="w-full rounded-md border border-[var(--parchment-300)] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--brass-500)]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[var(--parchment-300)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brass-500)]"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="under review">Under review</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/cases/new')}
            className="flex items-center justify-center gap-2 rounded-md bg-[var(--ink-950)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New case
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-[var(--clay-600)]/30 bg-[var(--clay-100)] px-4 py-3 text-sm text-[var(--clay-600)]">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-[var(--parchment-300)] bg-white">
          {/* Desktop table */}
          <table className="hidden w-full text-left text-sm sm:table">
            <thead className="border-b border-[var(--parchment-300)] bg-[var(--parchment-100)] text-xs uppercase tracking-wide text-[var(--ink-400)]">
              <tr>
                <th className="px-5 py-3 font-medium">Case ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Documents</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.caseId}`)}
                  className="cursor-pointer border-b border-[var(--parchment-300)] last:border-0 hover:bg-[var(--parchment-100)]"
                >
                  <td className="px-5 py-3.5 font-mono-data text-[var(--ink-700)]">{c.caseId}</td>
                  <td className="px-5 py-3.5 font-medium text-[var(--ink-950)]">{c.title}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-600)]">{c.documentCount}</td>
                  <td className="px-5 py-3.5 text-[var(--ink-400)]">{c.updatedAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-[var(--ink-400)]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="divide-y divide-[var(--parchment-300)] sm:hidden">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/cases/${c.caseId}`}
                className="flex items-center justify-between px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="font-mono-data text-xs text-[var(--ink-400)]">{c.caseId}</p>
                  <p className="truncate font-medium text-[var(--ink-950)]">{c.title}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-400)]" />
              </Link>
            ))}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="px-5 py-14 text-center text-sm text-[var(--ink-400)]">
              No cases match your search. Cases only appear here once an administrator assigns
              them to your account.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
