import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('transitops_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback(async (email, password) => {
    const res = await client.post('/auth/login', { email, password })
    localStorage.setItem('transitops_token', res.data.access_token)
    localStorage.setItem('transitops_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (name, email, password, role) => {
    await client.post('/auth/register', { name, email, password, role })
    // Registration doesn't return a token, so log in right after to get one.
    return login(email, password)
  }, [login])

  const registerDriver = useCallback(async (payload) => {
    const res = await client.post('/auth/register-driver', payload)
    localStorage.setItem('transitops_token', res.data.access_token)
    localStorage.setItem('transitops_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('transitops_token')
    localStorage.removeItem('transitops_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, registerDriver, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  fleet_manager: 'Fleet Manager',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
  driver: 'Driver',
}
