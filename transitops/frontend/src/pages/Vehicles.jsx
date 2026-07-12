import { useEffect, useState } from 'react'
import client from '../api/client'
import Topbar from '../components/Topbar'
import StatusBadge from '../components/StatusBadge'
import { Card, Button, Modal, Field, inputClass, Banner, EmptyState, TableSkeleton } from '../components/UI'
import { TruckIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { registration_number: '', name: '', type: 'Truck', capacity_kg: '', odometer: '', acquisition_cost: '', region: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { user } = useAuth()
  const canManage = ['admin', 'fleet_manager'].includes(user?.role)

  function load() {
    setLoading(true)
    client.get('/vehicles', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setVehicles(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [statusFilter])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(v) {
    setEditing(v)
    setForm({ registration_number: v.registration_number, name: v.name, type: v.type, capacity_kg: v.capacity_kg, odometer: v.odometer, acquisition_cost: v.acquisition_cost, region: v.region })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, capacity_kg: Number(form.capacity_kg), odometer: Number(form.odometer) || 0, acquisition_cost: Number(form.acquisition_cost) || 0 }
      if (editing) {
        const { registration_number, ...updatable } = payload
        await client.put(`/vehicles/${editing.id}`, updatable)
      } else {
        await client.post('/vehicles', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  async function handleDelete(v) {
    if (!confirm(`Remove ${v.registration_number} from the registry?`)) return
    try {
      await client.delete(`/vehicles/${v.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete vehicle.')
    }
  }

  return (
    <>
      <Topbar
        eyebrow="Module 03"
        title="Vehicle Registry"
        actions={
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} !w-auto text-[12.5px] py-1.5`}>
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="in_shop">In Shop</option>
              <option value="retired">Retired</option>
            </select>
            {canManage && <Button onClick={openCreate}>+ Add vehicle</Button>}
          </div>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          {loading ? (
            <TableSkeleton cols={canManage ? 7 : 6} />
          ) : vehicles.length === 0 ? (
            <EmptyState icon={TruckIcon} title="No vehicles yet" hint="Register your first vehicle to begin dispatching trips." action={canManage && <Button onClick={openCreate}>+ Add vehicle</Button>} />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[720px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Registration</th>
                  <th className="px-5 py-3 font-medium">Name / Type</th>
                  <th className="px-5 py-3 font-medium">Capacity</th>
                  <th className="px-5 py-3 font-medium">Odometer</th>
                  <th className="px-5 py-3 font-medium">Region</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                    <td className="px-5 py-3.5 font-mono text-ink-900">{v.registration_number}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink-900 font-medium">{v.name}</p>
                      <p className="text-ink-500 text-[12px]">{v.type}</p>
                    </td>
                    <td className="px-5 py-3.5 mono-figure text-ink-700">{v.capacity_kg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 mono-figure text-ink-700">{v.odometer.toLocaleString()} km</td>
                    <td className="px-5 py-3.5 text-ink-700">{v.region || '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={v.status} /></td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button onClick={() => openEdit(v)} className="text-ink-500 hover:text-pine text-[12.5px]">Edit</button>
                        <button onClick={() => handleDelete(v)} className="text-ink-500 hover:text-rust text-[12.5px]">Delete</button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.registration_number}` : 'Register a vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Registration number">
              <input required disabled={!!editing} value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} className={inputClass} placeholder="UP78-AB-1234" />
            </Field>
            <Field label="Vehicle type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                <option>Truck</option><option>Van</option><option>Pickup</option><option>Trailer</option>
              </select>
            </Field>
          </div>
          <Field label="Vehicle name / model">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Truck-1" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Max capacity (kg)">
              <input required type="number" min="0" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Current odometer (km)">
              <input type="number" min="0" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Acquisition cost (₹)">
              <input type="number" min="0" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Region">
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputClass} placeholder="North" />
            </Field>
          </div>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
