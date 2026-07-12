import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  // Close the drawer automatically whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const toggleMobileNav = useCallback(() => setMobileNavOpen((v) => !v), [])
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  return (
    <UIContext.Provider value={{ mobileNavOpen, toggleMobileNav, closeMobileNav }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  return useContext(UIContext)
}
