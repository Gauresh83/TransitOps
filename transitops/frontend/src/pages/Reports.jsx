import { useEffect, useState } from 'react'
import client from '../api/client'
import Topbar from '../components/Topbar'
import { Card, Button, TableSkeleton, EmptyState, KpiCardSkeleton } from '../components/UI'
import { ChartIcon } from '../components/Icons'

export default function Reports() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/reports/fleet').then((res) => setRows(res.data.vehicles)).finally(() => setLoading(false))
  }, [])

  function exportCsv(path, filename) {
    client.get(path, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    })
  }

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
  const totalCost = rows.reduce((s, r) => s + r.operational_cost, 0)

  return (
    <>
      <Topbar
        eyebrow="Module 08"
        title="Reports & Analytics"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportCsv('/reports/fleet.csv', 'fleet_report.csv')}>Export fleet CSV</Button>
            <Button variant="secondary" onClick={() => exportCsv('/reports/trips.csv', 'trips_report.csv')}>Export trips CSV</Button>
          </div>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {loading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <Card className="p-5 animate-fade-in-up">
                <p className="text-[11.5px] font-mono uppercase tracking-wide text-ink-500">Total revenue</p>
                <p className="font-display text-2xl font-semibold text-pine mono-figure mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </Card>
              <Card className="p-5 animate-fade-in-up stagger-1">
                <p className="text-[11.5px] font-mono uppercase tracking-wide text-ink-500">Total operational cost</p>
                <p className="font-display text-2xl font-semibold text-rust mono-figure mt-1">₹{totalCost.toLocaleString('en-IN')}</p>
              </Card>
              <Card className="p-5 animate-fade-in-up stagger-2">
                <p className="text-[11.5px] font-mono uppercase tracking-wide text-ink-500">Net margin</p>
                <p className="font-display text-2xl font-semibold text-ink-900 mono-figure mt-1">₹{(totalRevenue - totalCost).toLocaleString('en-IN')}</p>
              </Card>
            </>
          )}
        </div>

        <Card>
          {loading ? (
            <TableSkeleton cols={8} />
          ) : rows.length === 0 ? (
            <EmptyState icon={ChartIcon} title="No report data yet" hint="Complete a trip to start generating fleet analytics." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[820px]">
                <thead>
                  <tr className="border-b border-line text-left text-ink-500 text-[11.5px] font-mono uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Trips</th>
                    <th className="px-5 py-3 font-medium">Distance</th>
                    <th className="px-5 py-3 font-medium">Fuel efficiency</th>
                    <th className="px-5 py-3 font-medium">Fuel cost</th>
                    <th className="px-5 py-3 font-medium">Maintenance cost</th>
                    <th className="px-5 py-3 font-medium">Revenue</th>
                    <th className="px-5 py-3 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.registration_number} className="border-b border-line last:border-0 hover:bg-canvas/60">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-ink-900">{r.registration_number}</p>
                        <p className="text-ink-500 text-[12px]">{r.name}</p>
                      </td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">{r.completed_trips}</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">{r.total_distance_km.toLocaleString()} km</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">{r.fuel_efficiency_km_per_l || '—'} km/L</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">₹{r.fuel_cost.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">₹{r.maintenance_cost.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 mono-figure text-ink-700">₹{r.revenue.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 mono-figure font-medium" style={{ color: r.roi >= 0 ? '#1F5C4E' : '#B5433A' }}>
                        {(r.roi * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="text-[11.5px] text-ink-500 mt-3">ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition cost</p>
      </div>
    </>
  )
}
