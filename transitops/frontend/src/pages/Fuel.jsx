import { useEffect, useState } from 'react'
import client from '../api/client'
import Topbar from '../components/Topbar'
import { Card, Button, Modal, Field, inputClass, Banner, EmptyState, TableSkeleton } from '../components/UI'
import { DropIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const EMPTY_FUEL = { vehicle_id: '', liters: '', cost: '', date: '' }
const EMPTY_EXPENSE = { vehicle_id: '', type: 'Toll', amount: '', note: '' }

export default function Fuel() {
  const [fuelLogs, setFuelLogs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [tab, setTab] = useState('fuel')
  const [loading, setLoading] = useState(true)
  const [fuelModal, setFuelModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL)
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const canManage = ['admin', 'fleet_manager', 'financial_analyst'].includes(user?.role)

  function load() {
    setLoading(true)
    Promise.all([client.get('/fuel-logs'), client.get('/expenses'), client.get('/vehicles')])
      .then(([f, e, v]) => { setFuelLogs(f.data); setExpenses(e.data); setVehicles(v.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const vehicleName = (id) => vehicles.find((v) => v.id === id)?.registration_number || '—'

  async function handleAddFuel(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/fuel-logs', { ...fuelForm, vehicle_id: Number(fuelForm.vehicle_id), liters: Number(fuelForm.liters), cost: Number(fuelForm.cost), date: fuelForm.date || undefined })
      setFuelModal(false); setFuelForm(EMPTY_FUEL); load()
    } catch (err) { setError(err.response?.data?.detail || 'Could not save fuel log.') }
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/expenses', { ...expenseForm, vehicle_id: Number(expenseForm.vehicle_id), amount: Number(expenseForm.amount) })
      setExpenseModal(false); setExpenseForm(EMPTY_EXPENSE); load()
    } catch (err) { setError(err.response?.data?.detail || 'Could not save expense.') }
  }

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <Topbar
        eyebrow="Module 07"
        title="Fuel & Expenses"
        actions={canManage && (
          tab === 'fuel'
            ? <Button onClick={() => { setError(''); setFuelModal(true) }}>+ Log fuel</Button>
            : <Button onClick={() => { setError(''); setExpenseModal(true) }}>+ Log expense</Button>
        )}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Card className="p-4 flex-1">
            <p className="text-[11.5px] font-mono uppercase tracking-wide text-ink-500">Total fuel cost</p>
            <p className="font-display text-xl font-semibold text-ink-900 mono-figure mt-1">₹{totalFuelCost.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 flex-1">
            <p className="text-[11.5px] font-mono uppercase tracking-wide text-ink-500">Other expenses (tolls, misc)</p>
            <p className="font-display text-xl font-semibold text-ink-900 mono-figure mt-1">₹{totalExpenses.toLocaleString('en-IN')}</p>
          </Card>
        </div>

        <div className="flex gap-1 border-b border-line mb-4">
          {['fuel', 'expenses'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-pine text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
              {t === 'fuel' ? 'Fuel logs' : 'Other expenses'}
            </button>
          ))}
        </div>

        <Card>
          {loading ? (
            <TableSkeleton cols={4} />
          ) : tab === 'fuel' ? (
            fuelLogs.length === 0 ? <EmptyState icon={DropIcon} title="No fuel logs yet" /> : (
              <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[480px]">
                <thead>
                  <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Litres</th>
                    <th className="px-5 py-3 font-medium">Cost</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((f) => (
                    <tr key={f.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                      <td className="px-5 py-3.5 font-mono text-ink-900">{vehicleName(f.vehicle_id)}</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">{f.liters} L</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">₹{f.cost.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-ink-700">{new Date(f.date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )
          ) : (
            expenses.length === 0 ? <EmptyState icon={DropIcon} title="No other expenses logged" /> : (
              <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[560px]">
                <thead>
                  <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Note</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                      <td className="px-5 py-3.5 font-mono text-ink-900">{vehicleName(e.vehicle_id)}</td>
                      <td className="px-5 py-3.5 text-ink-700">{e.type}</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">₹{e.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-ink-500">{e.note || '—'}</td>
                      <td className="px-5 py-3.5 text-ink-700">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )
          )}
        </Card>
      </div>

      <Modal open={fuelModal} onClose={() => setFuelModal(false)} title="Log a fuel fill-up">
        <form onSubmit={handleAddFuel} className="space-y-4">
          <Field label="Vehicle">
            <select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} className={inputClass}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Litres"><input required type="number" min="0" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} className={inputClass} /></Field>
            <Field label="Cost (₹)"><input required type="number" min="0" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} className={inputClass} /></Field>
          </div>
          <Field label="Date"><input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} className={inputClass} /></Field>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFuelModal(false)}>Cancel</Button>
            <Button type="submit">Save fuel log</Button>
          </div>
        </form>
      </Modal>

      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Log an expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Field label="Vehicle">
            <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} className={inputClass}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })} className={inputClass}>
                <option>Toll</option><option>Parking</option><option>Fine</option><option>Other</option>
              </select>
            </Field>
            <Field label="Amount (₹)"><input required type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputClass} /></Field>
          </div>
          <Field label="Note"><input value={expenseForm.note} onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })} className={inputClass} /></Field>
          {error && <Banner tone="rust">{error}</Banner>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setExpenseModal(false)}>Cancel</Button>
            <Button type="submit">Save expense</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
