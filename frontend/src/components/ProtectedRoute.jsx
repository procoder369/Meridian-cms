import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--parchment-200)]">
        <div className="flex flex-col items-center gap-3 text-[var(--ink-600)]">
          <ShieldCheck className="h-8 w-8 animate-pulse text-[var(--brass-600)]" />
          <p className="text-sm">Verifying your session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
