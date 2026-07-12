import { useEffect, useState } from 'react'
import client from '../api/client'
import Topbar from '../components/Topbar'
import StatusBadge from '../components/StatusBadge'
import { Card, Button, Modal, Field, inputClass, Banner, EmptyState, TableSkeleton } from '../components/UI'
import { UserIcon, ClockIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { name: '', license_number: '', license_category: 'LMV', license_expiry: '', contact_number: '', safety_score: 100 }

function isExpiringSoon(dateStr) {
  const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)
  return days < 30
}
function isExpired(dateStr) {
  return new Date(dateStr) < new Date()
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [pending, setPending] = useState([])
  const [tab, setTab] = useState('roster')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const canManage = ['admin', 'fleet_manager', 'safety_officer'].includes(user?.role)
  const canApprove = ['admin', 'fleet_manager'].includes(user?.role)

  function load() {
    setLoading(true)
    Promise.all([
      client.get('/drivers', { params: { status: 'pending' } }).then((res) => res.data),
      client.get('/drivers').then((res) => res.data.filter((d) => d.status !== 'pending')),
    ]).then(([pendingList, rosterList]) => {
      setPending(pendingList)
      setDrivers(rosterList)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true)
  }
  function openEdit(d) {
    setEditing(d)
    setForm({ name: d.name, license_number: d.license_number, license_category: d.license_category, license_expiry: d.license_expiry.slice(0, 10), contact_number: d.contact_number, safety_score: d.safety_score })
    setError(''); setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, safety_score: Number(form.safety_score) }
      if (editing) {
        const { license_number, ...updatable } = payload
        await client.put(`/drivers/${editing.id}`, updatable)
      } else {
        await client.post('/drivers', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  async function handleDelete(d) {
    if (!confirm(`Remove ${d.name} from the roster?`)) return
    try { await client.delete(`/drivers/${d.id}`); load() }
    catch (err) { alert(err.response?.data?.detail || 'Could not delete driver.') }
  }

  async function toggleSuspend(d) {
    const newStatus = d.status === 'suspended' ? 'available' : 'suspended'
    await client.put(`/drivers/${d.id}`, { status: newStatus })
    load()
  }

  async function handleApprove(d) {
    try { await client.put(`/drivers/${d.id}/approve`); load() }
    catch (err) { alert(err.response?.data?.detail || 'Could not approve this application.') }
  }

  async function handleReject(d) {
    if (!confirm(`Reject ${d.name}'s application? This removes their account.`)) return
    try { await client.delete(`/drivers/${d.id}/reject`); load() }
    catch (err) { alert(err.response?.data?.detail || 'Could not reject this application.') }
  }

  return (
    <>
      <Topbar
        eyebrow="Module 04"
        title="Driver Roster"
        actions={canManage && <Button onClick={openCreate}>+ Add driver</Button>}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {canApprove && (
          <div className="flex gap-1 border-b border-line mb-4">
            {[
              { key: 'roster', label: 'Active roster' },
              { key: 'pending', label: `Pending approval${pending.length ? ` (${pending.length})` : ''}` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-pine text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'pending' && canApprove ? (
          <Card>
            {loading ? (
              <TableSkeleton cols={4} />
            ) : pending.length === 0 ? (
              <EmptyState icon={ClockIcon} title="No pending applications" hint="New driver sign-ups will show up here for review." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[600px]">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Applicant</th>
                      <th className="px-5 py-3 font-medium">License</th>
                      <th className="px-5 py-3 font-medium">Contact</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((d) => (
                      <tr key={d.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                        <td className="px-5 py-3.5 text-ink-900 font-medium">{d.name}</td>
                        <td className="px-5 py-3.5 font-mono text-ink-700 text-[12.5px]">
                          {d.license_number}
                          <span className="block text-ink-500 font-sans text-[11.5px]">{d.license_category} · expires {new Date(d.license_expiry).toLocaleDateString('en-IN')}</span>
                        </td>
                        <td className="px-5 py-3.5 text-ink-700">{d.contact_number || '—'}</td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button onClick={() => handleApprove(d)} className="text-pine hover:text-pine-dark font-medium text-[12.5px]">Approve</button>
                          <button onClick={() => handleReject(d)} className="text-ink-500 hover:text-rust text-[12.5px]">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
        <Card>
          {loading ? (
            <TableSkeleton cols={canManage ? 7 : 6} />
          ) : drivers.length === 0 ? (
            <EmptyState icon={UserIcon} title="No drivers yet" hint="Add a driver to start assigning trips." action={canManage && <Button onClick={openCreate}>+ Add driver</Button>} />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[760px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">License</th>
                  <th className="px-5 py-3 font-medium">Expiry</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Safety score</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const expired = isExpired(d.license_expiry)
                  const soon = !expired && isExpiringSoon(d.license_expiry)
                  return (
                    <tr key={d.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                      <td className="px-5 py-3.5 text-ink-900 font-medium">{d.name}</td>
                      <td className="px-5 py-3.5 font-mono text-ink-700 text-[12.5px]">{d.license_number}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[12.5px] ${expired ? 'text-rust font-medium' : soon ? 'text-amber font-medium' : 'text-ink-700'}`}>
                          {new Date(d.license_expiry).toLocaleDateString('en-IN')}
                        </span>
                        {expired && <span className="block text-[10.5px] text-rust">Expired</span>}
                        {soon && <span className="block text-[10.5px] text-amber">Expiring soon</span>}
                      </td>
                      <td className="px-5 py-3.5 text-ink-700">{d.contact_number || '—'}</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">{d.safety_score}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                      {canManage && (
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button onClick={() => openEdit(d)} className="text-ink-500 hover:text-pine text-[12.5px]">Edit</button>
                          <button onClick={() => toggleSuspend(d)} className="text-ink-500 hover:text-amber text-[12.5px]">
                            {d.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                          </button>
                          <button onClick={() => handleDelete(d)} className="text-ink-500 hover:text-rust text-[12.5px]">Delete</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name}` : 'Add a driver'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Rahul Yadav" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="License number">
              <input required disabled={!!editing} value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} className={inputClass} />
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
            <Field label="Safety score (0–100)">
              <input type="number" min="0" max="100" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Contact number">
            <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} className={inputClass} placeholder="+91 98765 43210" />
          </Field>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add driver'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
