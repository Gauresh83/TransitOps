import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth, ROLE_LABELS } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { Card, Button, Modal, Field, inputClass, Banner, EmptyState } from '../components/UI'
import { RouteIcon, ClockIcon, WrenchIcon, PhoneIcon } from '../components/Icons'

const EMPTY_REPORT = { issue: 'Oil Leakage', description: '' }
const COMMON_ISSUES = ['Oil Leakage', 'Brake Noise', 'Flat Tyre', 'Engine Warning Light', 'AC Not Working', 'Other']

function isExpiringSoon(dateStr) {
  const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)
  return days < 30
}
function isExpired(dateStr) {
  return new Date(dateStr) < new Date()
}

export default function DriverHome() {
  const [profile, setProfile] = useState(null)
  const [trips, setTrips] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportForm, setReportForm] = useState(EMPTY_REPORT)
  const [error, setError] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function load() {
    setLoading(true)
    Promise.all([
      client.get('/drivers/me'),
      client.get('/trips/mine'),
      client.get('/maintenance/mine'),
    ]).then(([p, t, m]) => {
      setProfile(p.data)
      setTrips(t.data)
      setReports(m.data)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const activeTrip = trips.find((t) => t.status === 'dispatched')
  const isPending = profile?.status === 'pending'
  const expired = profile && isExpired(profile.license_expiry)
  const soon = profile && !expired && isExpiringSoon(profile.license_expiry)

  async function handleReport(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/maintenance/report', {
        vehicle_id: activeTrip.vehicle_id,
        issue: reportForm.issue,
        description: reportForm.description,
      })
      setReportOpen(false)
      setReportForm(EMPTY_REPORT)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send your report.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Minimal header — no ops-console nav for drivers */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-pine flex items-center justify-center">
            <RouteIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-[15px] text-ink-900 leading-none">TransitOps</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Driver Portal</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="text-[12px] text-ink-500 hover:text-rust border border-line hover:border-rust/40 rounded-md px-2.5 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>

      {loading ? (
        <p className="text-ink-500 text-sm">Loading your profile…</p>
      ) : !profile ? (
        <Banner tone="rust">We couldn't find a driver profile linked to your account.</Banner>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink-900 tracking-tight">
            {isPending ? `Welcome, ${profile.name.split(' ')[0]}` : `Hey, ${profile.name.split(' ')[0]}`}
          </h1>
          <div className="routeline mt-3 mb-6" />

          {isPending && (
            <Banner tone="amber">
              <p className="font-medium">Your application is awaiting approval.</p>
              <p className="mt-1 text-[12.5px] opacity-90">
                A fleet manager needs to review your license details before you can be assigned deliveries.
                Check back soon — this page will update automatically once you're approved.
              </p>
            </Banner>
          )}

          {/* Profile card */}
          <Card className="p-5 mt-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="font-display font-semibold text-[16px] text-ink-900">{profile.name}</p>
                <p className="text-[12.5px] text-ink-500 font-mono mt-0.5">{profile.license_number} · {profile.license_category}</p>
              </div>
              <StatusBadge status={profile.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-line">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wide text-ink-500">License expiry</p>
                <p className={`text-[13px] mt-1 ${expired ? 'text-rust font-medium' : soon ? 'text-amber font-medium' : 'text-ink-700'}`}>
                  {new Date(profile.license_expiry).toLocaleDateString('en-IN')}
                  {expired && ' — expired'}
                  {soon && ' — expiring soon'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wide text-ink-500">Safety score</p>
                <p className="text-[13px] mt-1 mono-figure text-ink-700">{profile.safety_score}</p>
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wide text-ink-500">Contact</p>
                <p className="text-[13px] mt-1 text-ink-700">{profile.contact_number || '—'}</p>
              </div>
            </div>
          </Card>

          {!isPending && (
            <>
              {/* Active delivery + report issue */}
              <div className="flex items-center justify-between mt-8 mb-3">
                <p className="font-display font-medium text-[14px] text-ink-900">My deliveries</p>
                {activeTrip && (
                  <Button variant="secondary" onClick={() => { setError(''); setReportOpen(true) }}>
                    <WrenchIcon className="w-3.5 h-3.5" /> Report a vehicle problem
                  </Button>
                )}
              </div>

              <Card>
                {trips.length === 0 ? (
                  <EmptyState icon={RouteIcon} title="No deliveries yet" hint="Once a fleet manager assigns you a trip, it will show up here." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] min-w-[560px]">
                      <thead>
                        <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                          <th className="px-5 py-3 font-medium">Route</th>
                          <th className="px-5 py-3 font-medium">Vehicle</th>
                          <th className="px-5 py-3 font-medium">Cargo</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map((t) => (
                          <tr key={t.id} className="border-b border-line last:border-0">
                            <td className="px-5 py-3.5">
                              <p className="text-ink-900 font-medium">{t.source} → {t.destination}</p>
                              <p className="text-ink-500 text-[11.5px] mono-figure">{t.planned_distance} km planned</p>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-ink-700">{t.vehicle?.registration_number}</td>
                            <td className="px-5 py-3.5 mono-figure text-ink-700">{t.cargo_weight.toLocaleString()} kg</td>
                            <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Reported issues */}
              <p className="font-display font-medium text-[14px] text-ink-900 mt-8 mb-3">Issues I've reported</p>
              <Card>
                {reports.length === 0 ? (
                  <EmptyState
                    icon={PhoneIcon}
                    title="No issues reported"
                    hint={activeTrip ? "Notice something wrong with your vehicle? Report it above." : "You can report a problem to your fleet manager while you're on an active delivery."}
                  />
                ) : (
                  <div className="divide-y divide-line">
                    {reports.map((r) => (
                      <div key={r.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-ink-900 font-medium text-[13px]">{r.issue} <span className="text-ink-500 font-normal font-mono">· {r.vehicle?.registration_number}</span></p>
                          {r.description && <p className="text-ink-500 text-[12px] mt-0.5">{r.description}</p>}
                          <p className="text-ink-300 text-[11px] mt-1 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {new Date(r.opened_at).toLocaleString('en-IN')}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report a vehicle problem">
        <form onSubmit={handleReport} className="space-y-4">
          {activeTrip && (
            <p className="text-[12.5px] text-ink-500 -mt-1">
              Reporting for <span className="font-mono text-ink-700">{activeTrip.vehicle?.registration_number}</span> — your fleet manager will be notified right away.
            </p>
          )}
          <Field label="What's wrong?">
            <select value={reportForm.issue} onChange={(e) => setReportForm({ ...reportForm, issue: e.target.value })} className={inputClass}>
              {COMMON_ISSUES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Details" hint="Where it's happening, since when, anything the fleet manager should know.">
            <textarea
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              className={`${inputClass} min-h-[90px]`}
              placeholder="e.g. Oil dripping under the engine since this morning, getting worse."
            />
          </Field>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button type="submit">Send to fleet manager</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
