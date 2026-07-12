import { useAuth, ROLE_LABELS } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useNavigate } from 'react-router-dom'
import { MenuIcon } from './Icons'

export default function Topbar({ title, eyebrow, actions }) {
  const { user, logout } = useAuth()
  const { toggleMobileNav } = useUI()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={toggleMobileNav}
            className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-line text-ink-700 hover:border-pine/40 hover:text-pine transition-colors mt-0.5"
            aria-label="Open menu"
          >
            <MenuIcon className="w-4.5 h-4.5" />
          </button>
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-mono uppercase tracking-wider text-ink-500 mb-1">{eyebrow}</p>}
            <h1 className="font-display text-lg sm:text-2xl font-semibold text-ink-900 tracking-tight truncate">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {actions}
          <div className="hidden sm:block w-px h-8 bg-line mx-1" />
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-[13px] font-medium text-ink-900">{user?.name}</p>
            <p className="text-[11px] text-ink-500">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-[12px] text-ink-500 hover:text-rust border border-line hover:border-rust/40 rounded-md px-2.5 py-1.5 transition-colors"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="mx-4 sm:mx-6 lg:mx-8 routeline" />
    </header>
  )
}
