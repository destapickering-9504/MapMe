import { useState, ChangeEvent, FormEvent } from 'react'
import { signIn, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth'
import { Link } from 'react-router-dom'

type Phase = 'signin' | 'forgot' | 'reset'

interface ValidationErrors {
  email?: string
  password?: string
  code?: string
  newPassword?: string
}

export default function SignIn(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('signin')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateSignInForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateForgotPasswordForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateResetPasswordForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!code) {
      errors.code = 'Verification code is required'
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignIn = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})

    if (!validateSignInForm()) {
      return
    }

    setLoading(true)
    try {
      await signIn({ username: email, password })

      // Get auth session to make API call
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('Failed to get authentication token')
      }

      // Check onboarding status
      const apiUrl = import.meta.env.VITE_API_BASE
      const response = await fetch(`${apiUrl}/user`, {
        method: 'GET',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const userData = await response.json()

      // Redirect based on onboarding status
      setSuccess('Sign in successful! Redirecting...')
      setTimeout(() => {
        if (userData.onboardingComplete) {
          window.location.assign('/home')
        } else {
          window.location.assign('/onboarding')
        }
      }, 1500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('User is not confirmed')) {
          setError('Your email is not verified. Please check your email for the verification code.')
        } else if (err.message.includes('Incorrect username or password')) {
          setError('Invalid email or password. Please try again.')
        } else if (err.message.includes('User does not exist')) {
          setError('No account found with this email. Please sign up.')
        } else {
          setError(err.message || 'Failed to sign in. Please try again.')
        }
      } else {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})

    if (!validateForgotPasswordForm()) {
      return
    }

    setLoading(true)
    try {
      await resetPassword({ username: email })
      setPhase('reset')
      setSuccess('Password reset code sent to your email!')
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('User does not exist')) {
          setError('No account found with this email.')
        } else {
          setError(err.message || 'Failed to send reset code. Please try again.')
        }
      } else {
        setError('Failed to send reset code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})

    if (!validateResetPasswordForm()) {
      return
    }

    setLoading(true)
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      })
      setSuccess('Password reset successful! You can now sign in.')
      setPassword('')
      setCode('')
      setNewPassword('')
      setTimeout(() => {
        setPhase('signin')
        setSuccess('')
      }, 2000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid') || err.message.includes('Code')) {
          setError('Invalid verification code. Please check and try again.')
        } else if (err.message.includes('expired')) {
          setError('Verification code has expired. Please request a new one.')
        } else {
          setError(err.message || 'Failed to reset password. Please try again.')
        }
      } else {
        setError('Failed to reset password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const backToSignIn = (): void => {
    setPhase('signin')
    setCode('')
    setNewPassword('')
    setError('')
    setSuccess('')
    setValidationErrors({})
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <h1 className="display-4 fw-bold text-primary mb-0 me-3">MapMe</h1>
                    <img
                      src="/MapMeLogo.png"
                      alt="MapMe Logo"
                      style={{ width: '60px', height: 'auto' }}
                    />
                  </div>
                  {phase === 'signin' && (
                    <>
                      <h2 className="h4 text-secondary mb-2">Welcome Back!</h2>
                      <p className="text-muted">Sign in to your account</p>
                    </>
                  )}
                  {phase === 'forgot' && (
                    <>
                      <h2 className="h4 text-secondary mb-2">Forgot Password?</h2>
                      <p className="text-muted">Enter your email to receive a reset code</p>
                    </>
                  )}
                  {phase === 'reset' && (
                    <>
                      <h2 className="h4 text-secondary mb-2">Reset Password</h2>
                      <p className="text-muted">Enter the code sent to {email}</p>
                    </>
                  )}
                </div>

                {/* Success Alert */}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {phase === 'signin' && (
                  <form onSubmit={handleSignIn}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`form-control form-control-lg ${
                          validationErrors.email ? 'is-invalid' : ''
                        }`}
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setEmail(e.target.value)
                          setValidationErrors({ ...validationErrors, email: undefined })
                        }}
                        disabled={loading}
                        autoComplete="email"
                      />
                      {validationErrors.email && (
                        <div className="invalid-feedback">{validationErrors.email}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <div className="input-group">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          className={`form-control form-control-lg ${
                            validationErrors.password ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setPassword(e.target.value)
                            setValidationErrors({ ...validationErrors, password: undefined })
                          }}
                          disabled={loading}
                          autoComplete="current-password"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#C97D60"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#C97D60"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                        {validationErrors.password && (
                          <div className="invalid-feedback">{validationErrors.password}</div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 text-end">
                      <button
                        type="button"
                        onClick={() => setPhase('forgot')}
                        className="btn btn-link btn-sm p-0"
                        disabled={loading}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="d-grid gap-2 mt-4">
                      <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {phase === 'forgot' && (
                  <form onSubmit={handleForgotPassword}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`form-control form-control-lg ${
                          validationErrors.email ? 'is-invalid' : ''
                        }`}
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setEmail(e.target.value)
                          setValidationErrors({ ...validationErrors, email: undefined })
                        }}
                        disabled={loading}
                        autoComplete="email"
                      />
                      {validationErrors.email && (
                        <div className="invalid-feedback">{validationErrors.email}</div>
                      )}
                    </div>

                    <div className="d-grid gap-2 mt-4">
                      <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Sending Code...
                          </>
                        ) : (
                          'Send Reset Code'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={backToSignIn}
                        className="btn btn-outline-secondary"
                        disabled={loading}
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}

                {phase === 'reset' && (
                  <form onSubmit={handleResetPassword}>
                    <div className="mb-3">
                      <label htmlFor="code" className="form-label">
                        Verification Code
                      </label>
                      <input
                        id="code"
                        type="text"
                        className={`form-control form-control-lg ${
                          validationErrors.code ? 'is-invalid' : ''
                        }`}
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setCode(e.target.value)
                          setValidationErrors({ ...validationErrors, code: undefined })
                        }}
                        disabled={loading}
                        maxLength={6}
                      />
                      {validationErrors.code && (
                        <div className="invalid-feedback">{validationErrors.code}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        New Password
                      </label>
                      <div className="input-group">
                        <input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          className={`form-control form-control-lg ${
                            validationErrors.newPassword ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setNewPassword(e.target.value)
                            setValidationErrors({ ...validationErrors, newPassword: undefined })
                          }}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={loading}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#C97D60"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#C97D60"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                        {validationErrors.newPassword && (
                          <div className="invalid-feedback">{validationErrors.newPassword}</div>
                        )}
                      </div>
                      <small className="text-muted d-block mt-2">
                        Password must be at least 8 characters with uppercase, lowercase, number,
                        and special character
                      </small>
                    </div>

                    <div className="d-grid gap-2 mt-4">
                      <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Resetting Password...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={backToSignIn}
                        className="btn btn-outline-secondary"
                        disabled={loading}
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}

                {phase === 'signin' && (
                  <div className="mt-4 text-center">
                    <small className="text-muted">
                      Don&apos;t have an account?{' '}
                      <Link to="/signup" className="text-primary text-decoration-none">
                        Sign Up
                      </Link>
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
