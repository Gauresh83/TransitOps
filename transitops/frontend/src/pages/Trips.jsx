import { useEffect, useState } from 'react'
import client from '../api/client'
import Topbar from '../components/Topbar'
import StatusBadge from '../components/StatusBadge'
import { Card, Button, Modal, Field, inputClass, Banner, EmptyState, TableSkeleton } from '../components/UI'
import { RouteIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' }
const EMPTY_COMPLETE = { final_odometer: '', fuel_used: '', fuel_cost: '', toll_cost: '', revenue: '' }

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [completeTrip, setCompleteTrip] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { user } = useAuth()
  const canDispatch = ['admin', 'fleet_manager'].includes(user?.role)

  function load() {
    setLoading(true)
    Promise.all([
      client.get('/trips', { params: statusFilter ? { status: statusFilter } : {} }),
      client.get('/vehicles', { params: { status: 'available' } }),
      client.get('/drivers', { params: { status: 'available' } }),
    ]).then(([t, v, d]) => {
      setTrips(t.data); setVehicles(v.data); setDrivers(d.data)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [statusFilter])

  const selectedVehicle = vehicles.find((v) => v.id === Number(form.vehicle_id))

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/trips', {
        ...form,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: Number(form.cargo_weight),
        planned_distance: Number(form.planned_distance),
      })
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create trip.')
    }
  }

  async function handleDispatch(trip) {
    try { await client.put(`/trips/${trip.id}/dispatch`); load() }
    catch (err) { alert(err.response?.data?.detail || 'Could not dispatch trip.') }
  }

  async function handleCancel(trip) {
    if (!confirm('Cancel this trip? Vehicle and driver will be released.')) return
    try { await client.put(`/trips/${trip.id}/cancel`); load() }
    catch (err) { alert(err.response?.data?.detail || 'Could not cancel trip.') }
  }

  function openComplete(trip) {
    setCompleteTrip(trip)
    setCompleteForm({ ...EMPTY_COMPLETE, final_odometer: trip.vehicle?.odometer || '' })
    setError('')
  }

  async function handleComplete(e) {
    e.preventDefault()
    setError('')
    try {
      await client.put(`/trips/${completeTrip.id}/complete`, {
        final_odometer: Number(completeForm.final_odometer),
        fuel_used: Number(completeForm.fuel_used) || 0,
        fuel_cost: Number(completeForm.fuel_cost) || 0,
        toll_cost: Number(completeForm.toll_cost) || 0,
        revenue: Number(completeForm.revenue) || 0,
      })
      setCompleteTrip(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not complete trip.')
    }
  }

  return (
    <>
      <Topbar
        eyebrow="Module 05 — The Dispatch Board"
        title="Trips"
        actions={
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} !w-auto text-[12.5px] py-1.5`}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {canDispatch && <Button onClick={() => { setForm(EMPTY_FORM); setError(''); setCreateOpen(true) }}>+ New trip</Button>}
          </div>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          {loading ? (
            <TableSkeleton cols={6} />
          ) : trips.length === 0 ? (
            <EmptyState icon={RouteIcon} title="No trips found" hint="Create a trip to dispatch a vehicle and driver." action={canDispatch && <Button onClick={() => setCreateOpen(true)}>+ New trip</Button>} />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[780px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">Cargo</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canDispatch && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                    <td className="px-5 py-3.5">
                      <p className="text-ink-900 font-medium">{t.source} → {t.destination}</p>
                      <p className="text-ink-500 text-[11.5px] mono-figure">{t.planned_distance} km planned</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-ink-700">{t.vehicle?.registration_number}</td>
                    <td className="px-5 py-3.5 text-ink-700">{t.driver?.name}</td>
                    <td className="px-5 py-3.5 mono-figure text-ink-700">{t.cargo_weight.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    {canDispatch && (
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {t.status === 'draft' && (
                          <>
                            <button onClick={() => handleDispatch(t)} className="text-pine hover:text-pine-dark font-medium text-[12.5px]">Dispatch</button>
                            <button onClick={() => handleCancel(t)} className="text-ink-500 hover:text-rust text-[12.5px]">Cancel</button>
                          </>
                        )}
                        {t.status === 'dispatched' && (
                          <>
                            <button onClick={() => openComplete(t)} className="text-pine hover:text-pine-dark font-medium text-[12.5px]">Complete trip</button>
                            <button onClick={() => handleCancel(t)} className="text-ink-500 hover:text-rust text-[12.5px]">Cancel</button>
                          </>
                        )}
                        {(t.status === 'completed' || t.status === 'cancelled') && (
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

      {/* Create Trip Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Dispatch a new trip">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Source"><input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass} placeholder="Delhi" /></Field>
            <Field label="Destination"><input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} placeholder="Kanpur" /></Field>
          </div>
          <Field label="Vehicle" hint={selectedVehicle ? `Max capacity ${selectedVehicle.capacity_kg.toLocaleString()} kg` : 'Only available vehicles are listed'}>
            <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={inputClass}>
              <option value="">Select an available vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>)}
            </select>
          </Field>
          <Field label="Driver" hint="Only available drivers with a valid license are listed">
            <select required value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className={inputClass}>
              <option value="">Select an available driver…</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cargo weight (kg)">
              <input required type="number" min="0" value={form.cargo_weight} onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Planned distance (km)">
              <input required type="number" min="0" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} className={inputClass} />
            </Field>
          </div>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create trip (draft)</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal open={!!completeTrip} onClose={() => setCompleteTrip(null)} title={completeTrip ? `Complete ${completeTrip.source} → ${completeTrip.destination}` : ''}>
        <form onSubmit={handleComplete} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Final odometer (km)">
              <input required type="number" min="0" value={completeForm.final_odometer} onChange={(e) => setCompleteForm({ ...completeForm, final_odometer: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Fuel used (litres)">
              <input required type="number" min="0" value={completeForm.fuel_used} onChange={(e) => setCompleteForm({ ...completeForm, fuel_used: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Fuel cost (₹)">
              <input type="number" min="0" value={completeForm.fuel_cost} onChange={(e) => setCompleteForm({ ...completeForm, fuel_cost: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Toll cost (₹)">
              <input type="number" min="0" value={completeForm.toll_cost} onChange={(e) => setCompleteForm({ ...completeForm, toll_cost: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Revenue (₹)">
              <input type="number" min="0" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} className={inputClass} />
            </Field>
          </div>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCompleteTrip(null)}>Cancel</Button>
            <Button type="submit">Mark completed</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
