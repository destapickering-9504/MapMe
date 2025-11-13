import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { getCurrentUser } from 'aws-amplify/auth'
import NavMenu from './NavMenu'
import Sidebar from './Sidebar'

export default function AuthenticatedLayout(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async (): Promise<void> => {
    try {
      await getCurrentUser()
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
    }
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  // Authenticated
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <NavMenu />
        <div style={{ padding: 16 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
