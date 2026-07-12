import { useEffect, useState } from 'react'

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-line rounded-lg shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-pine text-white hover:bg-pine-dark',
    secondary: 'bg-white text-ink-700 border border-line hover:border-ink-300',
    danger: 'bg-white text-rust border border-rust/30 hover:bg-rust-soft',
    ghost: 'text-ink-500 hover:text-ink-900 hover:bg-ink-900/5',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, children, error, hint }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-ink-700 mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-[11.5px] text-ink-500 mt-1">{hint}</span>}
      {error && <span className="block text-[11.5px] text-rust mt-1">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full px-3 py-2 rounded-md border border-line bg-white text-[13.5px] text-ink-900 placeholder:text-ink-300 focus:border-pine focus:ring-1 focus:ring-pine outline-none transition-colors'

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let t
    if (open) {
      setMounted(true)
      // let the element paint closed, then transition open on the next frame
      t = requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      t = setTimeout(() => setMounted(false), 180)
    }
    return () => { cancelAnimationFrame?.(t); clearTimeout(t) }
  }, [open])

  useEffect(() => {
    if (!mounted) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, onClose])

  if (!mounted) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className={`absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-surface border border-line rounded-lg shadow-xl w-full ${width} max-h-[88vh] overflow-y-auto transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between sticky top-0 bg-surface">
          <h2 className="font-display font-semibold text-[16px] text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 w-7 h-7 flex items-center justify-center rounded-md hover:bg-ink-900/5 transition-colors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M5 5l10 10M15 5 5 15" /></svg>
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

export function KpiCard({ label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-ink-900',
    amber: 'text-amber',
    rust: 'text-rust',
    pine: 'text-pine',
  }
  return (
    <Card className="p-4 sm:p-5 transition-shadow hover:shadow-md">
      <p className="text-[11.5px] font-mono uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`font-display text-2xl sm:text-[28px] font-semibold mt-1.5 mono-figure ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[12px] text-ink-500 mt-1">{sub}</p>}
    </Card>
  )
}

export function KpiCardSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-7 w-16 mt-2.5" />
      <div className="skeleton h-3 w-24 mt-2" />
    </Card>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton h-4" style={{ width: c === 0 ? '18%' : `${100 / cols - 4}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, hint, action, icon: Icon }) {
  return (
    <div className="py-14 sm:py-16 text-center px-4 animate-fade-in-up">
      {Icon && (
        <div className="w-11 h-11 rounded-full bg-pine-soft text-pine flex items-center justify-center mx-auto mb-3.5">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <p className="font-display text-[15px] font-medium text-ink-700">{title}</p>
      {hint && <p className="text-[13px] text-ink-500 mt-1 max-w-xs mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Banner({ children, tone = 'rust' }) {
  const tones = {
    rust: 'bg-rust-soft text-rust border-rust/20',
    amber: 'bg-amber-soft text-amber border-amber/20',
    pine: 'bg-pine-soft text-pine-dark border-pine/20',
  }
  return (
    <div className={`px-3.5 py-2.5 rounded-md border text-[13px] animate-fade-in-up ${tones[tone]}`}>
      {children}
    </div>
  )
}
