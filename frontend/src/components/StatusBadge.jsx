const STYLES = {
  open: 'bg-[var(--teal-100)] text-[var(--teal-600)]',
  'under review': 'bg-[var(--amber-100)] text-[var(--amber-600)]',
  closed: 'bg-[var(--ink-200)] text-[var(--ink-700)]',
  restricted: 'bg-[var(--clay-100)] text-[var(--clay-600)]',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() ?? 'open'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        STYLES[key] ?? STYLES.open
      }`}
    >
      {status}
    </span>
  )
}
