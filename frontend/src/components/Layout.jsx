import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UIProvider } from '../context/UIContext'
import Sidebar from './Sidebar'

export default function Layout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  return (
    <UIProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </UIProvider>
  )
}
