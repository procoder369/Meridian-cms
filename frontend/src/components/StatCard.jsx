export default function StatCard({ label, value, delta, icon: Icon, accent = 'brass' }) {
  const accents = {
    brass: 'bg-[var(--brass-100)] text-[var(--brass-600)]',
    teal: 'bg-[var(--teal-100)] text-[var(--teal-600)]',
    clay: 'bg-[var(--clay-100)] text-[var(--clay-600)]',
    ink: 'bg-[var(--ink-200)] text-[var(--ink-700)]',
  }

  return (
    <div className="rounded-lg border border-[var(--parchment-300)] bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--ink-400)]">{label}</p>
        {Icon && (
          <span className={`rounded-md p-2 ${accents[accent]}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <p className="mt-3 font-serif-display text-3xl font-semibold text-[var(--ink-950)]">
        {value}
      </p>
      {delta && <p className="mt-1 text-xs text-[var(--ink-400)]">{delta}</p>}
    </div>
  )
}
