import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { GridIcon, TruckIcon, UserIcon, RouteIcon, WrenchIcon, DropIcon, ChartIcon, CloseIcon } from './Icons'

const NAV = [
  { to: '/', label: 'Dashboard', icon: GridIcon, roles: null },
  { to: '/vehicles', label: 'Vehicles', icon: TruckIcon, roles: ['admin', 'fleet_manager', 'financial_analyst'] },
  { to: '/drivers', label: 'Drivers', icon: UserIcon, roles: ['admin', 'fleet_manager', 'safety_officer'] },
  { to: '/trips', label: 'Trips', icon: RouteIcon, roles: ['admin', 'fleet_manager', 'safety_officer'] },
  { to: '/maintenance', label: 'Maintenance', icon: WrenchIcon, roles: ['admin', 'fleet_manager', 'safety_officer'] },
  { to: '/fuel', label: 'Fuel & Expenses', icon: DropIcon, roles: ['admin', 'fleet_manager', 'financial_analyst'] },
  { to: '/reports', label: 'Reports', icon: ChartIcon, roles: null },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { mobileNavOpen, closeMobileNav } = useUI()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-[2px] z-40 lg:hidden animate-fade-in"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 sm:w-60 shrink-0 bg-ink-900 text-white/90 flex flex-col h-screen fixed lg:sticky top-0 z-50 lg:z-auto
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-pine flex items-center justify-center">
                <RouteIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-[15px] tracking-tight text-white">TransitOps</span>
            </div>
            <p className="text-[11px] text-white/40 mt-1 pl-9">Fleet Operations Console</p>
          </div>
          <button
            onClick={closeMobileNav}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <CloseIcon className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="mx-5 routeline opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 5px, transparent 5px, transparent 11px)' }} />

        <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
          {NAV.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeMobileNav}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 lg:py-2 rounded-md text-[13.5px] transition-colors ${
                  isActive ? 'bg-white/10 text-white font-medium' : 'text-white/55 hover:text-white/85 hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-[16px] h-[16px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[11px] text-white/35 leading-relaxed">
            Odoo Hackathon Build<br />8-hour sprint
          </p>
        </div>
      </aside>
    </>
  )
}
