import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_LABELS } from '../context/AuthContext'
import { Button, Field, inputClass, Banner } from '../components/UI'

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager', email: 'fleet@transitops.io', password: 'fleet123' },
  { role: 'Safety Officer', email: 'safety@transitops.io', password: 'safety123' },
  { role: 'Financial Analyst', email: 'finance@transitops.io', password: 'finance123' },
  { role: 'Administrator', email: 'admin@transitops.io', password: 'admin123' },
]

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('fleet_manager')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const isRegister = mode === 'register'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(name, email, password, role)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      const fallback = isRegister
        ? 'Could not create account. Please try again.'
        : 'Could not sign in. Check your credentials.'
      setError(err.response?.data?.detail || fallback)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setPassword('')
  }

  function fillDemo(acc) {
    setMode('signin')
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen bg-ink-900 flex">
      {/* Left: brand / route visual */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] px-14 py-12 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-pine flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" className="w-4.5 h-4.5">
              <circle cx="4.5" cy="15.5" r="2" /><circle cx="15.5" cy="4.5" r="2" />
              <path d="M6.2 14.2 12 8.4M13.8 6.8l-1.5 1.5" strokeDasharray="2.2 2.2" />
            </svg>
          </div>
          <span className="font-display font-semibold text-white text-[17px]">TransitOps</span>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-4">Fleet Operations Console</p>
          <h1 className="font-display text-[38px] leading-[1.15] font-semibold text-white max-w-md">
            Every vehicle, driver, and rupee — tracked in one dispatch board.
          </h1>
          <p className="text-white/50 text-[14px] mt-5 max-w-sm leading-relaxed">
            Replace the spreadsheet logbook with live status on your fleet: who's on the road,
            what's in the shop, and what a trip actually cost.
          </p>
        </div>

        <RouteVisual />
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-canvas">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded bg-pine flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="font-display font-semibold text-ink-900">TransitOps</span>
          </div>

          <h2 className="font-display text-[22px] font-semibold text-ink-900">
            {isRegister ? 'Create an account' : 'Sign in'}
          </h2>
          <p className="text-[13px] text-ink-500 mt-1 mb-6">
            {isRegister ? 'Register to get access to the dispatch dashboard.' : 'Access your dispatch dashboard.'}
          </p>

          {/* Sign in / Register toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-md bg-ink-900/5 border border-line">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-1.5 rounded text-[13px] font-medium transition-colors ${
                !isRegister ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-1.5 rounded text-[13px] font-medium transition-colors ${
                isRegister ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Field label="Full name">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Jane Doe"
                  autoFocus
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@company.com"
                autoFocus={!isRegister}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={isRegister ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
            {isRegister && (
              <Field label="Role">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            )}

            {error && <Banner tone="rust">{error}</Banner>}

            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading
                ? (isRegister ? 'Creating account…' : 'Signing in…')
                : (isRegister ? 'Create account' : 'Sign in')}
            </Button>
          </form>

          {!isRegister && (
            <div className="mt-8 pt-6 border-t border-line">
              <p className="text-[11px] font-mono uppercase tracking-wide text-ink-500 mb-2.5">Demo accounts</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillDemo(acc)}
                    type="button"
                    className="text-left px-2.5 py-2 rounded-md border border-line hover:border-pine/40 hover:bg-pine-soft/40 transition-colors"
                  >
                    <p className="text-[12px] font-medium text-ink-900">{acc.role}</p>
                    <p className="text-[10.5px] text-ink-500 font-mono">{acc.email}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RouteVisual() {
  return (
    <svg viewBox="0 0 380 120" fill="none" className="w-full max-w-md opacity-90">
      <path d="M10 90 C 80 90, 90 30, 160 30 S 260 100, 330 40" stroke="#3A6E62" strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
      <circle cx="10" cy="90" r="4" fill="#1F5C4E" stroke="#8FBFAF" strokeWidth="3" />
      <circle cx="330" cy="40" r="4" fill="#C97A2C" className="pulse-dot" />
      <circle cx="160" cy="30" r="3" fill="#5C6B7A" />
      <text x="0" y="108" fill="#7C8794" fontSize="9" fontFamily="JetBrains Mono">DELHI</text>
      <text x="305" y="58" fill="#7C8794" fontSize="9" fontFamily="JetBrains Mono">KANPUR</text>
    </svg>
  )
}
