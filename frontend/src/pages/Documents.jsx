import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Lock, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Documents({ onOpenMobile }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/documents')
      .then((res) => setItems(res.data.documents))
      .catch(() => setError('Could not load documents from the server.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(
    (d) =>
      query.trim() === '' ||
      d.fileName?.toLowerCase().includes(query.toLowerCase()) ||
      d.caseId.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col">
      <Navbar
        title="Documents"
        subtitle="Every file you can open, plus locked items from other cases"
        onOpenMobile={onOpenMobile}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="relative mb-5 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents or case ID"
            className="w-full rounded-md border border-[var(--parchment-300)] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--brass-500)]"
          />
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-[var(--clay-600)]/30 bg-[var(--clay-100)] px-4 py-3 text-sm text-[var(--clay-600)]">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-[var(--parchment-300)] bg-white">
          <div className="divide-y divide-[var(--parchment-300)]">
            {filtered.map((d) =>
              d.locked ? (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                  <Lock className="h-4 w-4 shrink-0 text-[var(--clay-600)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--ink-700)]">Restricted document</p>
                    <p className="font-mono-data text-[11px] text-[var(--ink-400)]">
                      case {d.caseId} · not assigned to you
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  key={d.id}
                  to={`/cases/${d.caseId}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--parchment-100)]"
                >
                  <FileText className="h-4 w-4 shrink-0 text-[var(--ink-400)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--ink-950)]">{d.fileName}</p>
                    <p className="font-mono-data text-[11px] text-[var(--ink-400)]">
                      case {d.caseId} · sha256:{d.sha256Hash?.slice(0, 16)}… · {d.uploadedAt}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--ink-400)]">{d.sizeLabel}</span>
                </Link>
              )
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-5 py-14 text-center text-sm text-[var(--ink-400)]">
                No documents to show yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
