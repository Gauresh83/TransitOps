const STATUS_STYLES = {
  pending: 'bg-amber-soft text-amber',
  available: 'bg-pine-soft text-pine-dark',
  on_trip: 'bg-amber-soft text-amber',
  in_shop: 'bg-rust-soft text-rust',
  retired: 'bg-ink-900/5 text-ink-500',
  off_duty: 'bg-ink-900/5 text-ink-500',
  suspended: 'bg-rust-soft text-rust',
  draft: 'bg-ink-900/5 text-ink-700',
  dispatched: 'bg-amber-soft text-amber',
  completed: 'bg-pine-soft text-pine-dark',
  cancelled: 'bg-ink-900/5 text-ink-500',
  open: 'bg-rust-soft text-rust',
  resolved: 'bg-pine-soft text-pine-dark',
  closed: 'bg-ink-900/5 text-ink-500',
}

const STATUS_LABELS = {
  pending: 'Pending Approval',
  available: 'Available',
  on_trip: 'On Trip',
  in_shop: 'In Shop',
  retired: 'Retired',
  off_duty: 'Off Duty',
  suspended: 'Suspended',
  draft: 'Draft',
  dispatched: 'Dispatched',
  completed: 'Completed',
  cancelled: 'Cancelled',
  open: 'Open',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-ink-900/5 text-ink-500'
  const label = STATUS_LABELS[status] || status
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
