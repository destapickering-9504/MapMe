import { useState, useEffect, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import AvatarUpload from '../components/AvatarUpload'

export default function Onboarding(): JSX.Element {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [nameError, setNameError] = useState<string>('')

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async (): Promise<void> => {
    try {
      const user = await getCurrentUser()
      setEmail(user.signInDetails?.loginId || user.username)
    } catch (err) {
      console.error('Failed to load user info:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = (url: string): void => {
    setAvatarUrl(url)
  }

  const handleContinue = async (): Promise<void> => {
    // Validate name
    if (!name.trim()) {
      setNameError('Please enter your name')
      return
    }

    setError('')
    setNameError('')
    setSaving(true)

    try {
      // Get auth token
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('Failed to get authentication token')
      }

      // Save user profile
      const apiUrl = import.meta.env.VITE_API_BASE
      const response = await fetch(`${apiUrl}/user`, {
        method: 'PUT',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl || '',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      // Navigate to home
      navigate('/home')
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = (): void => {
    navigate('/home')
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div>
                    <h2 className="h4 text-secondary mb-2">
                      Welcome to MapMe!
                      <img
                        src="/MapMeLogo.png"
                        alt="MapMe Logo"
                        style={{ width: '60px', height: 'auto' }}
                      />
                    </h2>
                  </div>
                  <p className="text-muted">
                    Hi <strong>{email}</strong>! Let&apos;s personalize your experience.
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <div className="card bg-light border-0">
                    <div className="card-body p-4">
                      <h5 className="card-title text-primary mb-3">
                        <i className="bi bi-person-circle me-2"></i>
                        Your Name
                      </h5>
                      <p className="text-muted mb-3">
                        Tell us your name so we can personalize your MapMe experience.
                      </p>
                      <input
                        type="text"
                        className={`form-control form-control-lg ${nameError ? 'is-invalid' : ''}`}
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setName(e.target.value)
                          setNameError('')
                        }}
                        disabled={saving}
                      />
                      {nameError && <div className="invalid-feedback">{nameError}</div>}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="card bg-light border-0">
                    <div className="card-body p-4">
                      <h5 className="card-title text-primary mb-3">
                        <i className="bi bi-camera me-2"></i>
                        Profile Picture (Optional)
                      </h5>
                      <p className="text-muted mb-3">
                        Add a profile picture to personalize your account. You can always add or
                        change it later from your profile settings.
                      </p>
                      <div className="d-flex justify-content-center">
                        <AvatarUpload onUploadComplete={handleAvatarUpload} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info border-0" role="alert">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-info-circle-fill me-2 mt-1"></i>
                    <div>
                      <strong>Getting Started:</strong>
                      <p className="mb-0 mt-1">
                        MapMe helps you discover amazing places near you. Start exploring locations,
                        save your favorites, and let us learn your preferences to provide better
                        recommendations!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button
                    onClick={handleContinue}
                    className="btn btn-primary btn-lg"
                    type="button"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      'Continue to MapMe'
                    )}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="btn btn-outline-secondary"
                    type="button"
                    disabled={saving}
                  >
                    Skip for Now
                  </button>
                </div>

                <div className="text-center mt-4">
                  <small className="text-muted">
                    You can update your profile anytime from settings
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
