import { Menu, Bell } from 'lucide-react'

export default function Navbar({ title, subtitle, onOpenMobile }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--parchment-300)] bg-[var(--parchment-100)] px-4 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          className="text-[var(--ink-700)] md:hidden"
          onClick={onOpenMobile}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="font-serif-display text-xl font-semibold text-[var(--ink-950)] sm:text-2xl">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-[var(--ink-400)]">{subtitle}</p>}
        </div>
      </div>

      <button
        className="relative rounded-full p-2 text-[var(--ink-600)] hover:bg-[var(--parchment-300)]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </header>
  )
}
