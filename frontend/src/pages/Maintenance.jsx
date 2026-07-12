import { useEffect, useState } from 'react'
import client from '../api/client'
import Topbar from '../components/Topbar'
import StatusBadge from '../components/StatusBadge'
import { Card, Button, Modal, Field, inputClass, Banner, EmptyState, TableSkeleton } from '../components/UI'
import { WrenchIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { vehicle_id: '', issue: '', description: '', cost: '' }

export default function Maintenance() {
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const canManage = ['admin', 'fleet_manager'].includes(user?.role)

  function load() {
    setLoading(true)
    Promise.all([
      client.get('/maintenance'),
      client.get('/vehicles', { params: { status: 'available' } }),
    ]).then(([m, v]) => { setLogs(m.data); setVehicles(v.data) }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/maintenance', { ...form, vehicle_id: Number(form.vehicle_id), cost: Number(form.cost) || 0 })
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not open maintenance record.')
    }
  }

  async function handleResolve(log) {
    try {
      await client.put(`/maintenance/${log.id}`, { status: 'resolved' })
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not close maintenance record.')
    }
  }

  return (
    <>
      <Topbar
        eyebrow="Module 06"
        title="Maintenance"
        actions={canManage && <Button onClick={() => { setForm(EMPTY_FORM); setError(''); setCreateOpen(true) }}>+ Log an issue</Button>}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          {loading ? (
            <TableSkeleton cols={5} />
          ) : logs.length === 0 ? (
            <EmptyState icon={WrenchIcon} title="No maintenance history" hint="Log an issue when a vehicle needs the shop." action={canManage && <Button onClick={() => setCreateOpen(true)}>+ Log an issue</Button>} />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Issue</th>
                  <th className="px-5 py-3 font-medium">Cost</th>
                  <th className="px-5 py-3 font-medium">Opened</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                    <td className="px-5 py-3.5 font-mono text-ink-900">{l.vehicle?.registration_number}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink-900 font-medium">{l.issue}</p>
                      {l.description && <p className="text-ink-500 text-[12px]">{l.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 mono-figure text-ink-700">₹{l.cost.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-ink-700">{new Date(l.opened_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        {l.status === 'in_shop' || l.status === 'open' ? (
                          <button onClick={() => handleResolve(l)} className="text-pine hover:text-pine-dark font-medium text-[12.5px]">Close & return to fleet</button>
                        ) : (
                          <span className="text-ink-300 text-[12.5px]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Log a maintenance issue">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Vehicle" hint="Vehicle switches to In Shop and leaves the dispatch pool immediately">
            <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={inputClass}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>)}
            </select>
          </Field>
          <Field label="Issue">
            <input required value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className={inputClass} placeholder="Oil Leakage" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px]`} placeholder="Additional notes for the workshop…" />
          </Field>
          <Field label="Estimated cost (₹)">
            <input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={inputClass} />
          </Field>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Open record</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
