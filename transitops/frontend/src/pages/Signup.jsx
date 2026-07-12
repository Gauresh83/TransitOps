import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Field, inputClass, Banner } from '../components/UI'

const EMPTY_FORM = {
  name: '', email: '', password: '',
  license_number: '', license_category: 'LMV', license_expiry: '', contact_number: '',
}

export default function Signup() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { registerDriver } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerDriver(form)
      navigate('/driver')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit your application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex">
      {/* Left: brand / pitch */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] px-14 py-12 relative overflow-hidden">
        <Link to="/login" className="flex items-center gap-2.5 w-fit">
          <div className="w-8 h-8 rounded bg-pine flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" className="w-4.5 h-4.5">
              <circle cx="4.5" cy="15.5" r="2" /><circle cx="15.5" cy="4.5" r="2" />
              <path d="M6.2 14.2 12 8.4M13.8 6.8l-1.5 1.5" strokeDasharray="2.2 2.2" />
            </svg>
          </div>
          <span className="font-display font-semibold text-white text-[17px]">TransitOps</span>
        </Link>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-4">Driver Application</p>
          <h1 className="font-display text-[34px] leading-[1.2] font-semibold text-white max-w-sm">
            Join the roster. Get assigned. Deliver.
          </h1>
          <p className="text-white/50 text-[14px] mt-5 max-w-sm leading-relaxed">
            Submit your license details below. A fleet manager reviews every application —
            once approved, deliveries will show up right in your driver portal.
          </p>
          <ul className="mt-7 space-y-3 max-w-sm">
            {[
              'Fleet manager reviews and approves your application',
              'See every delivery assigned to you in one place',
              'Report a vehicle problem straight to the fleet manager',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-white/70 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-pine mt-1.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/30 text-[11px] font-mono">Odoo Hackathon Build</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-canvas overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded bg-pine flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="font-display font-semibold text-ink-900">TransitOps</span>
          </div>

          <h2 className="font-display text-[22px] font-semibold text-ink-900">Apply as a driver</h2>
          <p className="text-[13px] text-ink-500 mt-1 mb-6">
            Fill in your details — a fleet manager will review and approve your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Rahul Yadav" autoFocus />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email">
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="you@example.com" />
              </Field>
              <Field label="Password">
                <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="••••••••" />
              </Field>
            </div>

            <div className="pt-2 border-t border-line" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="License number">
                <input required value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} className={inputClass} placeholder="UP14-2024-0055667" />
              </Field>
              <Field label="License category">
                <select value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} className={inputClass}>
                  <option>LMV</option><option>HMV</option><option>Transport</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="License expiry">
                <input required type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Contact number">
                <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} className={inputClass} placeholder="+91 98765 43210" />
              </Field>
            </div>

            {error && <Banner tone="rust">{error}</Banner>}

            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? 'Submitting…' : 'Submit application'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-line text-center">
            <p className="text-[13px] text-ink-500">
              Already have an account?{' '}
              <Link to="/login" className="text-pine font-medium hover:text-pine-dark">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
