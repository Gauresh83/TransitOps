import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DriverLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'driver') return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-canvas">
      <Outlet />
    </div>
  )
}
