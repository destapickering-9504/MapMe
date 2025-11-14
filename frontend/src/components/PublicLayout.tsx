import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

export default function PublicLayout(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async (): Promise<void> => {
    try {
      await getCurrentUser()

      // User is authenticated, check onboarding status
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_BASE
          const response = await fetch(`${apiUrl}/user`, {
            method: 'GET',
            headers: {
              Authorization: token,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const userData = await response.json()
            // Redirect based on onboarding status
            setRedirectTo(userData.onboardingComplete ? '/home' : '/onboarding')
          } else {
            // If API call fails, default to home
            setRedirectTo('/home')
          }
        } catch {
          // If API call fails, default to home
          setRedirectTo('/home')
        }
      }

      setIsAuthenticated(true)
    } catch {
      // User is not authenticated, allow access to public pages
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

  // User is authenticated, redirect to appropriate page
  if (isAuthenticated && redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // User is not authenticated, show public pages
  return (
    <div className="min-vh-100">
      <Outlet />
    </div>
  )
}
