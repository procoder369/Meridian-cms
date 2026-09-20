import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Lock, FileText, UploadCloud, ShieldCheck, ArrowLeft, CheckCircle2, Download } from 'lucide-react'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import api from '../services/api'

export default function CaseDetail({ onOpenMobile }) {
  const { caseId } = useParams()
  const [state, setState] = useState({ loading: true, caseData: null, locked: false, notFound: false })
  const [uploadError, setUploadError] = useState('')
  const [uploaded, setUploaded] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadError, setDownloadError] = useState('')
  const fileInputRef = useRef(null)

  // Downloads happen through axios (not a plain <a href>) because the file
  // is behind the JWT auth header, not a public URL. We fetch the bytes,
  // then trigger a normal browser save using a temporary object URL.
  const handleDownload = async (doc) => {
    setDownloadError('')
    setDownloadingId(doc.id)
    try {
      const res = await api.get(`/cases/${caseId}/documents/${doc.id}/download`, {
        responseType: 'blob',
      })
      const blobUrl = window.URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = doc.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text()
        try {
          setDownloadError(JSON.parse(text).message)
        } catch {
          setDownloadError('Download failed.')
        }
      } else {
        setDownloadError(err.response?.data?.message || 'Download failed.')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const loadCase = () => {
    setState((s) => ({ ...s, loading: true }))
    api
      .get(`/cases/${encodeURIComponent(caseId)}`)
      .then((res) => setState({ loading: false, caseData: res.data.case, locked: false, notFound: false }))
      .catch((err) => {
        if (err.response?.status === 403) {
          setState({ loading: false, caseData: err.response.data.case ?? null, locked: true, notFound: false })
        } else if (err.response?.status === 404) {
          setState({ loading: false, caseData: null, locked: false, notFound: true })
        } else {
          setState({ loading: false, caseData: null, locked: false, notFound: false })
        }
      })
  }

  useEffect(loadCase, [caseId])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploaded(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post(`/cases/${caseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploaded(res.data.document)
      loadCase()
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (state.loading) {
    return (
      <div className="flex h-full flex-col">
        <Navbar title="Loading case…" onOpenMobile={onOpenMobile} />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--ink-400)]">
          Verifying access…
        </div>
      </div>
    )
  }

  if (state.notFound) {
    return (
      <div className="flex h-full flex-col">
        <Navbar title="Case not found" onOpenMobile={onOpenMobile} />
        <EmptyState
          icon={FileText}
          title="No case matches this ID"
          body={`We couldn't find a case with ID "${caseId}". Double-check the ID and try again.`}
        />
      </div>
    )
  }

  if (state.locked) {
    return (
      <div className="flex h-full flex-col">
        <Navbar title="Restricted case" onOpenMobile={onOpenMobile} />
        <EmptyState
          icon={Lock}
          title="This case is locked to your account"
          body={
            state.caseData
              ? `Case ${state.caseData.caseId} exists, but its documents are only visible to the assigned user and administrators. If you believe you should have access, ask a case administrator to add you as an assignee.`
              : 'This case exists, but its documents are only visible to the assigned user and administrators.'
          }
          tone="clay"
        />
      </div>
    )
  }

  const c = state.caseData

  return (
    <div className="flex h-full flex-col">
      <Navbar title={c.title} subtitle={c.caseId} onOpenMobile={onOpenMobile} />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <Link to="/cases" className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--ink-600)] hover:text-[var(--ink-950)]">
          <ArrowLeft className="h-4 w-4" /> Back to cases
        </Link>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--parchment-300)] bg-white p-5 lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={c.status} />
              <span className="text-xs text-[var(--ink-400)]">{c.category}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--teal-600)]">
                <ShieldCheck className="h-3.5 w-3.5" /> Access verified for {c.assignee.fullName}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--ink-700)]">{c.description}</p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--parchment-300)] pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--ink-400)]">Case ID</dt>
                <dd className="font-mono-data text-[var(--ink-950)]">{c.caseId}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--ink-400)]">Opened</dt>
                <dd className="text-[var(--ink-950)]">{c.createdAt}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--ink-400)]">Last updated</dt>
                <dd className="text-[var(--ink-950)]">{c.updatedAt}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-[var(--parchment-300)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--ink-950)]">Upload a document</h3>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--parchment-300)] px-4 py-8 text-center hover:border-[var(--brass-500)]">
              <UploadCloud className="h-6 w-6 text-[var(--ink-400)]" />
              <span className="text-xs text-[var(--ink-400)]">
                Click to choose a file. It's hashed with SHA-256 on upload for integrity.
              </span>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            </label>

            {uploadError && (
              <p className="mt-3 text-xs text-[var(--clay-600)]">{uploadError}</p>
            )}
            {uploaded && (
              <div className="mt-3 rounded-md bg-[var(--teal-100)] p-3 text-xs text-[var(--teal-600)]">
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded &amp; verified
                </div>
                <p className="break-all font-mono-data text-[10px] text-[var(--ink-600)]">
                  sha256: {uploaded.sha256Hash}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--parchment-300)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--parchment-300)] px-5 py-3.5">
            <h3 className="text-sm font-semibold text-[var(--ink-950)]">
              Documents ({c.documents.length})
            </h3>
            {downloadError && <p className="text-xs text-[var(--clay-600)]">{downloadError}</p>}
          </div>
          <div className="divide-y divide-[var(--parchment-300)]">
            {c.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                <FileText className="h-4 w-4 shrink-0 text-[var(--ink-400)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-950)]">{doc.fileName}</p>
                  <p className="font-mono-data text-[11px] text-[var(--ink-400)]">
                    sha256:{doc.sha256Hash.slice(0, 16)}… · uploaded {doc.uploadedAt}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[var(--ink-400)]">{doc.sizeLabel}</span>
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="shrink-0 rounded-md border border-[var(--parchment-300)] p-2 text-[var(--ink-600)] hover:border-[var(--brass-500)] hover:text-[var(--brass-600)] disabled:opacity-50"
                  aria-label={`Download ${doc.fileName}`}
                  title="Download (verifies SHA-256 before serving)"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
            {c.documents.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[var(--ink-400)]">
                No documents uploaded to this case yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, body, tone = 'ink' }) {
  const tones = {
    ink: 'bg-[var(--ink-200)] text-[var(--ink-700)]',
    clay: 'bg-[var(--clay-100)] text-[var(--clay-600)]',
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="font-serif-display text-lg font-semibold text-[var(--ink-950)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-400)]">{body}</p>
      <Link to="/cases" className="mt-5 text-sm font-semibold text-[var(--brass-600)] hover:underline">
        ← Back to cases
      </Link>
    </div>
  )
}
