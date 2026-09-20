import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, FolderKanban, FilePlus2, FileLock2, Search, LogOut, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/cases', label: 'Cases', icon: FolderKanban },
  { to: '/cases/new', label: 'New Case', icon: FilePlus2 },
  { to: '/documents', label: 'Documents', icon: FileLock2 },
  { to: '/lookup', label: 'Case Lookup', icon: Search },
]

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-[var(--ink-950)]/60 md:hidden"
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col bg-[var(--ink-950)] text-[var(--ink-200)] transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-[var(--brass-500)]" strokeWidth={1.75} />
            <span className="font-serif-display text-lg font-semibold tracking-tight text-white">
              Meridian
            </span>
          </div>
          <button
            className="text-[var(--ink-400)] md:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--ink-800)] text-white'
                    : 'text-[var(--ink-200)] hover:bg-[var(--ink-900)] hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--ink-700)] px-3 py-4">
          <div className="mb-3 flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brass-600)] font-serif-display text-sm font-semibold text-[var(--ink-950)]">
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
              <p className="truncate text-xs capitalize text-[var(--ink-400)]">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--ink-200)] transition-colors hover:bg-[var(--clay-600)]/20 hover:text-[var(--clay-100)]"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
