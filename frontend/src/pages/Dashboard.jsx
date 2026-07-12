import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import client from '../api/client'
import Topbar from '../components/Topbar'
import { Card, KpiCard, KpiCardSkeleton } from '../components/UI'
import { useAuth } from '../context/AuthContext'

const PIE_COLORS = { available: '#1F5C4E', on_trip: '#C97A2C', in_shop: '#B5433A', retired: '#9AA1AC' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    client.get('/dashboard').then((res) => setData(res.data))
  }, [])

  return (
    <>
      <Topbar eyebrow="Overview" title={`Good to see you, ${user?.name?.split(' ')[0]}`} />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {!data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Active Vehicles" value={data.kpis.active_vehicles} sub={`${data.kpis.available_vehicles} available now`} />
              <KpiCard label="Vehicles In Shop" value={data.kpis.vehicles_in_shop} tone="rust" sub="Removed from dispatch pool" />
              <KpiCard label="Active Trips" value={data.kpis.active_trips} tone="amber" sub={`${data.kpis.pending_trips} in draft`} />
              <KpiCard label="Fleet Utilization" value={`${data.kpis.fleet_utilization}%`} tone="pine" sub="Trips vs active vehicles" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <KpiCard label="Drivers On Duty" value={data.kpis.drivers_on_duty} />
              <KpiCard label="Trips Today" value={data.kpis.trips_today} />
              <KpiCard label="Fuel Cost (Total)" value={`₹${data.kpis.fuel_cost_total.toLocaleString('en-IN')}`} />
              <KpiCard label="Maintenance Cost" value={`₹${data.kpis.maintenance_cost_total.toLocaleString('en-IN')}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <Card className="p-4 sm:p-5 lg:col-span-2 animate-fade-in-up">
                <p className="font-display font-medium text-[14px] text-ink-900 mb-4">Trips per month</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.charts.trips_per_month}>
                    <CartesianGrid strokeDasharray="3 5" stroke="#E3E1DA" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#626B79' }} axisLine={{ stroke: '#E3E1DA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#626B79' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#E3E1DA' }} />
                    <Bar dataKey="trips" fill="#1F5C4E" radius={[3, 3, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 sm:p-5 animate-fade-in-up stagger-1">
                <p className="font-display font-medium text-[14px] text-ink-900 mb-4">Fleet by status</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.charts.status_breakdown} dataKey="count" nameKey="status" innerRadius={45} outerRadius={72} paddingAngle={3}>
                      {data.charts.status_breakdown.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[entry.status] || '#9AA1AC'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#E3E1DA' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2.5 justify-center mt-1">
                  {data.charts.status_breakdown.map((s) => (
                    <div key={s.status} className="flex items-center gap-1.5 text-[11px] text-ink-500">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[s.status] || '#9AA1AC' }} />
                      {s.status.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <Card className="p-4 sm:p-5 animate-fade-in-up stagger-2">
                <p className="font-display font-medium text-[14px] text-ink-900 mb-4">Fuel expense trend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.charts.fuel_expense}>
                    <CartesianGrid strokeDasharray="3 5" stroke="#E3E1DA" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#626B79' }} axisLine={{ stroke: '#E3E1DA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#626B79' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#E3E1DA' }} formatter={(v) => `₹${v}`} />
                    <Line type="monotone" dataKey="cost" stroke="#C97A2C" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 sm:p-5 animate-fade-in-up stagger-3">
                <p className="font-display font-medium text-[14px] text-ink-900 mb-4">Completed trips by vehicle</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.charts.vehicle_usage} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 5" stroke="#E3E1DA" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#626B79' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 11, fill: '#626B79' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#E3E1DA' }} />
                    <Bar dataKey="trips" fill="#1F5C4E" radius={[0, 3, 3, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
